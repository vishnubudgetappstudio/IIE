import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/errorHandler";
import { z } from "zod";
import { testSubmitService } from "../../services/studentModule/test_submit.service";
import { submitTestSchema } from "../../zodSchema/student.schema";
import { AuthRequest } from "../../middlewares/auth.middleware";

// Controller function
export const testSubmitController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            throw new AppError({
                statusCode: 401,
                data: {},
                message: "Unauthorized User",
            });
        }

        if (req.user?.role !== "student") {
            throw new AppError({
                statusCode: 401,
                data: {},
                message: "Unauthorized Role access, need student token",
            });
        }

        const student_id = req.user?.userId as string;

        const parseResult = submitTestSchema.safeParse(req.body);

        if (!parseResult.success) {
            throw new AppError({
                statusCode: 400,
                message: "Invalid input data",
                data: parseResult.error.flatten().fieldErrors,
            });
        }

        const {
            test_id,
            test_type,
            total_questions_count,
            total_correct_answers_count,
        } = parseResult.data;

        if (
            test_id === undefined ||
            test_type === undefined ||
            total_questions_count === undefined ||
            total_correct_answers_count === undefined
        ) {
            throw new AppError({
                statusCode: 400,
                message: "Missing required test submission fields",
                data: {},
            });
        }

        const { updatedTest } = await testSubmitService({
            student_id,
            test_id,
            test_type,
            total_questions_count,
            total_correct_answers_count,
        });

        res.status(200).json({
            success: true,
            message: "Test submitted successfully",
            data: updatedTest,
        });
    } catch (error) {
        console.error("Error in testSubmitController:", error);
        next(error);
    }
};
