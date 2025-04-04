import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

interface studentAttendanceResponse {
    id: string;
    name: string;
    roll_number: string;
    email: string;
    phone?: string;
    alt_phone?: string;
    course?: string;
    overAll: {
        presentPercentage: number;
        absentPercentage: number;
    };
    weekly: {
        presentPercentage: number;
        absentPercentage: number;
    };
    thisMonth: {
        presentPercentage: number;
        absentPercentage: number;
    };
    lastMonth: {
        presentPercentage: number;
        absentPercentage: number;
    };

    courseTest: string;
    mockTest: string;
}

export const getStudentAttendanceService = async ({ studentId }: { studentId: string }) => {
    const existingStudent = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        select: { id: true },
    });

    if (!existingStudent) throw new AppError({ statusCode: 404, message: "Student not found" });

    const studentInBatch = await prisma.batchWithStudent.findFirst({
        where: {
            student_id: studentId,
            deletedAt: null,
        },
        select: {
            batch_id: true,
            createdAt: true,
            batch_detail_relation: {
                select: { course: true },
            },
        },
    });

    if (!studentInBatch) throw new AppError({ statusCode: 404, message: "Student not found in any batch" });

    const today = new Date();
    const joiningDate = studentInBatch.createdAt;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [result] = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
            SUM(CASE WHEN is_present = true THEN 1 ELSE 0 END) AS all_present,
            COUNT(*) AS all_total,

            SUM(CASE WHEN attendance_date BETWEEN '${startOfWeek.toISOString()}' AND '${today.toISOString()}' AND is_present = true THEN 1 ELSE 0 END) AS week_present,
            SUM(CASE WHEN attendance_date BETWEEN '${startOfWeek.toISOString()}' AND '${today.toISOString()}' THEN 1 ELSE 0 END) AS week_total,

            SUM(CASE WHEN attendance_date BETWEEN '${startOfMonth.toISOString()}' AND '${today.toISOString()}' AND is_present = true THEN 1 ELSE 0 END) AS month_present,
            SUM(CASE WHEN attendance_date BETWEEN '${startOfMonth.toISOString()}' AND '${today.toISOString()}' THEN 1 ELSE 0 END) AS month_total,

            SUM(CASE WHEN attendance_date BETWEEN '${startOfLastMonth.toISOString()}' AND '${endOfLastMonth.toISOString()}' AND is_present = true THEN 1 ELSE 0 END) AS last_month_present,
            SUM(CASE WHEN attendance_date BETWEEN '${startOfLastMonth.toISOString()}' AND '${endOfLastMonth.toISOString()}' THEN 1 ELSE 0 END) AS last_month_total
        FROM student_attendance
        WHERE batch_id = '${studentInBatch.batch_id}' 
        AND student_id = '${studentId}'
        AND attendance_date >= '${joiningDate.toISOString()}'
        AND WEEKDAY(attendance_date) < 6;
    `);

    const formatAttendance = (present: bigint | null, total: bigint | null) => {
        const presentCount = Number(present || 0);
        const totalCount = Number(total || 0);
        const presentPercentage = totalCount ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
        return { presentPercentage, absentPercentage: 100 - presentPercentage };
    };

    const studentDetails = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            name: true,
            roll_number: true,
            email: true,
            phone: true,
            alt_phone: true,
            Course: true,
        }
    });

    const finalResult: studentAttendanceResponse = {
        id: studentId,
        name: studentDetails?.name || '',
        roll_number: studentDetails?.roll_number || '',
        email: studentDetails?.email || '',
        phone: studentDetails?.phone || '',
        alt_phone: studentDetails?.alt_phone || '',
        course: studentDetails?.Course || '',
        overAll: formatAttendance(result.all_present, result.all_total),
        weekly: formatAttendance(result.week_present, result.week_total),
        thisMonth: formatAttendance(result.month_present, result.month_total),
        lastMonth: formatAttendance(result.last_month_present, result.last_month_total),
        courseTest: "80", // You can fetch if needed
        mockTest: "20"
    };

    return { finalResult };
};
