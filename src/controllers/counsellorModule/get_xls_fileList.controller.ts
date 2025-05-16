import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { getXLSFileListService } from "../../services/counsellorModule/get_xls_fileList.service";
import { deleteXLSFileService } from "../../services/counsellorModule/get_xls_fileList.service";

/**
 * ✅ Handles fetching and parsing session sheet data from S3.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 * @returns JSON response with parsed CSV data.
 */
export const getXLSFileListController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.searchQuery as string) || undefined; // Extract search query

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        // ✅ Validate batch_id
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: [] });
        }

        if (!req.user?.role || req.user?.role !== "counsellor") {
            throw new AppError({ statusCode: 401, message: "Unauthorized role access", data: [] });
        }

        // ✅ Fetch and parse session sheet data
        const { xls_files, currentPage, totalPages, xls_files_count, perPage } = await getXLSFileListService({
            counsellorId: req.user?.userId,
            search: search,
            page: page,
            limit: limit
        });

        // ✅ Send successful response
        // res.status(200).json({ success: true, data: , message: "XLS Files List fetched successfully" });
        res.status(200).json({
            status: true,
            data: xls_files,
            currentPage: currentPage,
            limit: perPage,
            xls_files_count: xls_files_count,
            totalPages: totalPages,
            message: "XLS Files List fetched successfully",
        });
    } catch (error) {
        console.error("❌ Error Fetching XLS Files List:", error);
        next(error);
    }
};


export const deleteXLSFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { fileId } = req.params;

        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: [] });
        }

        if (req.user.role !== "counsellor") {
            throw new AppError({ statusCode: 403, message: "Forbidden: Access restricted to counsellors", data: [] });
        }

        if (!fileId) {
            throw new AppError({ statusCode: 400, message: "Missing file ID", data: [] });
        }

        const deletedFile = await deleteXLSFileService({
            fileId,
            counsellorId: req.user.userId
        });

        res.status(200).json({
            status: true,
            message: "XLS file deleted successfully",
            data: deletedFile
        });
    } catch (error) {
        console.error("❌ Error Deleting XLS File:", error);
        next(error);
    }
};
