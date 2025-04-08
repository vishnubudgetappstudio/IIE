import { Readable } from "stream";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { formatDateOnly, formatDurationFromTimeString, parseTestCourseOrMock_CSV_Stream } from "../../utils/commonUtils";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../config/s3Config";
import { TestType } from "@prisma/client";

interface studentGetAllCourseOrMockTestsParams {
    batchId: string;
    studentId: string;
    test_type: TestType;
    search: string | null;
    page: number;
    limit: number;
}

export const studentGetAllCourseOrMockTestsService = async ({
    batchId,
    studentId,
    test_type,
    search,
    page,
    limit,
}: studentGetAllCourseOrMockTestsParams) => {
    try {
        const currentPage = page && page > 0 ? page : 1;
        const perPage = limit && limit > 0 ? limit : 10;
        const skip = (currentPage - 1) * perPage;
        const searchTerm = search?.trim();

        const existingBatch = await prisma.batchDetail.findUnique({
            where: { id: batchId, deletedAt: null },
        });

        if (!existingBatch) {
            throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
        }

        const whereCondition: any = {
            studentId,
            test_type,
            batchId: existingBatch.id,
            deletedAt: null,
        };

        if (searchTerm) {
            whereCondition.test_title = { startsWith: searchTerm };
        }

        const [courseAndMockTests, totalTests] = await Promise.all([
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
                    batchId: true,
                }
            }),
            prisma.test_Course_Or_Mock_With_Student.count({ where: whereCondition }),
        ]);

        const enhancedTests = await Promise.all(
            courseAndMockTests.map(async (test) => {
                try {
                    let testData: any;
                    let total_questions = 0;

                    if (test.test_type === 'course_test') {
                        testData = await prisma.test_Course.findFirst({
                            where: { id: test.courseTestId!, deletedAt: null },
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

                        if (!testData) throw new AppError({
                            statusCode: 404,
                            message: "Test not found",
                            data: []
                        });

                        const end_date = formatDateOnly(testData.end_date);
                        const duration = formatDurationFromTimeString(testData.timer);
                        const batch_number = testData.batch_detail_relation.batch_number;

                        if (testData.test_url && !testData.questions) {
                            try {
                                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: testData.test_url });
                                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));

                                if (response.Body) {
                                    const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                                    total_questions = rows.length;
                                }
                            } catch (err) {
                                console.warn(`⚠️ Error parsing CSV for course test: ${testData.test_title}`, err);
                            }
                        } else {
                            try {
                                const parsed = JSON.parse(testData.questions as string);
                                total_questions = Array.isArray(parsed) ? parsed.length : 0;
                            } catch {
                                console.warn(`⚠️ Malformed JSON in questions for course test: ${testData.test_title}`);
                            }
                        }

                        return {
                            id: test.id,
                            test_title: testData.test_title,
                            test_url: testData.test_url,
                            end_date,
                            timer: duration,
                            batch_number,
                            total_questions,
                        };
                    }

                    if (test.test_type === 'mock_test') {
                        testData = await prisma.test_Mock.findFirst({
                            where: { id: test.mockTestId!, deletedAt: null },
                            select: {
                                test_url: true,
                                questions: true,
                                batch_detail_relation: {
                                    select: {
                                        batch_number: true,
                                        management_staff_relation: {
                                            select: { name: true }
                                        }
                                    },
                                },
                            },
                        });

                        if (!testData) {
                            throw new AppError({
                                statusCode: 404,
                                message: "Mock Test not found",
                                data: [],
                            })
                        };

                        if (testData.test_url && !testData.questions) {
                            try {
                                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: testData.test_url });
                                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));

                                if (response.Body) {
                                    const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                                    total_questions = rows.length;
                                }
                            } catch (err) {
                                console.warn(`⚠️ Error parsing CSV for mock test: ${testData.test_title}`, err);
                            }
                        } else {
                            try {
                                const parsed = JSON.parse(testData.questions as string);
                                total_questions = Array.isArray(parsed) ? parsed.length : 0;
                            } catch {
                                console.warn(`⚠️ Malformed JSON in questions for mock test: ${testData.test_title}`);
                            }
                        }

                        return {
                            id: test.id,
                            test_title: testData.test_title,
                            test_url: testData.test_url,
                            batch_number: testData.batch_detail_relation.batch_number,
                            management_staff_name: testData.batch_detail_relation.management_staff_relation.name,
                            total_questions,
                        };
                    }

                    return;
                } catch (err) {
                    console.error(`❌ Failed to process test ID ${test.id}:`, err);
                    return; // Skip this test on error
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
    } catch (error) {
        console.error("❌ studentGetAllCourseOrMockTestsService error:", error);
        throw new AppError({
            statusCode: 500,
            message: "Unable to fetch course/mock tests",
        });
    }
};
