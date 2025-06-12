import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { getStudentAttendanceStats } from "../../staffModule/attendance_related/get_student_attendance_stats.service";

/**
 * ✅ Fetch batch students with pagination and search query
 * @param {number} page - Current page number
 * @param {number} limit - Number of students per page
 * @param {string} [search] - Optional search keyword
 * @param {string} [batchId] - Optional batch ID to filter students
 * @returns {Promise<object>} - List of students with pagination details
 */
export const getAllStudentsListService = async ({
    page,
    limit,
    search,
    batchId,
    branch,
}: {
    page: number;
    limit: number;
    search?: string;
    batchId?: string;
    branch?: string; // Optional userId for future use
}) => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    let attendanceStats: any = {};

    // 🔎 Validate batch existence if batchId is provided
    if (batchId) {
        const batchExists = await prisma.batchDetail.findUnique({
            where: { id: batchId }
        });

        if (!batchExists) {
            throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
        }
    }

    // 🔍 Define search conditions
    const searchCondition = {
        deletedAt: null,
        Branch: branch, // Use branch if provided
        ...(search && { name: { startsWith: searchTerm } }), // Search by name
        ...(batchId && {
            batchWithStudentModel: {
                some: { batch_id: batchId, deletedAt: null } // Filter by batch ID
            }
        })
    };

    // 🎯 Fetch students with pagination & search
    const students = await prisma.student.findMany({
        where: searchCondition,
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            alt_phone: true,
            roll_number: true,
            course_id: true,
            Course: true,
            profile_img_url: true
        }
    });

    // 📊 Get total count of matching students
    const totalStudents = await prisma.student.count({ where: searchCondition });

    if (!students.length) {
        throw new AppError({ statusCode: 404, message: "No students found", data: [] });
    }

    // 🏆 Fetch attendance stats concurrently for all students
    const studentsData = await Promise.all(
        students.map(async (student) => {
            if (batchId) {
                attendanceStats = await getStudentAttendanceStats({
                    batchId: batchId as string,
                    studentId: student.id as string,
                });
            }

            let isBatch = 0;
            const batchCheck = await prisma.batchWithStudent.findFirst({
                where: {
                    student_id: student.id,
                    batch_id: batchId,
                    deletedAt: null
                }
            });
            if(batchCheck) {
                isBatch = 1;
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
                over_all_present: attendanceStats?.overAll?.presentPercentage ?? 0,
                over_all_absent: attendanceStats?.overAll?.absentPercentage ?? 0,
                weekly_present: attendanceStats?.weekly?.presentPercentage ?? 0,
                weekly_absent: attendanceStats?.weekly?.absentPercentage ?? 0,
                this_monthly_present: attendanceStats?.thisMonth?.presentPercentage ?? 0,
                this_monthly_absent: attendanceStats?.thisMonth?.absentPercentage ?? 0,
                last_monthly_present: attendanceStats?.lastMonth?.presentPercentage ?? 0,
                last_monthly_absent: attendanceStats?.lastMonth?.absentPercentage ?? 0,
                course_test: courseTestCountStrAlt,
                mock_test: mockTestCountStrAlt,
                is_batch: isBatch,
            };
        })
    );

    // 📌 Return final paginated student data
    return {
        students: studentsData,
        totalPages: Math.ceil(totalStudents / perPage),
        perPage,
        currentPage,
        totalStudents
    };
};