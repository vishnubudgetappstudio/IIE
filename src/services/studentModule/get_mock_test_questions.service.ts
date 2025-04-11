import { MockTestMode } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import s3 from "../../config/s3Config";
import { parseTestCourseOrMock_CSV_Stream } from "../../utils/commonUtils";

const shuffleArray = <T>(array: T[]): T[] =>
    array
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

export const getMockTestQuestionsService = async ({
    studentId,
    test_mode,
}: {
    studentId: string;
    test_mode: MockTestMode;
}) => {
    // ✅ Validate student
    const student = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        select: { id: true },
    });
    if (!student) throw new AppError({ statusCode: 404, message: "Student not found", data: [] });

    // ✅ Get batch
    const batch = await prisma.batchWithStudent.findFirst({
        where: {
            student_id: studentId,
            deletedAt: null,
            batch_detail_relation: { deletedAt: null },
        },
        select: { batch_id: true },
    });
    if (!batch?.batch_id)
        throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });

    // ✅ Get assigned mock test IDs
    const assignedMocks = await prisma.test_Course_Or_Mock_With_Student.findMany({
        where: {
            studentId,
            test_type: "mock_test",
            deletedAt: null,
            submittedAt: null,
        },
        select: { mockTestId: true },
    });

    const mockTestIds = assignedMocks.map((t) => t.mockTestId);
    if (!mockTestIds.length)
        throw new AppError({ statusCode: 404, message: "No mock tests assigned", data: [] });

    // ✅ Get mock test questions
    const mockTests = await prisma.test_Mock.findMany({
        where: {
            id: { in: mockTestIds as string[] },
            test_mode,
            deletedAt: null,
        },
        select: {
            id: true,
            questions: true,
            test_url: true,
        },
    });

    const allQuestions: any[] = [];

    for (const test of mockTests) {
        // ✅ Parse embedded JSON questions
        if (test.questions) {
            try {
                const parsed = JSON.parse(test.questions);
                if (Array.isArray(parsed)) allQuestions.push(...parsed);
            } catch {
                console.warn(`⚠️ Invalid JSON format for mock test ID: ${test.id}`);
                throw new AppError({
                    statusCode: 400,
                    message: "Invalid question format in mock test",
                    data: [],
                });
            }
        }

        // ✅ Parse CSV questions from S3
        if (test.test_url) {
            try {
                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
                if (response.Body) {
                    const parsedRows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                    const formattedRows = parsedRows.map((row) => ({
                        id: row["No."]?.trim(),
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
                    allQuestions.push(...formattedRows);
                }
            } catch (err) {
                console.warn(`⚠️ Failed to fetch/parse S3 CSV for mock test ID: ${test.id}`, err);
                throw new AppError({
                    statusCode: 500,
                    message: "Failed to load questions from S3",
                    data: [],
                });
            }
        }
    }

    if (!allQuestions.length) throw new AppError({ statusCode: 404, message: "No questions found", data: [] });

    // ✅ Shuffle and return up to 5 questions
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, 5);

    return { questions: selected };
};
