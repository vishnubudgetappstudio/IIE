import { TestType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import s3 from "../../config/s3Config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { parseTestCourseOrMock_CSV_Stream } from "../../utils/commonUtils";
import { Readable } from "stream";

interface GetTestQuestionsListParams {
    studentId: string;
    testId: string;
    testType: TestType;
}

export const getTestQuestionsListService = async ({
    studentId,
    testId,
    testType,
}: GetTestQuestionsListParams) => {
    try {
        // 1. Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId, deletedAt: null },
        });
        if (!student) {
            throw new AppError({ statusCode: 404, message: "Student not found", data: [] });
        }

        // 2. Fetch test details based on test type
        const test =
            testType === "mock_test"
                ? await prisma.test_Mock.findUnique({
                    where: { id: testId, deletedAt: null },
                    select: { test_url: true, questions: true },
                })
                : testType === "course_test"
                    ? await prisma.test_Course.findUnique({
                        where: { id: testId, deletedAt: null },
                        select: { test_url: true, questions: true },
                    })
                    : null;

        if (!test) {
            throw new AppError({
                statusCode: 404,
                message: `${testType.replace("_", " ").toUpperCase()} not found`,
                data: [],
            });
        }

        // 3. If questions not stored but S3 URL exists — fetch and parse from CSV
        if (test.test_url && !test.questions) {
            try {
                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));

                if (response.Body) {
                    const parsedRows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);

                    const formattedRows = parsedRows.map((row) => ({
                        question: row.Question?.trim(),
                        options: [
                            row.Option_1?.trim(),
                            row.Option_2?.trim(),
                            row.Option_3?.trim(),
                            row.Option_4?.trim(),
                        ].filter(Boolean), // removes empty strings
                        explanation: row.Explanation?.trim(),
                        correctAnswer: row['Correct Answer']?.trim(),
                    }));
                    return formattedRows;
                }

                return []; // S3 file is empty
            } catch (err) {
                console.warn(`⚠️ Failed to fetch or parse CSV for ${testType}:`, err);
                throw new AppError({
                    statusCode: 400,
                    message: `Unable to load questions from file for ${testType.replace("_", " ")}`,
                    data: [],
                });
            }
        }

        // 4. Parse questions stored as JSON string in DB
        if (test.questions) {
            try {
                const parsed = JSON.parse(test.questions);
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                console.warn(`⚠️ Malformed JSON in DB for ${testType}:`, err)
                throw new AppError({
                    statusCode: 500,
                    message: `Stored questions are not in valid format for ${testType.replace("_", " ")}`,
                    data: [],
                });
            }
        }

        // 5. No questions found in either S3 or DB
        return [];
    } catch (error: any) {
        console.error("❌ getTestQuestionsListService error:", error);
        if (error instanceof AppError) throw error;

        throw new AppError({
            statusCode: 500,
            message: "Something went wrong while fetching test questions",
            data: [],
        });
    }
};
