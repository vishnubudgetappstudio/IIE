import { Request, Response, NextFunction } from "express";
import { createNotificationService } from "../../services/counsellor/notification.service";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const createNotificationController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId; // Logged-in user ID

        const { title, message, image, type, category, date, time, batch_ids, student_ids } = req.body;

        if (!title || !message || !type) {
            throw new AppError({ statusCode: 400, message: "Missing required fields" });
        }

        const notification = await createNotificationService({
            senderId: userId!,
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

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};
