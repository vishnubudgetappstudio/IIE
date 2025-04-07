import { prisma } from "../../../../config/database";
import { parseDDMMYYYYToDate, parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../../utils/errorHandler";
import { Readable } from "stream";
import { uploadBufferToS3, uploadFileToS3 } from "../../../s3/uploadFiles.service";

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
    test_csv_file?: Express.Multer.File;
    test_type: "mock_test" | "course_test";
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
    test_type,
    startDate,
    endDate,
    timer,
    questions,
}: CreateCourseTestRequest) => {
    try {
        let test_csv_FileUrl: string = "";

        const existingStaff = await prisma.managementStaff.findUnique({
            where: { id: userId, role: "staff", deletedAt: null },
        });

        if (!existingStaff) {
            throw new AppError({
                statusCode: 404,
                message: "User not found!",
                data: {},
            });
        }

        // 🚀 Step 1: Check if batch number already exists
        const existingBatch = await prisma.batchDetail.findUnique({
            where: { id: batchId, deletedAt: null },
            select: { id: true, batch_number: true, batchName: true },
        });

        if (!existingBatch) {
            throw new AppError({
                statusCode: 404,
                message: "Batch not found!",
                data: {},
            });
        }

        const formattedStartDate = parseDDMMYYYYToDate(startDate);
        const formattedEndDate = parseDDMMYYYYToDate(endDate);
        const today = new Date();

        // 📌 Rule 1: test start_date should not be in the past
        if (formattedStartDate < new Date(today.setHours(0, 0, 0, 0))) {
            throw new AppError({
                statusCode: 400,
                message: `Create Test start date (${startDate}) cannot be in the past`,
            });
        }

        // 📌 Rule 2: test end_date must be after start_date
        if (formattedEndDate <= formattedStartDate) {
            throw new AppError({
                statusCode: 400,
                message: `Create Test End date (${endDate}) must be after the start date (${startDate})`,
            });
        }

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
                    test_file_type: test_type
                });

                test_csv_FileUrl = s3url;
            } catch (error) {
                console.error("❌ Upload CSV Test file Failed:", error);
                throw new AppError({
                    statusCode: 400,
                    message: "Invalid CSV Test file data format. Please upload a valid CSV Test file data.",
                    data: {},
                });
            }
        }

        const courseTest = await prisma.test_Course_Or_Mock.create({
            data: {
                batch_id: batchId,
                batch_name: existingBatch.batchName || '',
                test_title,
                test_description,
                test_url: test_csv_FileUrl || null,
                test_type,
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                timer,
                questions: questions?.length ? JSON.stringify(questions) : null,
            },
        });

        return {
            ...courseTest,
            questions: JSON.parse(courseTest.questions || "[]"),
        };
    } catch (error: any) {
        console.error("Error creating course test:", error);

        // Prisma-specific error handling
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2000") {
                throw new AppError({
                    statusCode: 400,
                    message: "Questions payload is too large. Try reducing the content or use a file upload.",
                    data: {}
                });
            }
        }

        throw new AppError({
            statusCode: 400,
            message: "Something went wrong while creating the course test.",
            data: {}
        });
    }
};
