import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { getMockTestQuestionsService } from "../../services/studentModule/get_mock_test_questions.service";
import { MockTestMode } from "@prisma/client";

export const getMockTestQuestionsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError({ statusCode: 404, message: "Unauthorized access", data: {} });

        if (req.user?.role !== 'student') throw new AppError({
            statusCode: 404,
            message: "Unauthorized Role access, need student token",
            data: {}
        });

        const studentId = req.user?.userId as string;

        const finalResult = await getMockTestQuestionsService({
            studentId,
            test_mode: req.query?.test_mode as MockTestMode,
        });

        res.status(200).json({
            status: true,
            data: finalResult,
            message: "Mock Tests fetched successfully.",
        });
    } catch (error) {
        console.error("Error in getMockTestsController:", error);
        next(error);
    }
}