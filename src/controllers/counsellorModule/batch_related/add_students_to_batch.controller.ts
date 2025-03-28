import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { addStudentsToBatchSchema } from "../../../zodSchema/counsellor.schema";
import { AppError } from "../../../utils/errorHandler";
import { addStudentsToBatchService } from "../../../services/counsellorModule/batch_related/add_students_to_batch.service";

export const addStudentsToBatchController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Validate Request Body
        const validatedData = addStudentsToBatchSchema.safeParse(req.body);

        if (!validatedData.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validatedData.error.errors[0].message, // Get first error message
            });
        }

        const { batch_id, student_ids } = validatedData.data;

        // Call Service Function to Add Students
        const { addedStudents } = await addStudentsToBatchService(batch_id, student_ids);

        res.status(201).json({
            status: true,
            data: addedStudents,
            message: `${addedStudents?.length} students added successfully`,
        });
    } catch (error) {
        console.error("Error Adding Students to Batch:", error);
        next(error);
    }
};