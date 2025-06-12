import { prisma } from "../../../../config/database";
import { parseDDMMYYYYToDate, parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { Prisma, TestType, StudentTestStatus } from "@prisma/client";
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
    test_title: string;
    test_description: string;
    test_csv_file?: Express.Multer.File | null;
    startDate: string; // dd/MM/yyyy
    endDate: string;   // dd/MM/yyyy
    timer: string;     // HH:mm
    questions?: Question[];
}

export const createCourseTestService = async ({
    userId,
    batchId,
    test_title,
    test_description,
    test_csv_file,
    startDate,
    endDate,
    timer,
    questions,
}: CreateCourseTestRequest) => {
    let test_csv_FileUrl = "";

    // Step 1: Validate staff
    const existingStaff = await prisma.managementStaff.findUnique({
        where: { id: userId, role: "staff", deletedAt: null },
    });

    if (!existingStaff) {
        throw new AppError({ statusCode: 404, message: "User not found!" });
    }

    // Step 2: Validate batch
    let existingBatch = await prisma.batchDetail.findFirst({
        where: {
            id: batchId ?? '',
            deletedAt: null,
        },
        select: {
            id: true,
            batchName: true,
        },
    });

    if (!existingBatch) {
        existingBatch = await prisma.batchDetail.findFirst({
            where: { deletedAt: null },
            select: { id: true, batchName: true },
        });
    }

    // Step 3: Get students in batch
    const getBatchStudents = await prisma.batchWithStudent.findMany({
        where: { batch_id: existingBatch?.id, deletedAt: null },
        select: { student_id: true },
    });

    if (!getBatchStudents.length) {
        throw new AppError({ statusCode: 404, message: "No students found in the batch!" });
    }

    // Step 4: Parse & validate dates
    console.log("Start date:", startDate);
    console.log("End date:", endDate);
    const formattedStartDate = parseDDMMYYYYToDate(startDate);
    const formattedEndDate = parseDDMMYYYYToDate(endDate);
    const today = new Date();
    if (formattedStartDate < new Date(today.setHours(0, 0, 0, 0))) {
        throw new AppError({
            statusCode: 400,
            message: `Start date (${startDate}) cannot be in the past.`,
        });
    }
    if (formattedEndDate < formattedStartDate) {
        throw new AppError({
            statusCode: 400,
            message: `End date (${endDate}) must be after start date (${startDate})`,
        });
    }

    // Step 5: Handle CSV file upload (parse & extract questions, upload to S3)
    if (test_csv_file) {
        try {
            const fileStream = Readable.from(test_csv_file.buffer);

            // Parse and assign extracted questions from CSV
            questions = await parseTestCourseOrMock_CSV_Stream(fileStream);

            const { s3url } = await uploadBufferToS3({
                buffer: test_csv_file.buffer,
                file: test_csv_file,
                batchId,
                role: "staff",
                userId,
                is_test_file: true,
                test_file_type: "course_test",
            });

            test_csv_FileUrl = s3url;
        } catch (error) {
            throw new AppError({
                statusCode: 400,
                message: "Invalid CSV Test file format. Please upload a valid file.",
            });
        }
    }

    questions = questions?.map(q => ({
        ...q,
        options: q.options.filter(opt => opt && opt.trim() !== ''),
    }));

    // Step 6: Create Course Test (with extracted questions stored as JSON)
    const courseTest = await prisma.test_Course.create({
        data: {
            batch_id: existingBatch?.id || "",
            batch_name: existingBatch?.batchName || "",
            test_title,
            test_description,
            test_url: test_csv_FileUrl || null,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            timer,
            questions: questions?.length ? JSON.stringify(questions) : null,
        },
    }).catch((error) => {
        throw new AppError({
            statusCode: 400,
            message: "Something went wrong while creating the course test.",
            data: {}
        });
    });

    // Step 7: Assign test to students
    const assignmentPayload = getBatchStudents.map((student) => ({
        batchId: existingBatch?.id || "",
        studentId: student.student_id,
        courseTestId: courseTest.id,
        test_type: TestType.course_test,
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
            message: "Something went wrong while assigning the course test to students.",
            data: {}
        });
    });

    return {
        ...courseTest,
        questions: JSON.parse(courseTest.questions || "[]"),
    };
};


export const deleteCourseTestService = async (testId: string) => {
    const existingTest = await prisma.test_Course.findFirst({
        where: { id: testId, deletedAt: null },
    });

    if (!existingTest) {
        throw new AppError({ statusCode: 404, message: "Test not found", data: [] });
    }

    // // Check if any students have already started or submitted this test
    // const studentAttempts = await prisma.test_Course_Or_Mock_With_Student.findMany({
    //     where: {
    //         courseTestId: testId,
    //         test_type: 'course_test',
    //         deletedAt: null,
    //     },
    // });

    // if (studentAttempts.length > 0) {
    //     throw new AppError({
    //         statusCode: 400,
    //         message: "Cannot delete test: One or more students have already attempted or been assigned this test.",
    //     });
    // }

    // Soft delete the test
    await prisma.test_Course.update({
        where: { id: testId },
        data: {
            deletedAt: new Date(),
        },
    });

    return true;
};
