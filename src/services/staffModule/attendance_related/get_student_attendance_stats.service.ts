/**
 * ✅ Fetch student attendance statistics (Monday to Saturday only).
 * @param {string} batchId - The batch ID.
 * @param {string} studentId - The student ID.
 * @returns Attendance percentages for all time, weekly, this month, and last month.
 */

import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";

export const getStudentAttendanceStats = async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
    // ✅ Step 1: Validate batch existence in one query
    const existingBatchId = await prisma.batchDetail.findFirst({
        where: {
            id: batchId,
            deletedAt: null,
        },
        select: { id: true } // Fetching only the joining date
    });

    if (!existingBatchId) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
    }

    // ✅ Step 2: Validate batch - student existence in one query
    const batchStudent = await prisma.batchWithStudent.findFirst({
        where: {
            batch_id: batchId,
            student_id: studentId,
            deletedAt: null,
        },
        select: { createdAt: true } // Fetching only the joining date
    });

    if (!batchStudent) {
        throw new AppError({ statusCode: 404, message: "Batch or Student not found in this batch", data: {} });
    }

    const joiningDate = batchStudent.createdAt;
    const today = new Date();

    // 🗓️ Date Ranges for Attendance Calculation
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Monday start

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month

    // 🔥 Optimized Raw Query (Single Query for All Stats)
    const [result] = await prisma.$queryRaw<{
        all_present: bigint; all_total: bigint;
        week_present: bigint; week_total: bigint;
        month_present: bigint; month_total: bigint;
        last_month_present: bigint | null; last_month_total: bigint | null;
    }[]>`
            SELECT 
                SUM(is_present = true) AS all_present,
                COUNT(*) AS all_total,

                SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN is_present = true END) AS week_present,
                SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN 1 END) AS week_total,

                SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN is_present = true END) AS month_present,
                SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN 1 END) AS month_total,

                SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN is_present = true END) AS last_month_present,
                SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 END) AS last_month_total
            FROM student_attendance 
            WHERE batch_id = ${batchId} AND student_id = ${studentId} AND attendance_date >= ${joiningDate} 
            AND WEEKDAY(attendance_date) < 6;
        `;

    // ✅ Function to Calculate Attendance Percentages
    const formatAttendance = (present: bigint | null, total: bigint | null) => {
        const presentCount = Number(present || 0);
        const totalCount = Number(total || 0);
        const presentPercentage = totalCount ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
        return { presentPercentage, absentPercentage: 100 - presentPercentage };
    };

    // 🎯 Return Optimized Attendance Stats
    return {
        overAll: formatAttendance(result.all_present, result.all_total),
        weekly: formatAttendance(result.week_present, result.week_total),
        thisMonth: formatAttendance(result.month_present, result.month_total),
        lastMonth: formatAttendance(result.last_month_present, result.last_month_total),
    };
};

// export const getAllStudentAttendanceStats = async ({ studentId }: { studentId: string }) => {
//     // ✅ Step 1: Validate batch existence in one query

//     // ✅ Step 2: Validate batch - student existence in one query
//     const batchStudent = await prisma.batchWithStudent.findFirst({
//         where: {
//             student_id: studentId,
//             deletedAt: null,
//         },
//         select: { createdAt: true } // Fetching only the joining date
//     });

//     if (!batchStudent) {
//         // throw new AppError({ statusCode: 404, message: "Student not found any batch", data: {} });
//         return {
//             overAll: 0,
//             weekly: 0,
//             thisMonth: 0,
//             lastMonth: 0,
//         };
//     }

//     const joiningDate = batchStudent.createdAt;
//     const today = new Date();

//     // 🗓️ Date Ranges for Attendance Calculation
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Monday start

//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month

//     // 🔥 Optimized Raw Query (Single Query for All Stats)
//     // const [result] = await prisma.$queryRaw<{
//     //     all_present: bigint; all_total: bigint;
//     //     week_present: bigint; week_total: bigint;
//     //     month_present: bigint; month_total: bigint;
//     //     last_month_present: bigint | null; last_month_total: bigint | null;
//     // }[]>`
//     //         SELECT 
//     //             SUM(is_present = 1) AS all_present,
//     //             COUNT(*) AS all_total,

//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN is_present = 1 END) AS week_present,
//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN 1 END) AS week_total,

//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN is_present = 1 END) AS month_present,
//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN 1 END) AS month_total,

//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN is_present = 1 END) AS last_month_present,
//     //             SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 END) AS last_month_total
//     //         FROM student_attendance 
//     //         WHERE student_id = ${studentId} AND attendance_date >= ${joiningDate} 
//     //         AND WEEKDAY(attendance_date) < 6;
//     //     `;

//     const [result] = await prisma.$queryRaw<{
//         all_present: bigint; all_total: bigint;
//         week_present: bigint; week_total: bigint;
//         month_present: bigint; month_total: bigint;
//         last_month_present: bigint | null; last_month_total: bigint | null;
//     }[]>`
//     SELECT 
//         SUM(CASE WHEN is_present = true THEN 1 ELSE 0 END) AS all_present,
//         COUNT(*) AS all_total,

//         SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS week_present,
//         SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN 1 ELSE 0 END) AS week_total,

//         SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS month_present,
//         SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN 1 ELSE 0 END) AS month_total,

//         SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} AND is_present = true THEN 1 ELSE 0 END) AS last_month_present,
//         SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 ELSE 0 END) AS last_month_total
//     FROM student_attendance 
//     WHERE student_id = ${studentId} AND attendance_date >= ${joiningDate} 
//     AND WEEKDAY(attendance_date) < 6;
// `;


//     // ✅ Function to Calculate Attendance Percentages
//     const formatAttendance = (present: bigint | null, total: bigint | null) => {
//         const presentCount = Number(present || 0);
//         const totalCount = Number(total || 0);
//         const presentPercentage = totalCount ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
//         return { presentPercentage, absentPercentage: 100 - presentPercentage };
//     };

//     // 🎯 Return Optimized Attendance Stats
//     return {
//         overAll: formatAttendance(result.all_present, result.all_total),
//         weekly: formatAttendance(result.week_present, result.week_total),
//         thisMonth: formatAttendance(result.month_present, result.month_total),
//         lastMonth: formatAttendance(result.last_month_present, result.last_month_total),
//     };
// };

export const getAllStudentAttendanceStats = async ({ studentId }: { studentId: string }) => {
    const batchStudent = await prisma.batchWithStudent.findFirst({
        where: {
            student_id: studentId,
            deletedAt: null,
        },
        select: { createdAt: true }
    });

    if (!batchStudent) {
        return {
            overAll: { presentPercentage: 0, absentPercentage: 100 },
            weekly: { presentPercentage: 0, absentPercentage: 100 },
            thisMonth: { presentPercentage: 0, absentPercentage: 100 },
            lastMonth: { presentPercentage: 0, absentPercentage: 100 },
        };
    }

    const joiningDate = new Date(batchStudent.createdAt);

    // ✅ Normalize all dates to YYYY-MM-DD string format (MySQL-friendly)
    const toDateString = (date: Date) => date.toISOString().split("T")[0];

    const today = new Date();
    const formattedToday = toDateString(today);

    // ✅ Get Monday of current week
    const getStartOfWeek = (date: Date): string => {
        const d = new Date(date);
        const day = d.getDay(); // Sunday = 0
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
        d.setDate(diff);
        return toDateString(d);
    };

    const startOfWeek = getStartOfWeek(today);
    const startOfMonth = toDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    const startOfLastMonth = toDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    const endOfLastMonth = toDateString(new Date(today.getFullYear(), today.getMonth(), 0));
    const joiningDateStr = toDateString(joiningDate);

    const [result] = await prisma.$queryRaw<
        {
            all_present: bigint;
            all_total: bigint;
            week_present: bigint;
            week_total: bigint;
            month_present: bigint;
            month_total: bigint;
            last_month_present: bigint | null;
            last_month_total: bigint | null;
        }[]
    >`
        SELECT 
            SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) AS all_present,
            COUNT(*) AS all_total,

            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfWeek} AND ${formattedToday} AND is_present = 1 THEN 1 ELSE 0 END) AS week_present,
            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfWeek} AND ${formattedToday} THEN 1 ELSE 0 END) AS week_total,

            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfMonth} AND ${formattedToday} AND is_present = 1 THEN 1 ELSE 0 END) AS month_present,
            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfMonth} AND ${formattedToday} THEN 1 ELSE 0 END) AS month_total,

            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} AND is_present = 1 THEN 1 ELSE 0 END) AS last_month_present,
            SUM(CASE WHEN DATE(attendance_date) BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 ELSE 0 END) AS last_month_total
        FROM student_attendance 
        WHERE student_id = ${studentId} 
        AND DATE(attendance_date) >= ${joiningDateStr}
        AND WEEKDAY(attendance_date) < 6;
    `;

    const formatAttendance = (present: bigint | null, total: bigint | null) => {
        const presentCount = Number(present || 0);
        const totalCount = Number(total || 0);
        const presentPercentage = totalCount ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
        return {
            presentPercentage,
            absentPercentage: parseFloat((100 - presentPercentage).toFixed(2))
        };
    };

    return {
        overAll: formatAttendance(result.all_present, result.all_total),
        weekly: formatAttendance(result.week_present, result.week_total),
        thisMonth: formatAttendance(result.month_present, result.month_total),
        lastMonth: formatAttendance(result.last_month_present, result.last_month_total),
    };
};
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

interface StaffAttendanceResponse {
    id: string;
    name: string;
    email: string;
    overAll: AttendancePercentages;
    weekly: AttendancePercentages;
    thisMonth: AttendancePercentages;
    lastMonth: AttendancePercentages;
    leaveHistory: LeaveHistory[];
}

export const getStaffAttendanceService = async ({ staffId }: { staffId: string }): Promise<StaffAttendanceResponse> => {
    if (!staffId) throw new AppError({ statusCode: 400, message: "Staff ID is required" });

    const staff = await prisma.managementStaff.findUnique({
        where: { id: staffId, deletedAt: null },
        select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!staff) throw new AppError({ statusCode: 404, message: "Staff not found" });

    const today = new Date();
    const joiningDate = staff.createdAt;

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
    >`SELECT 
            SUM(CASE WHEN is_present = true THEN 1 ELSE 0 END) AS all_present,
            COUNT(*) AS all_total,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS week_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} THEN 1 ELSE 0 END) AS week_total,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} AND is_present = true THEN 1 ELSE 0 END) AS month_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} THEN 1 ELSE 0 END) AS month_total,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} AND is_present = true THEN 1 ELSE 0 END) AS last_month_present,
            SUM(CASE WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} THEN 1 ELSE 0 END) AS last_month_total
        FROM staff_attendance
        WHERE staff_id = ${staffId}
        AND attendance_date >= ${joiningDate}
        AND WEEKDAY(attendance_date) < 6;`;

    const leaveHistory = await prisma.leaveDetail.findMany({
        where: { management_staff_id: staffId, deletedAt: null },
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

    const leave_history = leaveHistory.map((leave) => ({
        ...leave,
        from_date: formatDateToDDMMYYYY(leave.from_date),
        to_date: formatDateToDDMMYYYY(leave.to_date),
        applied: leave.status !== 'Approved',
        review: leave.status === 'Pending',
        approved: leave.status === 'Approved',
    }));



    const finalResult: StaffAttendanceResponse = {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        overAll: calculateAttendancePercentage({ present: stats.all_present, total: stats.all_total }),
        weekly: calculateAttendancePercentage({ present: stats.week_present, total: stats.week_total }),
        thisMonth: calculateAttendancePercentage({ present: stats.month_present, total: stats.month_total }),
        lastMonth: calculateAttendancePercentage({ present: stats.last_month_present, total: stats.last_month_total }),
        leaveHistory: leave_history,
    };

    return finalResult;
};
function formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function calculateAttendancePercentage({ present, total }: { present: bigint; total: bigint }): AttendancePercentages {
    const presentCount = Number(present || 0);
    const totalCount = Number(total || 0);
    const presentPercentage = totalCount ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
    return {
        presentPercentage,
        absentPercentage: 100 - presentPercentage,
    };
}

