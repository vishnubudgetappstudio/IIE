import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { batchIdSchema } from "../../../zodSchema/counsellor.schema";
import { getAllStudentsFromBatchService } from "../../../services/counsellorModule/batch_related/get_all_students_from_batch.service";

export const getAllStudentsFromBatchController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.searchQuery as string)?.trim() || undefined;
        const batchId = req.query.batch_id as string;

        if (!batchId) {
            throw new AppError({ statusCode: 400, message: "batch_id is required", data: [] });
        }

        const validated = batchIdSchema.safeParse(batchId);
        if (!validated.success) {
            throw new AppError({
                statusCode: 400,
                message: validated.error.errors[0].message,
                data: [],
            });
        }

        const result = await getAllStudentsFromBatchService(batchId, page, limit, search);

        res.status(200).json({
            status: true,
            message: "Batch students fetched successfully",
            ...result,
        });
    } catch (error) {
        console.error("Error in getAllStudentsFromBatchController:", error);
        next(error);
    }
};
