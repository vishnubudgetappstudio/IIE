import { MockTestMode } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import s3 from "../../config/s3Config";
import { parseTestCourseOrMock_CSV_Stream } from "../../utils/commonUtils";

export const getMockTestQuestionsService = async ({
    studentId,
    test_mode,
}: {
    studentId: string;
    test_mode: MockTestMode;
}) => {
    // ✅ Validate Student
    const student = await prisma.student.findUnique({
        where: { id: studentId, deletedAt: null },
        select: { id: true },
    });
    if (!student)
        throw new AppError({ statusCode: 404, message: "Student not found", data: [] });

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
    if (!batchId)
        throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });

    // ✅ Get Eligible Mock Test IDs
    const mockTestRelations = await prisma.test_Course_Or_Mock_With_Student.findMany({
        where: {
            studentId,
            test_type: "mock_test",
            deletedAt: null,
            submittedAt: null,
        },
        select: { mockTestId: true },
    });

    const mockTestIds = mockTestRelations.map((test) => test.mockTestId);
    if (!mockTestIds.length)
        throw new AppError({ statusCode: 404, message: "Mock Tests not found", data: [] });

    // ✅ Get Mock Test Details
    const mockTests = await prisma.test_Mock.findMany({
        where: {
            id: { in: mockTestIds as string[] },
            test_mode,
            deletedAt: null,
        },
        select: {
            id: true,
            test_mode: true,
            questions: true,
            test_url: true,
        },
    });

    const finalQuestions: any[] = [];

    for (const test of mockTests) {
        // 🧩 Parse JSON questions
        if (test.questions) {
            try {
                const parsed = JSON.parse(test.questions);
                if (Array.isArray(parsed)) finalQuestions.push(...parsed);
            } catch {
                console.warn(`⚠️ Invalid JSON in questions for test: ${test.test_mode}`);
                throw new AppError({
                    statusCode: 400,
                    message: `Invalid JSON in questions for test: ${test.test_mode}`,
                    data: [],
                });
            }
        }

        // 🧩 Parse CSV from S3
        if (test.test_url) {
            try {
                const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: test.test_url });
                const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
                if (response.Body) {
                    const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
                    finalQuestions.push(...rows);
                }
            } catch (err) {
                console.warn(`⚠️ Failed to parse CSV for test: ${test.test_mode}`, err);
                throw new AppError({
                    statusCode: 404,
                    message: `Failed to parse CSV for test: ${test.test_mode}`,
                    data: [],
                });
            }
        }
    }

    return { finalQuestions };
};