import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";

export const addStudentsToBatchService = async (batch_id: string, student_ids: string[]) => {
    // Check if the batch exists
    const batchExists = await prisma.batchDetail.findUnique({
        where: { id: batch_id, deletedAt: null },
    });

    if (!batchExists) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
    }

    const sameSlot = await prisma.batchWithStudent.findMany({
        where: {
            batch_id,
            student_id: { in: student_ids },
            deletedAt: null,
            batch_detail_relation: { slot: batchExists.slot } // Check if any of the provided students already exist in the same slot as the batch
        }
    });

    if (sameSlot.length) {
        throw new AppError({
            statusCode: 400,
            message: "Some students are already assigned to a batch in the same slot as the batch.",
            data: [],
        });
    }

    // Find students who are already in the batch
    const existingStudents = await prisma.batchWithStudent.findMany({
        where: {
            student_id: { in: student_ids },
            deletedAt: null, // Check if any of the provided students already exist in this batch
        },
        select: {
            student_id: true,
            student_relation: {
                select: { name: true }
            },
        },
    });

    // Extract existing student IDs from the query result
    const existingStudentIds = new Set(existingStudents.map((s) => s.student_id));
    const existingStudentNames = new Set(existingStudents.map((s) => s.student_relation.name));

    // Identify new students (not already in the batch)
    const newStudents = student_ids.filter((id) => !existingStudentIds.has(id));

    // If any student already exists, throw an AppError
    if (existingStudentIds.size > 0) {
        throw new AppError({
            statusCode: 409,
            message: `The following students are already in the batch: ${[...existingStudentNames].join(", ")}`,
            data: [],
        });
    }

    if (newStudents.length > 0) {
        // **Use `upsert()` to prevent duplicate key errors**
        await Promise.all(
            newStudents.map(async (student_id) => {
                await prisma.batchWithStudent.upsert({
                    where: {
                        batch_id_student_id: { batch_id, student_id }, // Composite unique constraint
                    },
                    update: {
                        deletedAt: null
                    }, // If the record exists, do nothing
                    create: { batch_id, student_id },
                });
            })
        ).catch((err) => {
            console.error("Error in addStudentsToBatch Service:", err);
            throw new AppError({ statusCode: 400, message: "Error adding students to batch", data: [] });
        });
    }

    return {
        addedStudents: newStudents, // Successfully added student IDs
    };
};