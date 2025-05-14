import { prisma } from "../../../../config/database";
import { AppError } from "../../../../utils/errorHandler";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../../../config/s3Config";
import { extractS3BucketAndKeySize } from "../../../../utils/s3";
import { formatDateOnly, formatDurationFromTimeString, parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { Readable } from "stream";

interface GetAllCourseTestsParams {
    batchId: string | string[];
    search: string | null;
    page: number;
    limit: number;
     studentId: string;
}

export const getAllCourseTestsService = async ({
    batchId,
    search,
    page,
    limit,
    studentId,
}: GetAllCourseTestsParams) => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    // const existingBatch = await prisma.batchDetail.findUnique({
    //     where: { id: Array.isArray(batchId) ? batchId[0] : batchId, deletedAt: null },
    // });
    console.log("studentId ===>", studentId);

    // if (!existingBatch) throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });

    const whereCondition: any = {
        batch_id: Array.isArray(batchId) ? { in: batchId } : batchId,
        deletedAt: null,
    };

    // if (searchTerm) {
    //     whereCondition.test_title = { startsWith: searchTerm };
    // }

    if (searchTerm?.trim()) {
        whereCondition.test_title = {
            contains: searchTerm.trim().toLowerCase(),
        };
    }

    // if (searchTerm?.trim()) {
    //     console.log("searchTerm ===>", searchTerm);
    //     whereCondition.test_title = {
    //         contains: searchTerm.trim(),
    //         mode: "insensitive", // This makes it case-insensitive
    //     };
    // }

    const [courseTests, totalTests] = await Promise.all([
        prisma.test_Course.findMany({
            where: whereCondition,
            skip,
            take: perPage,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                test_title: true,
                test_url: true,
                end_date: true,
                timer: true,
                questions: true,
                start_date: true,
                 batch_id: true,
                test_description: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,

                batch_detail_relation: {
                    select: {
                        batch_number: true,
                    }
                },

                 TestCourseOrMockWithStudentModel: {
                    where: {
                        studentId,
                       test_type: 'course_test',
                        deletedAt: null,
                    },
                    select: {
                        status: true,
                    }
                }
            },
        }),
        prisma.test_Course.count({ where: whereCondition }),
    ]);

    // const enhancedTests = await Promise.all(
    //     courseTests.map(async (test) => {
    //         let total_questions = 0;

    //         const end_date = formatDateOnly(test.end_date);

    //         const batch_number = test.batch_detail_relation.batch_number

    //         const duration = formatDurationFromTimeString(test.timer);

    //         if (test.test_url && !test.questions) {
    //             try {
    //                 const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
    //                 const response = await s3.send(new GetObjectCommand({ Bucket, Key }));

    //                 if (response.Body) {
    //                     const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
    //                     total_questions = rows.length;
    //                 }
    //             } catch (err) {
    //                 console.warn(`⚠️ Error reading/parsing test CSV: ${test.test_title}`, err);
    //             }
    //         } else {
    //             total_questions = JSON.parse(test.questions as string)?.length
    //         }

    //         return {
    //             id: test.id,
    //             test_title: test.test_title,
    //             test_url: test.test_url,
    //             end_date: end_date,
    //             timer: duration,
    //             batch_number: batch_number,
    //             total_questions,
    //         };
    //     })
    // );
    const enhancedTests = await Promise.all(
    courseTests.map(async (test) => {
        let questions: any[] = [];

        if (test.test_url && !test.questions) {
            try {
                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
                if (response.Body) {
                    questions = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                }
            } catch (err) {
                console.warn(`⚠️ Error reading/parsing test CSV: ${test.test_title}`, err);
            }
        } else {
            questions = JSON.parse(test.questions || "[]");
        }

        return {
            id: test.id,
            batch_id: test.batch_id,
            batch_name: test.batch_detail_relation?.batch_number || null,
            test_title: test.test_title,
            test_description: test.test_description,
            test_url: test.test_url,
            start_date: test.start_date,
            status: test.TestCourseOrMockWithStudentModel?.[0]?.status,
            end_date: test.end_date,
            timer: formatDurationFromTimeString(test.timer),
            questions,
            createdAt: test.createdAt,
            updatedAt: test.updatedAt,
            deletedAt: test.deletedAt,
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
};
