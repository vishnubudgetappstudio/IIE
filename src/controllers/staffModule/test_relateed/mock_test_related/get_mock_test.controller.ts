import { Request, Response, NextFunction } from "express";
import { getAllMockTestsService } from "../../../../services/staffModule/test_related/mock_test_related/get_mock_test.service";
import { AppError } from "../../../../utils/errorHandler";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { prisma } from "../../../../config/database"; // assuming you're using Prisma

export const getAllMockTestsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.searchQuery as string || null;
        const userId = req.user?.userId as string;

        if (!req.user) {
            throw new AppError({ statusCode: 404, message: "User not found", data: [] });
        }

        if (req.user?.role !== 'staff') {
            throw new AppError({ statusCode: 403, message: "Invalid role", data: [] });
        }

        // 1. Get batch ID using mentor_id (logged-in user's ID)
        const batch = await prisma.batchDetail.findFirst({
            where: {
                mentor_id: userId,
            },
            select: {
                id: true,
            },
        });

        if (!batch) {
            throw new AppError({ statusCode: 404, message: "Batch not found for this mentor", data: [] });
        }

        const batchId = batch.id;

        // 2. Call service with batchId
        const { enhancedTests, perPage, currentPage, totalPages, totalTests } = await getAllMockTestsService({
            batchId,
            search,
            page,
            limit,
        });

        // 3. Respond
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
        next(error);
    }
};
