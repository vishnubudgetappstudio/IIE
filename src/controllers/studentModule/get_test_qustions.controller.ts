import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { getTestQuestionsListService } from "../../services/studentModule/get_test_questions.service";
import { TestType } from "@prisma/client";

export const getQuestionsListController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) throw new AppError({ statusCode: 404, message: "Unauthorized access", data: {} });

        if (req.user?.role !== 'student') throw new AppError({
            statusCode: 404,
            message: "Unauthorized Role access, need student token",
            data: {}
        });

        const studentId = req.user?.userId as string;

        const test_id = req.query?.test_id as string;

        if (!test_id) throw new AppError({ statusCode: 404, message: "Test id is required", data: [] });

        const test_type = req.query?.test_type as TestType;

        if (!test_type) throw new AppError({ statusCode: 404, message: "Test type is required", data: [] });

        const finalResult = await getTestQuestionsListService({
            studentId: studentId,
            testId: test_id,
            testType: test_type
        });

        res.status(200).json({
            status: true,
            data: finalResult,
            message: `${test_type === "mock_test" ? "Mock" : "Course"} Test Questions fetched successfully.`,
        });

    } catch (error) {
        console.error("Error in getQuestionsListController:", error);
        next(error);
    }
}