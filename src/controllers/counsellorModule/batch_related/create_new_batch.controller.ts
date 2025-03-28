import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { validateFile } from "../../../utils/s3";
import { createNewBatchSchema } from "../../../zodSchema/counsellor.schema";
import { createNewBatchService } from "../../../services/counsellorModule/batch_related/create_new_batch.service";

export const createNewBatchController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // Validate that a single file is uploaded
        // ✅ Retrieve file (If single file upload)
        const sessionSheetFile = req.files ? (req.files as Express.Multer.File[])[0] : null;

        if (!sessionSheetFile) {
            throw new AppError({ statusCode: 400, message: "CSV file is required", data: {} });
        }

        // Validate file type (must be .csv)
        if (!sessionSheetFile.mimetype.includes("csv")) {
            throw new AppError({ statusCode: 400, message: "Only CSV files are allowed", data: {} });
        }

        if (!sessionSheetFile) {
            throw new AppError({ statusCode: 400, message: "file is required", data: {} });
        }

        validateFile(sessionSheetFile);

        // Validate Request Body
        const validatedData = createNewBatchSchema.parse(req.body);

        // Call Service to Create New Batch
        const response = await createNewBatchService({
            ...validatedData,
            sessionSheetFile: sessionSheetFile, // Attach uploaded file URL
            students_id: validatedData.students_id!,
        });

        // Send Success Response
        res.status(201).json({
            status: true,
            ...response,
            message: "Batch created successfully with CSV file",
        });
    } catch (error) {
        console.error("❌ Error Creating Batch:", error);
        next(error);
    }
};