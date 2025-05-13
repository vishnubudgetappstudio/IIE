import { Request, Response, NextFunction } from "express";
import { getAllCourseTestsService } from "../../../../services/staffModule/test_related/course_test_related/get_course_test.service";
import { AppError } from "../../../../utils/errorHandler";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { getAllMockTestsService } from "../../../../services/staffModule/test_related/mock_test_related/get_mock_test.service";

// Controller to fetch all mock tests
export const getAllMockTestsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.searchQuery as string || null;
        const batchId = req.query.batch_id as string || null;

        if (!req.user) throw new AppError({ statusCode: 404, message: "User not found", data: [] });

        if (req.user?.role !== 'staff') throw new AppError({ statusCode: 404, message: "Invalid role", data: [] });

        // Validate required param
        // if (!batchId || typeof batchId !== "string") {
        //     throw new AppError({
        //         statusCode: 400,
        //         message: "Batch ID is required and must be a string",
        //         data: [],
        //     });
        // }

        // Call service
        const { enhancedTests, perPage, currentPage, totalPages, totalTests } = await getAllMockTestsService({
            // batchId,
            search,
            page,
            limit,
        });

        // Send response
        res.status(200).json({
            status: true,
            data: enhancedTests,
            totalTestCount: totalTests,
            limit: perPage,
            page: currentPage,
            totalPages,
            message: "Mock tests fetched successfully",
        });
    } catch (error) {
        console.error("Error in get mock tests controller:", error);
        next(error); // Pass error to centralized error handler
    }
};
