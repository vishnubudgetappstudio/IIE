import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { removeStudentsFromBatchSchema } from "../../../zodSchema/counsellor.schema";
import { AppError } from "../../../utils/errorHandler";
import { removeStudentsFromBatchService } from "../../../services/counsellorModule/batch_related/remove_students_from_batch.service";

export const removeStudentsFromBatchController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Validate Request Body
        const validatedData = removeStudentsFromBatchSchema.safeParse(req.body);

        if (!validatedData.success) {
            const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message
            throw new AppError({ statusCode: 400, data: {}, message: firstErrorMessage });
        }

        const { batch_id, student_ids } = validatedData.data;

        const { removedStudents } = await removeStudentsFromBatchService(batch_id, student_ids);

        res.status(200).json({
            status: true,
            data: removedStudents,
            message: `${removedStudents?.length} Students removed successfully`
        });
    } catch (error: any) {
        console.error("Error Removing Students From Batch:", error);
        next(error);
    }
};