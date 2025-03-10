import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errorHandler";
import { getAllStudentsList } from "../../services/counsellor/allStudentsList.service";

/**
 * Controller to get all students with pagination
 */
export const getAllStudentsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) ?? 1;
        const limit = parseInt(req.query.limit as string) ?? 10;
        const searchQuery = (req.query.search as string) ?? undefined; // Extract search query

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: {} });
        }

        const { students, currentPage, perPage, totalPages, totalStudents } = await getAllStudentsList(page, limit, searchQuery);

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
        next(error);
    }
};
