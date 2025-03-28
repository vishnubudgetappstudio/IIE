import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { managementStaffIdSchema } from "../../../zodSchema/counsellor.schema";
import { AppError } from "../../../utils/errorHandler";
import { getNotificationHistoryService } from "../../../services/counsellorModule/notification.service";

export const getNotificationHistoryController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const userId = req.user?.userId; // Logged-in user ID

        // Validate ManagementStaffId - Request Body (based on schema)
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