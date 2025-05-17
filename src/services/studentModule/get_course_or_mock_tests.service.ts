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
import { TestType, MockTestMode } from "@prisma/client";

interface Params {
    studentId: string;
    role: string;
    test_type: TestType;
    search: string | null;
    page: number;
    limit: number;
   //  test_mode?: string | null; // ✅ included
}

interface Params {
  studentId: string;
  role: string;
  test_mode: string; // easy, medium, hard
  correct_answer_count: number;
  test_type: TestType;
}

export const studentGetAllCourseOrMockTestsService = async ({
    studentId,
    role,
    test_type,
    search,
    page,
    limit,
    test_mode, // ✅ included
}: Params) => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    // ✅ Validate Student
    console.log("studentId=====>", studentId);
    if(studentId !== "undefined" && role === "student"){
      const student = await prisma.student.findUnique({
          where: { id: studentId, deletedAt: null },
          select: { id: true },
      });
      if (!student) throw new AppError({ statusCode: 404, message: "Student not found" });
    // }

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
    var whereCondition: any = {
        studentId,
        test_type,
        batchId,
        deletedAt: null,
    };
  }else{
    var whereCondition: any = {
        test_type,
        deletedAt: null,
    };
  }
    console.log("test_mode=====>", test_mode);
     if (test_type === "mock_test" && test_mode) {
    whereCondition.mock_test_relation = {
      test_mode: test_mode,
    };
  }
    if (searchTerm && test_type === "course_test") {
        whereCondition.course_test_relation = {
            test_title: { startsWith: searchTerm }
        };
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
                course_test_relation: {
                    select: { test_title: true },
                },
                 mock_test_relation: {
          select: {
            test_mode: true,
          },
        },

            },
        }),
        prisma.test_Course_Or_Mock_With_Student.count({ where: whereCondition }),
    ]);

    // ✅ Map and enrich test data
  // ✅ Map and enrich test data
const enhancedTests = await Promise.all(
  tests.map(async (test) => {
    let testData: any;
    let total_questions = 0;

    if (test.test_type === "course_test" && test.courseTestId) {
      testData = await prisma.test_Course.findFirst({
        where: { id: test.courseTestId, deletedAt: null },
        select: {
          id: true,
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

       if (!testData) return null;

      if (testData.test_url && !testData.questions) {
        try {
          const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: testData.test_url });
          const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
          if (response.Body) {
            const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
            total_questions = rows.length;
          }
        } catch (err) {
          throw new AppError({
            statusCode: 404,
            message: `Failed to parse CSV for test: ${testData.test_title}`,
            data: [],
          });
        }
      } else if (testData.questions) {
        try {
          const parsed = typeof testData.questions === "string"
            ? JSON.parse(testData.questions)
            : testData.questions;
          total_questions = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          throw new AppError({
            statusCode: 404,
            message: `Invalid JSON in questions for test: ${testData.test_title}`,
            data: [],
          });
        }
      }

      return {
        test_id: testData.id,
        test_title: testData.test_title,
        test_description: testData.test_description,
        test_type: test.test_type,
        end_date: formatDateOnly(testData.end_date),
        timer: formatDurationFromTimeString(testData.timer),
        batch_number: testData.batch_detail_relation.batch_number,
        status: test.status,
        test_mode: null,
        management_staff_name: null,
        total_questions,
      };
    }
console.log("test.test.mockTestId=====>", test.mockTestId);
    if (test.test_type === "mock_test" && test.mockTestId) {
      const rawTestData = await prisma.test_Mock.findFirst({
        where: { id: test.mockTestId, deletedAt: null },
        select: {
          id: true,
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
      console.log("rawTestData=====>", rawTestData);

      if (!rawTestData)
        throw new AppError({ statusCode: 404, message: "Mock Test not found", data: [] });

      let parsedQuestions: any[] = [];

      try {
        parsedQuestions = typeof rawTestData.questions === "string"
          ? JSON.parse(rawTestData.questions)
          : rawTestData.questions;
      } catch (e) {
        console.error("Invalid JSON in questions field:", e);
      }

      if (rawTestData.test_url && (!parsedQuestions || parsedQuestions.length === 0)) {
        try {
          const { Bucket, Key } = await extractS3BucketAndKeySize({ fileUrl: rawTestData.test_url });
          const response = await s3.send(new GetObjectCommand({ Bucket, Key }));
          if (response.Body) {
            const rows = await parseTestCourseOrMock_CSV_Stream(response.Body as Readable);
            total_questions = rows.length;
          }
        } catch (err) {
          throw new AppError({
            statusCode: 404,
            message: `Failed to parse CSV for mock test`,
            data: [],
          });
        }
      } else {
        total_questions = Array.isArray(parsedQuestions) ? parsedQuestions.length : 0;
      }

      return {
        test_id: rawTestData.id,
        test_mode: rawTestData.test_mode,
        questions: parsedQuestions,
        test_url: rawTestData.test_url,
        total_questions,
      };
    }

    return null;
  })
);
console.log("enhancedTests=====>", enhancedTests);

return {
    enhancedTests: enhancedTests.filter(Boolean),
    totalTests,
    currentPage,
    perPage,
    totalPages: Math.ceil(totalTests / perPage),
};
};



export const studentMockTestService = async ({
  studentId,
  test_mode,
  correct_answer_count,
  test_type
}: Params) => {

  const nextMode = decideNextMode(test_mode, correct_answer_count);
  if (!nextMode) {
    return { message: "No further questions available", questions: [] };
  }

  const test = await prisma.test_Mock.findFirst({
    where: {
       test_mode: nextMode as MockTestMode,
      deletedAt: null,
    },
    select: {
      id: true,
      questions: true,
    },
  });

  if (!test) {
    throw new AppError({ statusCode: 404, message: `No ${nextMode} test found` });
  }

  let questions: any[] = [];
  try {
    questions = typeof test.questions === "string"
      ? JSON.parse(test.questions)
      : test.questions;
    // ✅ Shuffle and select 5 random questions
    questions = shuffleArray(questions).slice(0, 5);
  } catch (err) {
    console.error("Invalid JSON format in test questions");
    throw new AppError({ statusCode: 400, message: "Invalid questions format" });
  }

  return {
    test_mode: nextMode,
    test_id: test.id,
    questions,
  };
};

// Logic: decide next mode
function decideNextMode(currentMode: string, correct: number): string | null {
  if (currentMode === "easy") {
    if (correct == 5 || correct == 4) return "medium";
    if (correct == 3) return "easy";
    return "easy"; // for 2, 1, or 0
  }

  if (currentMode === "medium") {
    if (correct == 5 || correct == 4) return "hard";
    if (correct == 3) return "medium";
    return "easy"; // for 2, 1, or 0
  }

  if (currentMode === "hard") {
    if (correct == 5 || correct == 4) return null; // final stage complete
    if (correct == 3) return "hard";
    return "medium"; // for 2, 1, or 0
  }

  return null;
}

// Logic: shuffle array
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}


