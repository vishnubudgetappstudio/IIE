import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { getStudentStudyMaterialsService } from "../../services/studentModule/get_study_material.service";

export const getStudentStudyMaterialsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        if (!req.user?.role || req.user?.role !== 'student') {
            throw new AppError({ statusCode: 401, message: "Invalid role", data: [] });
        }

        // ✅ Fetch and parse session sheet data
        const { material_files, material_files_count, currentPage, totalPages, perPage } = await getStudentStudyMaterialsService({
            student_id: req.user?.userId,
            search: search,
            page: page,
            limit: limit
        });

        // ✅ Send successful response
        res.status(200).json({
            status: true,
            data: material_files,
            currentPage: currentPage,
            limit: perPage,
            material_files_count: material_files_count,
            totalPages: totalPages,
            message: "Study Material Files List fetched successfully",
        });

    } catch (err) {
        console.error("Error in getStudentStudyMaterialsController:", err);
        next(err);
    }
}