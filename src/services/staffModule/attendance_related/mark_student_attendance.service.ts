import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";

const prisma = new PrismaClient();

/**
 * ✅ Mark Attendance & Update Student's Attendance Percentage
 */
export const markAttendanceService = async ({ batchId, studentId, isPresent }: { batchId: string; studentId: string; isPresent: boolean }) => {

    const existingBatchId = await prisma.batchDetail.findUnique({
        where: {
            id: batchId,
            deletedAt: null,
        }
    });

    if (!existingBatchId) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
    }

    const existingBatchStudentId = await prisma.batchDetail.findUnique({
        where: {
            id: batchId,
            deletedAt: null,
            batchWithStudentModel: {
                some: {
                    student_id: studentId,
                    deletedAt: null,
                },
            }
        }
    });

    if (!existingBatchStudentId) {
        throw new AppError({ statusCode: 404, message: "Student not found in this batch", data: {} });
    }

    // Create Attendance Record
    return await prisma.studentAttendanceDetail.create({
        data: {
            batch_id: batchId,
            student_id: studentId,
            is_present: isPresent,
            status: isPresent ? 'present' : 'absent',
        },
    });
};