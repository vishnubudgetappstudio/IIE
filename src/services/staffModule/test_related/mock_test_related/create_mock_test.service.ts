import { prisma } from "../../../../config/database";
import { parseTestCourseOrMock_CSV_Stream } from "../../../../utils/commonUtils";
import { MockTestMode, Prisma } from "@prisma/client";
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
    test_csv_file?: Express.Multer.File;
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

        const mockTestResponse = await prisma.test_Mock.create({
            data: {
                batch_id: batchId,
                batch_name: existingBatch.batchName || '',
                test_url: test_csv_FileUrl || null,
                questions: questions?.length ? JSON.stringify(questions) : null,
            },
        });

        return {
            ...mockTestResponse,
            mentor_id: existingStaff.id,
            mentor_name: existingStaff.name,
            questions: JSON.parse(mockTestResponse.questions || "[]"),
        };
    } catch (error: any) {
        console.error("Error Creating Mock Test:", error);

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
            message: "Something went wrong while creating the mock test.",
            data: {}
        });
    }
};
