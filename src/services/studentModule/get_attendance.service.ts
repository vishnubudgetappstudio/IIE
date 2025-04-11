import { prisma } from "../../config/database";
import { calculateAttendancePercentage, formatDateToDDMMYYYY } from "../../utils/commonUtils";
import { AppError } from "../../utils/errorHandler";

interface AttendancePercentages {
    presentPercentage: number;
    absentPercentage: number;
}

interface LeaveHistory {
    id: string;
    from_date: string;
    to_date: string;
    leave_type: string;
    reason: string;
    status: string;
}

interface StudentAttendanceResponse {
    id: string;
    name: string;
    roll_number: string;
    email: string;
    overAll: AttendancePercentages;
    weekly: AttendancePercentages;
    thisMonth: AttendancePercentages;
    lastMonth: AttendancePercentages;
    leaveHistory: LeaveHistory[];
}

export const getStudentAttendanceService = async ({
    studentId,
}: {
    studentId: string;
}): Promise<StudentAttendanceResponse> => {
    if (!studentId) {
        throw new AppError({ statusCode: 400, message: "Student ID is required" });
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        select: { id: true, name: true, roll_number: true, email: true },
    });

    if (!student) throw new AppError({ statusCode: 404, message: "Student not found" });

    const studentInBatch = await prisma.batchWithStudent.findFirst({
        where: { student_id: studentId, deletedAt: null },
        select: {
            batch_id: true,
            createdAt: true,
            batch_detail_relation: { select: { course: true } },
        },
    });

    if (!studentInBatch) {
        throw new AppError({ statusCode: 404, message: "Student not found in any batch" });
    }

    const today = new Date();
    const joiningDate = studentInBatch.createdAt;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [stats] = await prisma.$queryRaw<
        Array<{
            all_present: bigint;
            all_total: bigint;
            week_present: bigint;
            week_total: bigint;
            month_present: bigint;
            month_total: bigint;
            last_month_present: bigint;
            last_month_total: bigint;
        }>
    >`
        SELECT 
            SUM(CASE WHEN is_present = true THEN 1 ELSE 0 END) AS all_present,
            COUNT(*) AS all_total,

            SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS week_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN 1 ELSE 0 END) AS week_total,

            SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS month_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN 1 ELSE 0 END) AS month_total,

            SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} AND is_present = true THEN 1 ELSE 0 END) AS last_month_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 ELSE 0 END) AS last_month_total
        FROM student_attendance
        WHERE batch_id = ${studentInBatch.batch_id}
          AND student_id = ${studentId}
          AND attendance_date >= ${joiningDate}
          AND WEEKDAY(attendance_date) < 6;
    `;

    const leaveHistory = await prisma.leaveDetail.findMany({
        where: { student_id: studentId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            from_date: true,
            to_date: true,
            leave_type: true,
            reason: true,
            status: true,
        },
    });

    const leave_history = leaveHistory.map((leave) => {
        return {
            ...leave,
            from_date: formatDateToDDMMYYYY(leave.from_date),
            to_date: formatDateToDDMMYYYY(leave.to_date),
            applied: leave.status !== 'Approved' ? true : false,
            review: leave.status !== 'Approved' ? false : true,
            approved: leave.status !== 'Approved' ? false : true,
        }

    })

    const finalResult: StudentAttendanceResponse = {
        id: student.id,
        name: student.name,
        roll_number: student.roll_number,
        email: student.email,
        overAll: calculateAttendancePercentage({ present: stats.all_present, total: stats.all_total }),
        weekly: calculateAttendancePercentage({ present: stats.week_present, total: stats.week_total }),
        thisMonth: calculateAttendancePercentage({ present: stats.month_present, total: stats.month_total }),
        lastMonth: calculateAttendancePercentage({ present: stats.last_month_present, total: stats.last_month_total }),
        leaveHistory: leave_history
    };

    return finalResult;
};
