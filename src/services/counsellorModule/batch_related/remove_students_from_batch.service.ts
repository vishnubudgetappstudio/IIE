import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";

export const removeStudentsFromBatchService = async (batch_id: string, student_ids: string[]) => {
    // Check if the batch exists
    const batchExists = await prisma.batchDetail.findUnique({
        where: { id: batch_id, deletedAt: null },
    });

    if (!batchExists) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
    }

    // Check if the students exist in the batch and are not already deleted
    const existingStudents = await prisma.batchWithStudent.findMany({
        where: {
            batch_id,
            student_id: { in: student_ids },
            deletedAt: null, // Ensure we are not updating already deleted records
        },
        select: { student_id: true },
    });

    // Extract the IDs of students who are actually present in the batch
    const existingStudentIds = existingStudents.map((s) => s.student_id);

    // If no students found, throw a 404 error
    if (!existingStudentIds.length) {
        throw new AppError({
            statusCode: 404,
            message: "No matching students found in the batch",
            data: {},
        });
    }

    // Update `deletedAt` for the found students (soft delete)
    await prisma.batchWithStudent.updateMany({
        where: {
            batch_id,
            student_id: { in: existingStudentIds },
            deletedAt: null
        },
        data: { deletedAt: new Date() },
    }).catch((error) => {
        console.error("Error in removeStudentsFromBatch Service:", error);
        throw new AppError({ statusCode: 500, message: "Internal Server Error", data: {} });
    });

    return {
        removedStudents: existingStudentIds, // Successfully removed student IDs
    };
};