import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { getAllStudentsListService } from "../../../services/counsellorModule/student_related/get_all_students.service";

/**
 * Get batch students with pagination and search query
 * @param page - Current page number
 * @param limit - Number of students per page
 * @param batchId - (Optional) Filter students by batch
 * @param search - (Optional) Search students by name
 */

export const getAllStudentsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const batchId = req.query.batch_id as string || undefined;
        const search = (req.query.searchQuery as string) || undefined; // Extract search query

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        const { students, currentPage, perPage, totalPages, totalStudents } = await getAllStudentsListService({
            page,
            limit,
            search,
            batchId,
        });

        // Return the all students list
        res.status(200).json({
            status: true,
            data: students,
            page: currentPage,
            limit: perPage,
            totalPages,
            totalStudents,
            message: "Students fetched successfully",
        });
    } catch (error) {
        console.error("Error get All Students", error)
        next(error);
    }
};