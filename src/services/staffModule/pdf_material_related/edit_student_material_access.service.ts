import { CommonUserRole } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { moveFileInS3 } from "../../../utils/s3"; // Utility functions

interface EditStudentMaterialAccessRequestData {
    material_id: string;
    batchId: string;
    studentIds: string[];
    role: CommonUserRole,
    userId: string
}

interface EditStudentMaterialAccessResponseData {
    material_title: string;
    batchId: string;
    studentIds: string[];
    material_file_url: string;
}

/**
 * ✅ Edit Student Material File Access Service (Moves file when published)
 */
export const EditStudentMaterialFileAccessService = async ({
    material_id,
    batchId,
    studentIds,
    role,
    userId
}: EditStudentMaterialAccessRequestData): Promise<EditStudentMaterialAccessResponseData> => {

    // ✅ Validate Inputs
    if (!batchId) throw new AppError({ statusCode: 400, message: "Batch ID is required." });
    if (!studentIds.length) throw new AppError({ statusCode: 400, message: "At least one student must be selected.", data: {} });

    // ✅ Step 1: Find Material File (Ensure it's a draft and not deleted)
    const existMaterial = await prisma.materialFileDetail.findFirst({
        where: { id: material_id, status: "draft", deletedAt: null },
        select: { id: true, material_title: true, material_file_url: true },
    });

    if (!existMaterial) throw new AppError({ statusCode: 404, message: "Material file not found or already published.", data: {} });

    // ✅ Step 2: Validate Students in Batch
    const validStudents = await prisma.batchWithStudent.findMany({
        where: { batch_id: batchId, student_id: { in: studentIds }, deletedAt: null },
        select: { student_id: true },
    });

    if (!validStudents.length) throw new AppError({ statusCode: 400, message: "No valid students found in this batch.", data: {} });

    // ✅ Step 3: Move File to Published Folder in S3
    const oldS3Url = existMaterial.material_file_url;
    const fileKey = oldS3Url.split(".amazonaws.com/")[1]; // Extract S3 file path

    const newS3Key = fileKey.replace(`material-draft/`, `material-published/batch-${batchId}/`);

    // Move file in S3
    const newS3Url = await moveFileInS3(fileKey, newS3Key);

    // ✅ Step 4: Assign Material & Update DB in Transactions
    const assignedStudents = validStudents.map(({ student_id }) => ({
        student_id,
        material_id: existMaterial.id,
        access_granted: true,
    }));

    await prisma.$transaction([
        prisma.studentMaterialAccess.createMany({ data: assignedStudents, skipDuplicates: true }),
        prisma.materialFileDetail.update({
            where: { id: material_id },
            data: { batch_id: batchId, status: "published", material_file_url: newS3Url },
        }),
    ]);

    return {
        material_title: existMaterial.material_title,
        batchId,
        studentIds: validStudents.map(({ student_id }) => student_id),
        material_file_url: newS3Url,
    };
};
