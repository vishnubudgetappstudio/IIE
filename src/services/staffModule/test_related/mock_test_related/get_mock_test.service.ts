import { prisma } from "../../../../config/database";
import { AppError } from "../../../../utils/errorHandler";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../../../config/s3Config";
import { extractS3BucketAndKeySize } from "../../../../utils/s3";
import { parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { Readable } from "stream";

interface GetAllMockTestsParams {
    batchId: string;
    search: string | null;
    page: number;
    limit: number;
}

export const getAllMockTestsService = async ({
    batchId,
    search,
    page,
    limit,
}: GetAllMockTestsParams) => {
    try {
        // Apply default values if page or limit is undefined
        const currentPage = page && page > 0 ? page : 1;
        const perPage = limit && limit > 0 ? limit : 10;
        const skip = (currentPage - 1) * perPage;
        const searchTerm = search?.trim();

        const existingBatch = await prisma.batchDetail.findUnique({
            where: { id: batchId, deletedAt: null },
        });

        if (!existingBatch) throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });

        const whereCondition: any = {
            batch_id: existingBatch.id,
            deletedAt: null,
        };

        if (searchTerm) {
            whereCondition.test_title = { startsWith: searchTerm };
        }

        const [courseTests, totalTests] = await Promise.all([
            prisma.test_Mock.findMany({
                where: whereCondition,
                skip,
                take: perPage,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    test_url: true,
                    questions: true,
                    test_mode: true,
                    batch_detail_relation: {
                        select: {
                            batch_number: true,
                            management_staff_relation: {
                                select: {
                                    name: true,
                                }
                            }
                        }
                    }
                },
            }),
            prisma.test_Course.count({ where: whereCondition }),
        ]);

        const enhancedTests = await Promise.all(
            courseTests.map(async (test) => {
                let total_questions = 0;

                const mentorName = test.batch_detail_relation?.management_staff_relation?.name

                if (test.test_url && !test.questions) {
                    try {
                        const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
                        const response = await s3.send(new GetObjectCommand({ Bucket, Key }));

                        if (response.Body) {
                            const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                            total_questions = rows.length;
                        }
                    } catch (err) {
                        console.warn(`⚠️ Error reading/parsing test CSV: ${test.test_mode}`, err);
                    }
                } else {
                    total_questions = JSON.parse(test.questions as string)?.length
                }

                return {
                    id: test.id,
                    test_url: test.test_url,
                    test_mode: test.test_mode,
                    mentor_name: mentorName,
                    total_questions,
                };
            })
        );

        return {
            enhancedTests,
            totalTests,
            currentPage,
            perPage,
            totalPages: Math.ceil(totalTests / perPage),
        };
    } catch (error) {
        console.error("❌ getAllMockTestsService error:", error);
        throw new AppError({
            statusCode: 500,
            message: "Unable to fetch mock tests",
        });
    }
};
