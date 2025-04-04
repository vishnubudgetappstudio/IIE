import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { BatchSlotsType } from "@prisma/client";
import { getAllBatchesListService } from "../../../services/counsellorModule/batch_related/get_all_batches_list.service";

export const getAllBatchesListController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const slot = req.query.slot as BatchSlotsType || 'all';
        const search = req.query.searchQuery as string || null;

        // Fetch batches from service
        const { batches, total } = await getAllBatchesListService({
            page,
            limit,
            slot,
            search,
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