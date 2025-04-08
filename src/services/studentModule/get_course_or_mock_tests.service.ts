import { Readable } from "stream";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import {
    formatDateOnly,
    formatDurationFromTimeString,
    parseTestCourseOrMock_CSV_Stream,
} from "../../utils/commonUtils";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../config/s3Config";
import { TestType } from "@prisma/client";

interface Params {
    studentId: string;
    test_type: TestType;
    search: string | null;
    page: number;
    limit: number;
}

export const studentGetAllCourseOrMockTestsService = async ({
    studentId,
    test_type,
    search,
    page,
    limit,
}: Params) => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    // ✅ Validate Student
    const student = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        select: { id: true },
    });
    if (!student) throw new AppError({ statusCode: 404, message: "Student not found" });

    // ✅ Get Batch ID
    const batch = await prisma.batchWithStudent.findFirst({
        where: {
            student_id: studentId,
            deletedAt: null,
            batch_detail_relation: { deletedAt: null },
        },
        select: { batch_id: true },
    });
    const batchId = batch?.batch_id;
    if (!batchId) throw new AppError({ statusCode: 404, message: "Batch not found" });

    // ✅ Build where condition
    const whereCondition: any = {
        studentId,
        test_type,
        batchId,
        deletedAt: null,
    };
    if (searchTerm && test_type === "course_test") {
        whereCondition.test_title = { startsWith: searchTerm };
    }

    // ✅ Fetch test records and count
    const [tests, totalTests] = await Promise.all([
        prisma.test_Course_Or_Mock_With_Student.findMany({
            where: whereCondition,
            skip,
            take: perPage,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                courseTestId: true,
                mockTestId: true,
                test_type: true,
                status: true,
            },
        }),
        prisma.test_Course_Or_Mock_With_Student.count({ where: whereCondition }),
    ]);

    // ✅ Map and enrich test data
    const enhancedTests = await Promise.all(
        tests.map(async (test) => {
            let testData: any;
            let total_questions = 0;

            if (test.test_type === "course_test" && test.courseTestId) {
                testData = await prisma.test_Course.findFirst({
                    where: { id: test.courseTestId, deletedAt: null },
                    select: {
                        test_title: true,
                        test_url: true,
                        end_date: true,
                        timer: true,
                        questions: true,
                        batch_detail_relation: {
                            select: { batch_number: true },
                        },
                    },
                });

                if (!testData) throw new AppError({ statusCode: 404, message: "Course Test not found", data: [] });

                if (testData.test_url && !testData.questions) {
                    try {
                        const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: testData.test_url });
                        const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
                        if (response.Body) {
                            const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                            total_questions = rows.length;
                        }
                    } catch (err) {
                        console.warn(`⚠️ Failed to parse CSV for test: ${testData.test_title}`, err);
                        throw new AppError({ statusCode: 404, message: `Failed to parse CSV for test: ${testData.test_title}`, data: [] });
                    }
                } else if (testData.questions) {
                    try {
                        const parsed = JSON.parse(testData.questions);
                        total_questions = Array.isArray(parsed) ? parsed.length : 0;
                    } catch {
                        console.warn(`⚠️ Invalid JSON in questions for test: ${testData.test_title}`);
                        throw new AppError({ statusCode: 404, message: `Invalid JSON in questions for test: ${testData.test_title}`, data: [] });
                    }
                }

                return {
                    id: test.id,
                    test_title: testData.test_title,
                    test_description: testData.test_description,
                    end_date: formatDateOnly(testData.end_date),
                    timer: formatDurationFromTimeString(testData.timer),
                    batch_number: testData.batch_detail_relation.batch_number,
                    status: test.status,
                    total_questions,
                };
            }

            if (test.test_type === "mock_test" && test.mockTestId) {
                testData = await prisma.test_Mock.findFirst({
                    where: { id: test.mockTestId, deletedAt: null },
                    select: {
                        test_url: true,
                        test_mode: true,
                        questions: true,
                        batch_detail_relation: {
                            select: {
                                batch_number: true,
                                management_staff_relation: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                });

                if (!testData) throw new AppError({ statusCode: 404, message: "Mock Test not found", data: [] });

                if (testData.test_url && !testData.questions) {
                    try {
                        const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: testData.test_url });
                        const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
                        if (response.Body) {
                            const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                            total_questions = rows.length;
                        }
                    } catch (err) {
                        console.warn(`⚠️ Failed to parse CSV for mock test: ${testData.test_type}`, err);
                        throw new AppError({ statusCode: 404, message: `Failed to parse CSV for mock test: ${testData.test_type}`, data: [] });
                    }
                } else if (testData.questions) {
                    try {
                        const parsed = JSON.parse(testData.questions);
                        total_questions = Array.isArray(parsed) ? parsed.length : 0;
                    } catch {
                        console.warn(`⚠️ Invalid JSON in questions for mock test: ${testData.test_title}`);
                        throw new AppError({ statusCode: 404, message: `Invalid JSON in questions for mock test: ${testData.test_type}`, data: [] });
                    }
                }

                return {
                    id: test.id,
                    test_type: test.test_type,
                    batch_number: testData.batch_detail_relation.batch_number,
                    management_staff_name: testData.batch_detail_relation.management_staff_relation.name,
                    total_questions,
                };
            }
        })
    );

    return {
        enhancedTests: enhancedTests.filter(Boolean),
        totalTests,
        currentPage,
        perPage,
        totalPages: Math.ceil(totalTests / perPage),
    };
};
