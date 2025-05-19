import { NextFunction, Response } from "express"; // ✅ Add missing Response import
import { AuthRequest } from "../../middlewares/auth.middleware";
import { JwtPayload } from "jsonwebtoken";
import { studentIdSchema } from "../../zodSchema/student.schema";
import { AppError } from "../../utils/errorHandler";
import { roleSchema } from "../../zodSchema/common.schema";
import { staff_notificationListService } from "../../services/staffModule/getStaffNotificationlistService";

export const staff_NotificationList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, role } = req.user as JwtPayload;

        // Extract query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Validate StudentId - Request query params (based on schema)
        // const validatedStudentId = studentIdSchema.safeParse(userId);
        // if (!validatedStudentId.success) {
        //     return next(new AppError({
        //         statusCode: 400,
        //         data: [],
        //         message: validatedStudentId.error.errors[0].message, // First Zod error message
        //     }));
        // }

        // Validate Role - Request query params (based on schema)
        const validatedRole = roleSchema.safeParse(role);
        if (!validatedRole.success) {
            return next(new AppError({
                statusCode: 400,
                data: [],
                message: validatedRole.error.errors[0].message, // First Zod error message
            }));
        }

        // Fetch notifications
        const notifications = await staff_notificationListService({
            staff_id: userId,
            role: role,
            page: page,
            pageSize: limit,
        });

        // Send response
        res.status(200).json({
            status: "success",
            data: notifications,
            message: "Staff Notifications fetched successfully",
        });

    } catch (error) {
        next(error);
    }
};
