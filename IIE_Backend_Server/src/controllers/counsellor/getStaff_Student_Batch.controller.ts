import { Request, Response } from "express";
import { getStaff_Student_BatchService } from "../../services/counsellor/getStaff_Student_Batch.service";

export const getStaff_Student_BatchController = async (
  req: Request,
  res: Response
) => {
  try {
    const { search } = req.query; // Extract search param

    if (!search) {
      res.status(400).json({
        status: false,
        message: "Search parameter is required",
      });

      return;
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
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
