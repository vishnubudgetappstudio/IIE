import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { parseDDMMYYYYToDate } from "../../../utils/commonUtils";

const prisma = new PrismaClient();

/**
 * ✅ Mark Attendance & Update Student's Attendance Percentage
 */
export const markAttendanceService = async ({ batchId, studentId, isPresent }: { batchId: string; studentId: string; isPresent: boolean }) => {

    const existingBatchStudentId = await prisma.batchDetail.findUnique({
        where: {
            id: batchId,
            deletedAt: null,
        },
        select: {
            from_date: true, // "DD/MM/YYYY" format string
            to_date: true, // "DD/MM/YYYY" format string
            batchWithStudentModel: {
                where: {
                    student_id: studentId,
                    deletedAt: null,
                },
                select: {
                    batch_id: true
                }
            }
        }
    });

    const batchStartDate = parseDDMMYYYYToDate(existingBatchStudentId?.from_date!);
    const batchEndDate = parseDDMMYYYYToDate(existingBatchStudentId?.to_date!);
    const today = new Date();

    // 📌 Don't allow marking attendance outside batch date range
    if (today < batchStartDate || today > batchEndDate) {
        throw new AppError({
            statusCode: 400,
            message: `Attendance allowed only between ${existingBatchStudentId?.from_date} and ${existingBatchStudentId?.to_date}`,
        });
    }

    if (!existingBatchStudentId) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
    }

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