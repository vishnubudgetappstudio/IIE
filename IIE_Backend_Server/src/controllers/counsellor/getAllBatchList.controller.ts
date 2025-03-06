import { Request, Response } from "express";
import { getAllBatches } from "../../services/counsellor/getAllBatchs.service";

export const getAllBatchesListController = async (
  req: Request,
  res: Response
) => {
  try {
    // Extract query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Fetch batches from service
    const { batches, total } = await getAllBatches(page, limit);

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
    res.status(400).json({
      status: false,
      data: [],
      // message: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
