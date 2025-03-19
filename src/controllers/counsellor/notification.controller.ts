import { Request, Response, NextFunction } from "express";
import { createNotificationService, getNotificationHistoryService } from "../../services/counsellor/notification.service";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";

// Define a validation schema for batchId
const managementStaffIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

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

        const { title, message, image, type, category, date, time, batch_ids, student_ids } = req.body;

        if (!title || !message || !type) {
            throw new AppError({ statusCode: 400, message: "Missing required fields" });
        }

        const notification = await createNotificationService({
            senderId: userId,
            title,
            message,
            image,
            type,
            category,
            date,
            time,
            batchIds: batch_ids,
            studentIds: student_ids,
        });

        console.log({ notification })
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

export const getNotificationHistoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId; // Logged-in user ID

        // Validate ManagementStaffId
        const validatedManagementStaffId = managementStaffIdSchema.safeParse(userId);

        if (!validatedManagementStaffId?.success) {
            const firstErrorMessage = validatedManagementStaffId.error.errors[0].message; // Get first error message

            throw new AppError({
                statusCode: 400,
                data: [], // Always send an empty array
                message: firstErrorMessage, // Set message from Zod error
            });
        }

        // Fetch the Notification History List
        const { historyList } = await getNotificationHistoryService({ senderId: userId }).catch(err => {
            console.error("Error fetching notification history:", err);
            throw new AppError({
                statusCode: 400,
                data: [], // Always send an empty array
                message: "Error fetching notification history",
            });
        });
        if (!historyList.length) {
            throw new AppError({
                statusCode: 404,
                data: [], // Always send an empty object
                message: "No History ",
            });
        }

        res.status(200).json({
            status: true,
            data: historyList,
            message: "Notification history fetched successfully",
        });
        return;

    } catch (error) {
        next(error);
    }
}
