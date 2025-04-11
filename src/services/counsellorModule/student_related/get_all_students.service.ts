import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { getStudentAttendanceStats } from "../../staffModule/attendance_related/get_student_attendance_stats.service";

// Type for attendance stats
interface AttendanceStats {
    overAll?: { presentPercentage: number; absentPercentage: number };
    weekly?: { presentPercentage: number; absentPercentage: number };
    thisMonth?: { presentPercentage: number; absentPercentage: number };
    lastMonth?: { presentPercentage: number; absentPercentage: number };
}

export const getAllStudentsListService = async ({
    page,
    limit,
    search,
    batchId,
}: {
    page: number;
    limit: number;
    search?: string;
    batchId?: string;
}) => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    if (batchId) {
        const batchExists = await prisma.batchDetail.findUnique({ where: { id: batchId } });
        if (!batchExists) throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
    }

    const studentFilter: any = {
        deletedAt: null,
        ...(searchTerm && { name: { startsWith: searchTerm } }),
        ...(batchId && {
            batchWithStudentModel: { some: { batch_id: batchId, deletedAt: null } },
        }),
    };

    const students = await prisma.student.findMany({
        where: studentFilter,
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
            profile_img_url: true,
        },
    });

    if (!students.length) {
        throw new AppError({ statusCode: 404, message: "No students found", data: [] });
    }

    const totalStudents = await prisma.student.count({ where: studentFilter });

    const batchMappings = await prisma.batchWithStudent.findMany({
        where: {
            student_id: { in: students.map((s) => s.id) },
            deletedAt: null,
        },
        select: {
            student_id: true,
            batch_detail_relation: {
                select: { batch_number: true },
            },
        },
    });

    const studentBatchMap: Record<string, string | null> = {};
    for (const bm of batchMappings) {
        studentBatchMap[bm.student_id] = bm.batch_detail_relation?.batch_number ?? null;
    }

    const studentIds = students.map((s) => s.id);

    const testCounts = await prisma.test_Course_Or_Mock_With_Student.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, deletedAt: null },
        _count: {
            courseTestId: true,
            mockTestId: true,
        },
    });

    const studentTestMap: Record<string, { courseTest: number; mockTest: number }> = {};
    for (const test of testCounts) {
        studentTestMap[test.studentId] = {
            courseTest: test._count.courseTestId || 0,
            mockTest: test._count.mockTestId || 0,
        };
    }

    const enrichedStudents = await Promise.all(
        students.map(async (student) => {
            let stats: AttendanceStats = {};
            if (batchId) {
                stats = await getStudentAttendanceStats({ batchId, studentId: student.id });
            }

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                mobile: student.phone,
                alternate_mobile: student.alt_phone,
                roll_number: student.roll_number,
                batch_number: studentBatchMap[student.id] ?? null,
                course_id: student.course_id,
                course: student.Course,
                image: student.profile_img_url,
                over_all_present: stats.overAll?.presentPercentage ?? 0,
                over_all_absent: stats.overAll?.absentPercentage ?? 0,
                weekly_present: stats.weekly?.presentPercentage ?? 0,
                weekly_absent: stats.weekly?.absentPercentage ?? 0,
                this_monthly_present: stats.thisMonth?.presentPercentage ?? 0,
                this_monthly_absent: stats.thisMonth?.absentPercentage ?? 0,
                last_monthly_present: stats.lastMonth?.presentPercentage ?? 0,
                last_monthly_absent: stats.lastMonth?.absentPercentage ?? 0,
                course_test: studentTestMap[student.id]?.courseTest.toString() ?? "0",
                mock_test: studentTestMap[student.id]?.mockTest.toString() ?? "0",
            };
        })
    );

    return {
        students: enrichedStudents,
        totalPages: Math.ceil(totalStudents / perPage),
        perPage,
        currentPage,
        totalStudents,
    };
};
