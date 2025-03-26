import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/errorHandler";

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

/**
 * ✅ Fetch student attendance statistics (Monday to Saturday only).
 * @param {string} batchId - The batch ID.
 * @param {string} studentId - The student ID.
 * @returns Attendance percentages for all time, weekly, this month, and last month.
 */

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


// export const getStudentAttendanceStats = async ({ batchId, studentId }: { batchId: string; studentId: string }) => {
//     const existingBatchId = await prisma.batchDetail.findUnique({
//         where: {
//             id: batchId,
//             deletedAt: null,
//         }
//     });

//     if (!existingBatchId) {
//         throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
//     }

//     const existingBatchStudentId = await prisma.batchDetail.findUnique({
//         where: {
//             id: batchId,
//             deletedAt: null,
//             batchWithStudentModel: {
//                 some: {
//                     student_id: studentId,
//                     deletedAt: null,
//                 },
//             }
//         }
//     });

//     if (!existingBatchStudentId) {
//         throw new AppError({ statusCode: 404, message: "Student not found in this batch", data: {} });
//     }

//     const today = new Date();

//     // 🗓️ Get Monday as the start of the week
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // If Sunday, go back 6 days

//     // 🗓️ Get start of the current and last month
//     const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month

//     // 🔎 Get the student's joining date
//     const student = await prisma.student.findUnique({
//         where: { id: studentId },
//         select: {
//             batchWithStudentModel: {
//                 select: {
//                     createdAt: true,
//                 }
//             }
//         } // Ensure your database has a `createdAt (student course joining_date)` field
//     });

//     if (!student) {
//         throw new AppError({ statusCode: 404, message: "Student not found.", data: {} });
//     }

//     if (!student.batchWithStudentModel || student.batchWithStudentModel.length === 0) {
//         throw new AppError({ statusCode: 400, message: "Student batch association not found.", data: {} });
//     }



//     const joiningDate = student.batchWithStudentModel?.[0].createdAt;

//     // 🏆 Optimized SQL Query (Works for MySQL) - Filters attendance from `joiningDate` onwards
//     const [result] = await prisma.$queryRaw<{
//         all_present: bigint; all_total: bigint;
//         week_present: bigint; week_total: bigint;
//         month_present: bigint; month_total: bigint;
//         last_month_present: bigint | null; last_month_total: bigint | null;
//     }[]>`
//         SELECT 
//             -- 🏆 Overall Attendance (Monday to Saturday, from joining date)
//             COUNT(DISTINCT CASE 
//                 WHEN student_id = ${studentId} AND is_present = true AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS all_present,
//             COUNT(DISTINCT CASE 
//                 WHEN attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS all_total,

//             -- 📅 Weekly Attendance (Monday to Saturday)
//             COUNT(DISTINCT CASE 
//                 WHEN student_id = ${studentId} AND is_present = true 
//                 AND attendance_date BETWEEN ${startOfWeek} AND ${today} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS week_present,
//             COUNT(DISTINCT CASE 
//                 WHEN attendance_date BETWEEN ${startOfWeek} AND ${today} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS week_total,

//             -- 📅 This Month Attendance (Monday to Saturday)
//             COUNT(DISTINCT CASE 
//                 WHEN student_id = ${studentId} AND is_present = true 
//                 AND attendance_date BETWEEN ${startOfMonth} AND ${today} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS month_present,
//             COUNT(DISTINCT CASE 
//                 WHEN attendance_date BETWEEN ${startOfMonth} AND ${today} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS month_total,

//             -- 📅 Last Month Attendance (Monday to Saturday)
//             COUNT(DISTINCT CASE 
//                 WHEN student_id = ${studentId} AND is_present = true 
//                 AND attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS last_month_present,
//             COUNT(DISTINCT CASE 
//                 WHEN attendance_date BETWEEN ${startOfLastMonth} AND ${endOfLastMonth} 
//                 AND attendance_date >= ${joiningDate} 
//                 AND WEEKDAY(attendance_date) < 6 THEN attendance_date 
//             END) AS last_month_total
//         FROM student_attendance 
//         WHERE batch_id = ${batchId} 
//         AND attendance_date >= ${joiningDate};
//     `;

//     /**
//      * ✅ Function to format attendance percentage
//      * @param {bigint | null} present - Days the student was present.
//      * @param {bigint | null} total - Total working days (Monday–Saturday).
//      * @returns {object} - Present and absent percentages.
//      */
//     const formatAttendance = (present: bigint | null, total: bigint | null) => {
//         if (!present && !total) {
//             return { presentPercentage: 0, absentPercentage: 0 }; // Ensure 0 when data is missing
//         }
//         const presentCount = Number(present || 0);
//         const totalCount = Number(total || 0);
//         const presentPercentage = totalCount > 0 ? parseFloat(((presentCount / totalCount) * 100).toFixed(2)) : 0;
//         const absentPercentage = 100 - presentPercentage;
//         return { presentPercentage, absentPercentage };
//     };

//     // 🎯 Return formatted attendance statistics
//     return {
//         overAll: formatAttendance(result.all_present, result.all_total),
//         weekly: formatAttendance(result.week_present, result.week_total),
//         thisMonth: formatAttendance(result.month_present, result.month_total),
//         lastMonth: formatAttendance(result.last_month_present, result.last_month_total),
//     };
// };




