import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { validateFile } from "../../../utils/s3";
import { createNewBatchSchema } from "../../../zodSchema/counsellor.schema";
import { createNewBatchService } from "../../../services/counsellorModule/batch_related/create_new_batch.service";
import { CommonUserRole } from "@prisma/client";

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
        const validatedData = createNewBatchSchema.safeParse(req.body);

        if (!validatedData.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validatedData.error.errors[0].message, // Get first error message
            });
        }

        const { batch_number, from_date, to_date, course, slot, mentor_id, students_id } = validatedData.data;

        // Call Service to Create New Batch
        const response = await createNewBatchService({
            batch_number: batch_number!,
            from_date: from_date!,
            to_date: to_date!,
            course: course!,
            slot: slot!,
            mentor_id: mentor_id!, // Attach mentor ID to request body data
            sessionSheetFile: sessionSheetFile, // Attach uploaded file URL
            students_id: students_id!,
            role: req.user?.role as CommonUserRole, // Attach user role to request body data
            userId: req.user.userId, // Attach user ID to request body data
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