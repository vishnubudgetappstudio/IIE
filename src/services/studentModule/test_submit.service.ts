import { TestType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

interface TestSubmitInput {
    student_id: string;
    test_id: string;
    test_type: TestType;
    total_questions_count: string;
    total_correct_answers_count: string;
}

export const testSubmitService = async ({
    student_id,
    test_id,
    test_type,
    total_questions_count,
    total_correct_answers_count,
}: TestSubmitInput) => {

    // Validate student
    const student = await prisma.student.findUnique({
        where: { id: student_id, deletedAt: null },
        select: { id: true },
    });

    if (!student) {
        throw new AppError({
            statusCode: 404,
            message: "Student not found",
            data: {},
        });
    }

    // Fetch test with student association
    const test =
        test_type === "course_test"
            ? await prisma.test_Course.findUnique({
                where: { id: test_id, deletedAt: null },
                select: {
                    id: true,
                    TestCourseOrMockWithStudentModel: {
                        where: { studentId: student_id },
                        select: { id: true },
                    },
                },
            })
            // : await prisma.test_Mock.findUnique({
               : await prisma.test_Mock.findFirst({
                // where: { id: test_id, deletedAt: null },
                where: {deletedAt: null},
                select: {
                    id: true,
                    TestCourseOrMockWithStudentModel: {
                        where: { studentId: student_id },
                        select: { id: true },
                    },
                },
            });

    if ((!test || test.TestCourseOrMockWithStudentModel.length === 0) && test_type === "course_test") {
        throw new AppError({
            statusCode: 404,
            message: `${test_type.replace("_", " ")} not found or not assigned to student`,
            data: {},
        });
    }

    let testWithStudentId: string | undefined;
    let existingTestSubmit: any;

    if (test_type === "course_test" && test && test.TestCourseOrMockWithStudentModel.length > 0) {
        testWithStudentId = test.TestCourseOrMockWithStudentModel[0].id;

        // Check if test already submitted
        existingTestSubmit = await prisma.test_Course_Or_Mock_With_Student.findUnique({
            where: {
                id: testWithStudentId,
                test_type,
                studentId: student_id,
                submittedAt: null,
                deletedAt: null,
            },
        });
    }

    const studentBatch = await prisma.batchWithStudent.findFirst({
        where: { student_id: student_id, deletedAt: null }, 
    });

    if (!existingTestSubmit) {
        throw new AppError({
            statusCode: 400,
            message: "Test already submitted or not found",
            data: {},
        });
    }

    // Score calculation
    const totalCorrect = Number(total_correct_answers_count);
    const totalQuestions = Number(total_questions_count);
    const score = ((totalCorrect / totalQuestions) * 100).toFixed(2);

    let score_status: "poor" | "average" | "good";
    if (Number(score) >= 80) score_status = "good";
    else if (Number(score) >= 50) score_status = "average";
    else score_status = "poor";

    // Update the test record
    let updatedTest;

    if (test_type === "course_test") {
    updatedTest = await prisma.test_Course_Or_Mock_With_Student.update({
        where: {
        id: testWithStudentId,
        test_type,
        studentId: student_id,
        submittedAt: null,
        deletedAt: null,
        },
        data: {
        total_questions_count,
        correct_answers_count: total_correct_answers_count,
        incorrect_answers_count: (
            totalQuestions - totalCorrect
        ).toString(),
        status: "completed",
        score,
        score_status,
        submittedAt: new Date(),
        updatedAt: new Date(),
        },
    });
    }

    if (test_type === "mock_test" && !existingTestSubmit) {
    const createData: any = {
        studentId: student_id,
        test_type,
        total_questions_count,
        correct_answers_count: total_correct_answers_count ?? null,
        incorrect_answers_count: (
        Number(total_questions_count) - Number(total_correct_answers_count)
        ).toString() ?? null,
        status: "completed",
        score_status: score_status,
        score: score ?? null,
        submittedAt: new Date(),
        updatedAt: new Date(),
    };

    // Add batchId if it exists
    if (studentBatch?.batch_id) {
        createData.batchId = studentBatch.batch_id;
    }

    updatedTest = await prisma.test_Course_Or_Mock_With_Student.create({
        data: createData,
    });
    }

    // Optionally throw error or handle undefined
    if (!updatedTest) {
    throw new Error("No test was updated or created.");
    }

    return { updatedTest };
};
