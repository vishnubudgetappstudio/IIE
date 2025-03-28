import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { getSessionSheetDataService } from "../../../services/counsellorModule/batch_related/get_session_sheet_data.service";

/**
 * ✅ Handles fetching and parsing session sheet data from S3.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 * @returns JSON response with parsed CSV data.
 */
export const getSessionSheetDataController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const batchId = req.query.batch_id as string || undefined;
        const searchQuery = (req.query.search as string) || undefined; // Extract search query

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        // ✅ Validate batch_id
        if (!batchId) {
            throw new AppError({ statusCode: 400, message: "Batch ID is required", data: [] });
        }

        // ✅ Fetch and parse session sheet data
        const jsonData = await getSessionSheetDataService({
            batch_id: batchId,
            search: searchQuery,
            page: page,
            limit: limit
        });

        // ✅ Send successful response
        res.status(200).json({ success: true, data: jsonData, message: "Session sheet data fetched successfully" });
    } catch (error) {
        console.error("❌ Error fetching session sheet:", error);
        next(error);
    }
};