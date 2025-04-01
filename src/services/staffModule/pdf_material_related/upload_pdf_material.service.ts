import { prisma } from "../../../config/database";
import { formatDateTime } from "../../../utils/commonUtils";
import { AppError } from "../../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../../utils/s3";


interface MaterialUploadData {
    material_title: string;
    batchId: string;
    studentIds: string[];
    material_file_url: string;
}

/**
 * ✅ Upload a Material File and Assign to Students
 */
export const uploadPDFMaterialFileService = async ({
    material_title,
    batchId,
    studentIds,
    material_file_url,
}: MaterialUploadData): Promise<MaterialUploadData> => {
    // ✅ Step 1: Create Material File Entry
    const material = await prisma.materialFileDetail.create({
        data: {
            material_file_name: material_title,
            batch_id: batchId,
            material_file_url,
        },
    });

    // ✅ Step 2: Assign Material to Students (who have paid fees)
    const selectedStudents = await prisma.batchWithStudent.findMany({
        where: {
            batch_id: batchId,
            student_id: { in: studentIds },
            deletedAt: null, // Exclude soft deleted records
        },
        select: { student_id: true },
    });

    if (selectedStudents.length === 0) {
        throw new AppError({ statusCode: 400, message: "No students found!" });
    }

    const assignedStudents = selectedStudents
        .filter((student) => studentIds.includes(student.student_id)) // Ensure only selected students get access
        .map((student) => ({
            student_id: student.student_id,
            material_id: material.id,
            access_granted: true,
        }));

    await prisma.studentMaterialAccess.createMany({
        data: assignedStudents,
        skipDuplicates: true,
    });

    const studentIdsArray = assignedStudents.map(student => student.student_id);

    return {
        material_title: material.material_file_name,
        batchId: material.batch_id,
        studentIds: studentIdsArray,
        material_file_url: material.material_file_url,
    }
};
