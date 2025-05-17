import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import s3 from "../../config/s3Config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import { parseTestCourseOrMock_CSV_Stream } from "../../utils/commonUtils";
import { Readable } from "stream";
import { $Enums } from "@prisma/client";

interface Params {
  test_type: string;
  test_mode: string;
}

export const guestGetMockTestQuestionsService = async ({
  test_type,
  test_mode,
}: Params) => {
  // ✅ Validate test_type
  if (test_type !== "mock_test") {
    throw new AppError({
      statusCode: 400,
      message: "Only 'mock_test' type is supported.",
    });
  }

  // ✅ Validate test_mode as enum
  const validModes: $Enums.MockTestMode[] = ["easy", "medium", "hard"];
  if (!validModes.includes(test_mode as $Enums.MockTestMode)) {
    throw new AppError({
      statusCode: 400,
      message: "Invalid test_mode. Allowed values: easy, medium, hard.",
    });
  }

  // ✅ Find latest test_Course_Or_Mock_With_Student entry by test_type & test_mode
  const latestMockEntry = await prisma.test_Course_Or_Mock_With_Student.findFirst({
    where: {
      test_type,
      deletedAt: null,
      mock_test_relation: {
        test_mode: test_mode as $Enums.MockTestMode,
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      mockTestId: true,
    },
  });

  if (!latestMockEntry?.mockTestId) {
    throw new AppError({
      statusCode: 404,
      message: `No mock test found with mode '${test_mode}'.`,
    });
  }

  // ✅ Fetch mock test details
  const mockTest = await prisma.test_Mock.findFirst({
    where: {
      id: latestMockEntry.mockTestId,
      test_mode: test_mode as $Enums.MockTestMode,
      deletedAt: null,
    },
    select: {
      id: true,
      test_mode: true,
      test_url: true,
      questions: true,
    },
  });

  if (!mockTest) {
    throw new AppError({
      statusCode: 404,
      message: "Mock test not found.",
    });
  }

  // ✅ Parse questions
  let questions: any[] = [];

  try {
    questions = typeof mockTest.questions === "string"
      ? JSON.parse(mockTest.questions)
      : mockTest.questions;
  } catch (e) {
    console.error("Failed to parse JSON questions:", e);
  }

  // ✅ Fallback to S3 CSV if no questions in DB
  if ((!questions || questions.length === 0) && mockTest.test_url) {
    try {
      const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: mockTest.test_url });
      const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
      if (response.Body) {
        const parsedCSV = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
        questions = parsedCSV;
      }
    } catch (err) {
      throw new AppError({
        statusCode: 500,
        message: "Failed to fetch or parse questions from S3 CSV.",
      });
    }
  }

  return {
    test_id: mockTest.id,
    test_mode: mockTest.test_mode,
    test_url: mockTest.test_url || null,
    total_questions: questions.length,
    questions: questions.map((q) => ({
      question: q.question,
      options: q.options,
      explanation: q.explanation,
      correctAnswer: q.correctAnswer,
    })),
  };
};
