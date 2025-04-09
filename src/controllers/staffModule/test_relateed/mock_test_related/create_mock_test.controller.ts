import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { AppError } from "../../../../utils/errorHandler";
import { createMockTestSchema } from "../../../../zodSchema/staff.schema";
import { validateFile } from "../../../../utils/s3";
import { createMockTestService } from "../../../../services/staffModule/test_related/mock_test_related/create_mock_test.service";

export const createMockTestController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // Validate that a single file is uploaded
        // ✅ Retrieve file (If single file upload)
        const testCSVFile = req.files ? (req.files as Express.Multer.File[])[0] : null;

        // Validate file type (must be .csv)
        if (testCSVFile && !testCSVFile.mimetype.includes("csv")) {
            throw new AppError({ statusCode: 400, message: "Only CSV files are allowed", data: {} });
        }

        if (testCSVFile) validateFile(testCSVFile);

        // Parse JSON string fields from form-data
        if (typeof req.body.questions === "string") {
            try {
                req.body.questions = JSON.parse(req.body.questions);
            } catch (err) {
                throw new AppError({
                    statusCode: 400,
                    message: "Invalid JSON format in questions",
                    data: {},
                });
            }
        }

        // Validate request body
        const validation = createMockTestSchema.safeParse(req.body);

        if (!validation.success) {
            const firstError = validation.error.errors[0].message;
            throw new AppError({
                statusCode: 400,
                message: firstError,
                data: {},
            });
        }

        const {
            batch_id,
            questions,
            test_mode
        } = validation.data;

        const response = await createMockTestService({
            userId: req.user?.userId as string,
            batchId: batch_id,
            test_csv_file: testCSVFile,
            test_mode: test_mode,
            questions,
        });

        res.status(201).json({
            status: true,
            data: response,
            message: "Mock Test Created Successfully",
        });
    } catch (error) {
        console.error("Error Creating Mock Test:", error);
        next(error);
    }
};
