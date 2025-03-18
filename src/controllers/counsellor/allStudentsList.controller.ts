import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errorHandler";
import { getAllStudentsList } from "../../services/counsellor/allStudentsList.service";

/**
 * Get batch students with pagination and search query
 * @param page - Current page number
 * @param limit - Number of students per page
 * @param batchId - (Optional) Filter students by batch
 * @param searchQuery - (Optional) Search students by name
 */

export const getAllStudentsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const batchId = req.query.batch_id as string || undefined;
        const searchQuery = (req.query.search as string) || undefined; // Extract search query

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        const { students, currentPage, perPage, totalPages, totalStudents } = await getAllStudentsList({
            page,
            limit,
            searchQuery,
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
