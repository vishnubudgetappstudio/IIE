import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { createNewStudentService, getAllStudentsListService } from "../../services/counsellorModule/students.service";
import { createNewStudentSchema } from "../../zodSchema/counsellor.schema";

export const createNewStudentController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Validate user authentication
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }

        const { userId, name: counsellor_name } = req.user;

        // Validate Request Body (based on schema)
        const validatePayload = createNewStudentSchema.safeParse(req.body);

        if (!validatePayload?.success) {
            const firstErrorMessage = validatePayload.error.errors[0].message; // Get first error message

            throw new AppError({
                statusCode: 400,
                data: {}, // Always send an empty object
                message: firstErrorMessage, // Set message from Zod error
            });
        }

        // Extract data from request body
        const { name, email, roll_number, course_id, phone_number, alt_phone, preferred_batch } = req.body;

        //call create student service
        const response = await createNewStudentService({
            name: name,
            course_id: course_id,
            email: email,
            roll_number: roll_number,
            phone: phone_number,
            alt_phone: alt_phone,
            counsellor_id: userId,
            counsellor_name: counsellor_name,
            preferred_batch: preferred_batch,
        });

        // Send Success Response
        res.status(200).json({
            status: true,
            ...response,
            message: "Create New Student successfully",
        });
    } catch (error: any) {
        console.error("Error Create New Student:", error);
        next(error);
    }
};

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

        const { students, currentPage, perPage, totalPages, totalStudents } = await getAllStudentsListService({
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