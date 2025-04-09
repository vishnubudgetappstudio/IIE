import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { UserRole } from "../../types/common.type";
import { AppError } from "../../utils/errorHandler";
import { getProfileDetailsService } from "../../services/profile/get_profile_details.service";

export const getProfileDetailsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId as string; // Logged-in user ID
        const role = req.user?.role as UserRole;

        if (!userId || !role) {
            return next(
                new AppError({
                    statusCode: 401,
                    data: {},
                    message: "Unauthorized: Invalid user credentials.",
                })
            );
        }

        const profile = await getProfileDetailsService({
            userId,
            role
        });

        res.status(200).json({
            status: true,
            data: profile,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile fetched successfully.`,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        next(error);
    }
};