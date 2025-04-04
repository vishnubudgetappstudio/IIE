import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { getStudentAttendanceStats } from "../../staffModule/attendance_related/get_student_attendance_stats.service";

export const getAllStudentsFromBatchService = async (
    batchId: string,
    page: number,
    limit: number,
    search?: string
) => {
    const currentPage = Math.max(page, 1);
    const perPage = Math.max(limit, 1);
    const skip = (currentPage - 1) * perPage;

    const [studentsList, totalStudents] = await prisma.$transaction([
        prisma.batchWithStudent.findMany({
            where: {
                batch_id: batchId,
                deletedAt: null,
                student_relation: {
                    ...(search && {
                        name: {
                            startsWith: search,
                            mode: "insensitive"
                        } as Prisma.StringFilter,
                    }),
                    deletedAt: null,
                },
            },
            skip,
            take: perPage,
            orderBy: { createdAt: "desc" },
            select: {
                student_relation: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        alt_phone: true,
                        roll_number: true,
                        course_id: true,
                        Course: true,
                        profile_img_url: true,
                    },
                },
            },
        }),

        prisma.batchWithStudent.count({
            where: {
                batch_id: batchId,
                deletedAt: null,
                student_relation: {
                    ...(search && {
                        name: {
                            startsWith: search,
                            mode: "insensitive"
                        } as Prisma.StringFilter,
                    }),
                    deletedAt: null,
                },
            },
        }),
    ]);

    if (!studentsList.length) {
        throw new AppError({
            statusCode: 404,
            message: "No students found in this batch",
            data: [],
        });
    }

    const students = studentsList.map(s => s.student_relation);

    const studentsData = await Promise.all(
        students.map(async (student) => {
            const stats = await getStudentAttendanceStats({
                batchId,
                studentId: student.id,
            });

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                mobile: student.phone,
                alternate_mobile: student.alt_phone,
                roll_number: student.roll_number,
                course_id: student.course_id,
                course: student.Course,
                image: student.profile_img_url,
                over_all_present: stats.overAll.presentPercentage,
                over_all_absent: stats.overAll.absentPercentage,
                weekly_present: stats.weekly.presentPercentage,
                weekly_absent: stats.weekly.absentPercentage,
                this_monthly_present: stats.thisMonth.presentPercentage,
                this_monthly_absent: stats.thisMonth.absentPercentage,
                last_monthly_present: stats.lastMonth.presentPercentage,
                last_monthly_absent: stats.lastMonth.absentPercentage,
                course_test: "14", // Placeholder
                mock_test: "2",    // Placeholder
            };
        })
    );

    return {
        students: studentsData,
        currentPage,
        perPage,
        totalPages: Math.ceil(totalStudents / perPage),
        totalStudents,
    };
};




// import { prisma } from "../../../config/database";
// import { AppError } from "../../../utils/errorHandler";
// import { getStudentAttendanceStats } from "../../staffModule/attendance_related/get_student_attendance_stats.service";

// export const getAllStudentsFromBatchService = async (
//     batchId: string,
//     page: number,
//     limit: number,
//     searchQuery?: string
// ) => {
//     // Apply default values if page or limit is undefined
//     const currentPage = page && page > 0 ? page : 1;
//     const perPage = limit && limit > 0 ? limit : 10;
//     const skip = (currentPage - 1) * perPage;

//     // Use Prisma transaction to execute both queries in parallel
//     const [batch, totalStudents] = await prisma.$transaction([
//         prisma.batchDetail.findUnique({
//             where: { id: batchId, deletedAt: null },
//             select: {
//                 batchWithStudentModel: {
//                     skip,
//                     take: perPage,
//                     orderBy: { createdAt: "desc" },
//                     where: searchQuery
//                         ? {
//                             student_relation: {
//                                 name: {
//                                     startsWith: searchQuery, // Removed mode, it defaults to case-sensitive
//                                 },
//                                 batchWithStudentModel: {
//                                     some: {
//                                         deletedAt: null,
//                                     }
//                                 }
//                             }
//                         }
//                         : { deletedAt: null }, // If no search, keep it undefined
//                     select: {
//                         student_relation: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                                 email: true,
//                                 phone: true,
//                                 alt_phone: true,
//                                 roll_number: true,
//                                 course_id: true,
//                                 Course: true,
//                                 profile_img_url: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         }),

//         prisma.batchWithStudent.count({
//             where: {
//                 batch_id: batchId,
//                 deletedAt: null,
//                 student_relation: searchQuery
//                     ? {
//                         name: {
//                             startsWith: searchQuery, // Removed mode to match Prisma's strict typing
//                         },
//                         deletedAt: null,
//                     }
//                     : { deletedAt: null },
//             },
//         }),
//     ]);

//     // If batch is not found, throw an error
//     if (!batch) {
//         throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
//     }

//     // Extract student data
//     const students = batch.batchWithStudentModel.map((s) => s.student_relation);

//     // 🏆 Fetch attendance stats concurrently for all students
//     const studentsData = await Promise.all(
//         students.map(async (student) => {
//             const attendanceStats = await getStudentAttendanceStats({
//                 batchId: batchId as string,
//                 studentId: student.id as string,
//             });

//             return {
//                 id: student.id,
//                 name: student.name,
//                 email: student.email,
//                 mobile: student.phone,
//                 alternate_mobile: student.alt_phone,
//                 roll_number: student.roll_number,
//                 course_id: student.course_id,
//                 course: student.Course,
//                 image: student.profile_img_url,
//                 over_all_present: attendanceStats.overAll.presentPercentage,
//                 over_all_absent: attendanceStats.overAll.absentPercentage,
//                 weekly_present: attendanceStats.weekly.presentPercentage,
//                 weekly_absent: attendanceStats.weekly.absentPercentage,
//                 this_monthly_present: attendanceStats.thisMonth.presentPercentage,
//                 this_monthly_absent: attendanceStats.thisMonth.absentPercentage,
//                 last_monthly_present: attendanceStats.lastMonth.presentPercentage,
//                 last_monthly_absent: attendanceStats.lastMonth.absentPercentage,
//                 course_test: "14",
//                 mock_test: "2"
//             };
//         })
//     );

//     return {
//         students: studentsData,
//         currentPage,
//         perPage,
//         totalPages: Math.ceil(totalStudents / perPage),
//         totalStudents,
//     };
// };