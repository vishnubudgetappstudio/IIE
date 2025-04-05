import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { AppError } from "../../../../utils/errorHandler";
import { prisma } from "../../../../config/database";

export const createCourseTestController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new AppError({
            statusCode: 401,
            message: 'Unauthorized access',
            data: []
        })

        if (req.user?.role !== 'staff') throw new AppError({
            statusCode: 400,
            message: 'Invalid Role, Please check your token',
            data: []
        });

        const existStaff = await prisma.managementStaff.findUnique({
            where: {
                id: req.user?.userId as string,
                deletedAt: null
            }
        });

        if (!existStaff) throw new AppError({
            statusCode: 400,
            message: 'Invalid Staff',
            data: []
        });

        



    } catch (error) {
        console.error("Error in createCourseTestController:", error);
        next(error);
    }
}