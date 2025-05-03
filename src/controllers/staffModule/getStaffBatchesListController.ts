import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { BatchSlotsType } from "@prisma/client";
import { getStaffBatchesListService } from "../../services/staffModule/getStaffBatchesList.service";

export const getStaffBatchesListController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract query params
        const userId = (req.user as { userId: string }).userId;
        console.log("req.user ===>", userId);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const slot = req.query.slot as BatchSlotsType || 'all';
        const search = req.query.searchQuery as string || null;
        // const mentorId = req.query.mentorId as string || null;
        const mentorId = (req.query.mentorId as string)?.trim() || null;
        console.log("mentorId ===>", mentorId); 

        // Fetch batches from service
        const { batches, total } = await getStaffBatchesListService({
            page,
            limit,
            slot,
            search,
            userId,
        });

        res.status(200).json({
            status: true,
            data: batches,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            message: "Batch list get Successfully",
        });

        return;
    } catch (error) {
        console.error("Error fetching data:", error);
        next(error);
    }
};