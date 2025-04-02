import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";

interface MaterialUploadData {
    material_title: string;
    batchId?: string | null;
    studentIds: string[];
    material_file_url: string;
}

/**
 * ✅ Upload a Material File and Assign to Students
 */
export const uploadPDFMaterialFileService = async ({
    material_title,
    batchId,
    studentIds = [],
    material_file_url,
}: MaterialUploadData): Promise<MaterialUploadData> => {
    // ✅ Step 1: Fetch Students Assigned to the Batch
    const selectedStudents = await prisma.batchWithStudent.findMany({
        where: {
            batch_id: batchId!,
            student_id: { in: studentIds },
            deletedAt: null, // Exclude soft deleted records
        },
        select: { student_id: true },
    });

    if (!selectedStudents.length) {
        throw new AppError({ statusCode: 400, message: "No students found!" });
    }

    // ✅ Step 2: Create Material File Entry
    const material = await prisma.materialFileDetail.create({
        data: {
            material_title: material_title,
            batch_id: batchId ? batchId : null,
            material_file_url,
            status: (!batchId && !studentIds.length) ? 'draft' : 'published',
        },
    });

    if (!material.batch_id && studentIds.length === 0) {
        return {
            material_title: material.material_title,
            batchId: null,
            studentIds: [],
            material_file_url: material.material_file_url,
        };
    }

    // ✅ Step 3: Assign Material to Students
    const assignedStudents = selectedStudents.map(({ student_id }) => ({
        student_id,
        material_id: material.id,
        access_granted: true,
    }));

    await prisma.studentMaterialAccess.createMany({
        data: assignedStudents,
        skipDuplicates: true, // Prevent duplicate entries
    });

    return {
        material_title: material.material_title,
        batchId: material.batch_id,
        studentIds: assignedStudents.map(({ student_id }) => student_id),
        material_file_url: material.material_file_url,
    };
};
