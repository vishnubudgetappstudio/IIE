import { NextFunction, Request, Response } from "express";
import { getStaff_Student_BatchService } from "../../services/counsellor/getStaff_Student_Batch.service";
import { AppError } from "../../utils/errorHandler";

export const getStaff_Student_BatchController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query; // Extract search param

    if (!search) {
      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: "Search parameter is required",
      });
    }

    // Call service function to fetch data
    const data = await getStaff_Student_BatchService(search as string);

    res.status(200).json({
      status: true,
      data,
      message: `${search} details fetched successfully`,
    });
    return;
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
    return;
  }
};
