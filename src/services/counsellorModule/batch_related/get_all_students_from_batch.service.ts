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
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    const [studentsList, totalStudents] = await prisma.$transaction([
        prisma.batchWithStudent.findMany({
            where: {
                batch_id: batchId,
                deletedAt: null,
                // student_relation: {
                //     ...(search && {
                //         name: { startsWith: searchTerm } as Prisma.StringFilter,
                //     }),
                //     deletedAt: null,
                // },
                student_relation: {
                    deletedAt: null,
                    ...(searchTerm?.trim() && {
                        name: {
                            contains: searchTerm.trim().toLowerCase(), // case-sensitive by default
                            // mode: "insensitive" // Uncomment if your Prisma + DB supports it
                        },
                    }),
                },
                batch_detail_relation: {
                    deletedAt: null,
                    management_staff_relation:{
                        deletedAt: null,
                    }
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
                        name: { startsWith: search } as Prisma.StringFilter,
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

            let is_present = false;
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            // Query
            let checkTodayAttendance = await prisma.studentAttendanceDetail.findFirst({
            where: {
                student_id: student.id,
                batch_id: batchId,
                attendance_date: {
                gte: startOfDay,
                lte: endOfDay,
                },
            },
            select: {
                student_id: true,
                is_present: true,
            }
            });

            if (checkTodayAttendance && checkTodayAttendance.is_present) {
                is_present = true;
            }

            let courseTestCount = await prisma.test_Course_Or_Mock_With_Student.count({
                where: {
                    studentId: student.id,
                    test_type: "course_test",
                    deletedAt: null,
                    status: "completed"
                }
            });

            let courseTestCountStrAlt = String(courseTestCount) ?? "0";

            let mockTestCount = await prisma.test_Course_Or_Mock_With_Student.count({
                where: {
                    studentId: student.id,
                    test_type: "mock_test",
                    deletedAt: null,
                    status: "completed"
                }
            });

            let mockTestCountStrAlt = String(mockTestCount) ?? "0";

            let MentorName = await prisma.batchDetail.findUnique({
                where: { id: batchId, deletedAt: null },
                select: {
                    management_staff_relation: {
                        select: {
                            name: true,
                            profile_img_url: true,
                        },
                    },
                },
            });
            


            return {
                id: student.id,
                name: student.name,
                roll_number: student.roll_number,
                image: student.profile_img_url,
                over_all_present: stats.overAll.presentPercentage,
                is_present: is_present,
                course_test: courseTestCountStrAlt,
                mock_test: mockTestCountStrAlt,
                mentor_name: MentorName?.management_staff_relation.name ?? "",
                mentor_image: MentorName?.management_staff_relation.profile_img_url ?? "",
                phone: student.phone,
                alt_phone: student.alt_phone,
            };
        })
    );

    return {
        data: studentsData,
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