import { PrismaClient } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { formatDateToDDMMYYYY, parseDDMMYYYYToDate } from "../../../utils/commonUtils";

const prisma = new PrismaClient();

/**
 * ✅ Mark Attendance & Update Student's Attendance Percentage
 */
export const markAttendanceService = async ({
    batchId,
    studentId,
    isPresent,
}: {
    batchId: string;
    studentId: string;
    isPresent: boolean;
}) => {
    const today = new Date();
    const todayStr = formatDateToDDMMYYYY(today);

    // ✅ 1. Validate batch & student existence
    const batchData = await prisma.batchDetail.findUnique({
        where: {
            id: batchId,
            deletedAt: null,
        },
        select: {
            from_date: true,
            to_date: true,
            batchWithStudentModel: {
                where: {
                    student_id: studentId,
                    deletedAt: null,
                },
                select: { batch_id: true },
            },
        },
    });

    if (!batchData) {
        throw new AppError({ statusCode: 404, message: "Batch not found" });
    }

    if (!batchData.batchWithStudentModel.length) {
        throw new AppError({
            statusCode: 404,
            message: "Student not found in this batch",
            data: {},
        });
    }

    // ✅ 2. Validate attendance date is within batch range
    const batchStart = parseDDMMYYYYToDate(batchData.from_date);
    const batchEnd = parseDDMMYYYYToDate(batchData.to_date);
    if (today < batchStart || today > batchEnd) {
        throw new AppError({
            statusCode: 400,
            message: `Attendance allowed only between ${batchData.from_date} and ${batchData.to_date}`,
            data: {},
        });
    }

    // ✅ 3. Prevent duplicate attendance for today
    const alreadyMarkedToday = await prisma.studentAttendanceDetail.findFirst({
        where: {
            student_id: studentId,
            batch_id: batchId,
            createdAt: {
                gte: new Date(today.setHours(0, 0, 0, 0)), // start of today
                lte: new Date(today.setHours(23, 59, 59, 999)), // end of today
            },
        },
    });

    if (alreadyMarkedToday) {
        throw new AppError({
            statusCode: 400,
            message: "Attendance already marked for today",
            data: {},
        });
    }

    // ✅ 4. Check if leave already applied today
    const isLeaveToday = await prisma.leaveDetail.findFirst({
        where: {
            student_id: studentId,
            deletedAt: null,
            from_date: { lte: todayStr },
            to_date: { gte: todayStr },
        },
    });

    // ✅ 5. If absent and no leave, create auto leave
    if (!isPresent && !isLeaveToday) {
        await prisma.leaveDetail.create({
            data: {
                student_id: studentId,
                leave_type: "Absent",
                from_date: todayStr,
                to_date: todayStr,
                reason: "Absent",
                role: "student",
                status: "Not_informed",
            },
        });
    }

    // ✅ 6. Finally, mark attendance
    return await prisma.studentAttendanceDetail.create({
        data: {
            batch_id: batchId,
            student_id: studentId,
            is_present: isPresent,
            status: isPresent ? "present" : "absent",
        },
    });
};
