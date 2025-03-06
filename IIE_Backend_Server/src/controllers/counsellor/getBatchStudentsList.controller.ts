import { Request, Response } from "express";
import { z } from "zod";
import { getBatchStudents } from "../../services/counsellor/getBatchStudents.service";

// Define a validation schema for batchId
const batchIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

export const getBatchStudentsController = async (
  req: Request,
  res: Response
) => {
  try {
    // Extract query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate batchId
    const { batchId } = req.params;
    const validatedBatchId = batchIdSchema.parse(batchId);

    // Fetch batch and students
    const { students, currentPage, totalPages, totalStudents } = await getBatchStudents(validatedBatchId, page, limit);

    // If no students is found, return 404
    if (!students.length) {
      res.status(404).json({ status: false, message: "students not found" });
      return;
    }

    // Return the batch details with student list
    res.status(200).json({
      status: true,
      data: students,
      currentPage,
      totalPages,
      totalStudents,
      message: "Students fetched successfully",
    });
    return;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: false,
        message: "Invalid batch ID",
        errors: error.errors,
      });
      return;
    }

    console.error("Error fetching batch students:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
    return;
  }
};
