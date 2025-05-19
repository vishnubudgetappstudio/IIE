import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { getPDFMaterialFileListService } from "../../../services/staffModule/pdf_material_related/get_pdf_material_list.service";

/**
 * ✅ Handles fetching and parsing session sheet data from S3.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 * @returns JSON response with parsed CSV data.
 */
export const getPDFMaterialFileListController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.searchQuery as string) || undefined; // Extract search query
        const batchId = (req.query.batch_id as string) || undefined;

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        // ✅ Validate batch_id
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: [] });
        }
        console.log("sdfsdfsd");

        if (!req.user?.role || (req.user.role !== 'staff' && req.user.role !== 'counsellor')) {
            throw new AppError({ statusCode: 401, message: "Invalid role", data: [] });
        }


        // ✅ Fetch and parse session sheet data
        const { material_files, material_files_count, currentPage, totalPages, perPage } = await getPDFMaterialFileListService({
            batch_id: batchId,
            search: search,
            userId: req.user.userId,
            page: page,
            limit: limit
        });

        // ✅ Send successful response
        res.status(200).json({
            status: true,
            data: material_files,
            currentPage: currentPage,
            limit: perPage,
            xls_files_count: material_files_count,
            totalPages: totalPages,
            message: "Material PDF Files List fetched successfully",
        });
    } catch (error) {
        console.error("❌ Error Fetching PDF Material Files List:", error);
        next(error);
    }
};