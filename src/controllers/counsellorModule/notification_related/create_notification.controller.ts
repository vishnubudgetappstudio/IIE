import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { managementStaffIdSchema } from "../../../zodSchema/counsellor.schema";
import { AppError } from "../../../utils/errorHandler";
import { createNotificationService } from "../../../services/counsellorModule/notification_related/create_notification.service";

export const createNotificationController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId; // Logged-in user ID

        // Validate ManagementStaffId
        const validatedManagementStaffId = managementStaffIdSchema.safeParse(userId);

        if (!validatedManagementStaffId?.success) {
            const firstErrorMessage = validatedManagementStaffId.error.errors[0].message; // Get first error message

            throw new AppError({
                statusCode: 400,
                data: {}, // Always send an empty object
                message: firstErrorMessage, // Set message from Zod error
            });
        }

        // const { title, message, image, type, category, batch_ids, student_ids } = req.body;
        const { title, message, file, type, category, date, time, batch_ids, student_ids } = req.body;

        if (!title || !message || !type) {
            throw new AppError({ statusCode: 400, message: "Missing required fields" });
        }

        const notification = await createNotificationService({
            senderId: userId,
            title,
            message,
            file,
            type,
            category,
            batchIds: batch_ids,
            studentIds: student_ids,
            date: date,
            time: time
        });

        res.status(201).json({
            status: true,
            data: notification,
            message: "Notification sent successfully"
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        next(error);
    }
};