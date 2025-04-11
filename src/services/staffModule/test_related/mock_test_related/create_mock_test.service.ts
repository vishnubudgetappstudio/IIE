import { prisma } from "../../../../config/database";
import { parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { MockTestMode, Prisma, StudentTestStatus, TestType } from "@prisma/client";
import { AppError } from "../../../../utils/errorHandler";
import { Readable } from "stream";
import { uploadBufferToS3 } from "../../../s3/uploadFiles.service";

interface Question {
    question: string;
    options: string[];
    explanation?: string;
    correctAnswer: string;
}

interface CreateCourseTestRequest {
    userId: string;
    batchId: string;
    test_csv_file?: Express.Multer.File | null;
    test_mode: MockTestMode;
    questions?: Question[];
}

export const createMockTestService = async ({
    userId,
    batchId,
    test_csv_file,
    test_mode,
    questions,
}: CreateCourseTestRequest) => {
    let test_csv_FileUrl: string = "";

    let test_questions = [];

    // Step 1: Validate staff
    const existingStaff = await prisma.managementStaff.findUnique({
        where: { id: userId, role: "staff", deletedAt: null },
    });

    if (!existingStaff) {
        throw new AppError({ statusCode: 404, message: "User not found!", data: {} });
    }

    // Step 2: Validate batch
    const existingBatch = await prisma.batchDetail.findUnique({
        where: { id: batchId, deletedAt: null },
        select: { id: true, batchName: true },
    });

    if (!existingBatch) {
        throw new AppError({ statusCode: 404, message: "Batch not found!", data: {} });
    }

    // Step 3: Get students in batch
    const getBatchStudents = await prisma.batchWithStudent.findMany({
        where: { batch_id: existingBatch.id, deletedAt: null },
        select: { student_id: true },
    });

    if (!getBatchStudents.length) {
        throw new AppError({ statusCode: 404, message: "No students found in the batch!", data: {} });
    }

    if (!questions?.length && !test_csv_file) throw new AppError({
        statusCode: 400,
        message: "Please provide either questions or a CSV file",
        data: {}
    });

    // 🚀 Step 4: Validate CSV File (if provided)
    if (test_csv_file) {
        try {
            // ✅ Read file as Buffer (Node.js way)
            const fileStream = Readable.from(test_csv_file.buffer); // Convert Buffer to Stream

            // ✅ Read and validate CSV file
            const parsedData = await parseTestCourseOrMock_CSV_Stream(fileStream);

            // console.log("✅ CSV Validation Passed: ", parsedData.length, "rows");

            const { s3url } = await uploadBufferToS3({
                buffer: test_csv_file.buffer,
                file: test_csv_file,
                batchId: batchId,
                role: "staff",
                userId: userId,
                is_test_file: true,
                test_file_type: 'mock_test',
                mock_test_mode: test_mode
            });

            test_csv_FileUrl = s3url;
        } catch (error) {
            console.error("❌ Upload CSV Mock Test file Failed:", error);
            throw new AppError({
                statusCode: 400,
                message: "Invalid CSV Mock Test file data format. Please upload a valid CSV Mock Test file data.",
                data: {},
            });
        }
    }

    // if (questions?.length) {
    //     questions.map((question, index) => {
    //         test_questions.push({
    //             id: index + 1,
    //             question: question.question as string,
    //             options: question.options as string[],
    //             explanation: question.explanation as string,
    //             correctAnswer: question.correctAnswer as string,
    //         });
    //     })
    // }

    // Step 6: Create Course Test
    const mockTestResponse = await prisma.test_Mock.create({
        data: {
            batch_id: batchId,
            batch_name: existingBatch.batchName || "",
            test_url: test_csv_FileUrl || null,
            test_mode,
            questions: questions?.length ? JSON.stringify(questions) : null,
        },
    }).catch((error) => {
        throw new AppError({
            statusCode: 400,
            message: "Something went wrong while creating the mock test.",
            data: {}
        });
    });

    // Step 7: Assign test to students
    const assignmentPayload = getBatchStudents.map((student) => ({
        batchId,
        studentId: student.student_id,
        courseTestId: null,
        mockTestId: mockTestResponse.id,
        test_type: TestType.mock_test,
        status: StudentTestStatus.yet_to_start,
        createdAt: new Date(),
        updatedAt: null,
    }));

    await prisma.test_Course_Or_Mock_With_Student.createMany({
        data: assignmentPayload,
        skipDuplicates: true,
    }).catch((error) => {
        throw new AppError({
            statusCode: 400,
            message: "Something went wrong while creating the mock test with student.",
            data: {}
        });
    });
    return {
        ...mockTestResponse,
        mentor_id: existingStaff.id,
        mentor_name: existingStaff.name,
        questions: JSON.parse(mockTestResponse.questions || "[]"),
    };
};
