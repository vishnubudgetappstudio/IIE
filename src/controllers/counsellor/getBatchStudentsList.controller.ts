import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { getBatchStudents } from "../../services/counsellor/getBatchStudents.service";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware";

// Define a validation schema for batchId
const batchIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

export const getBatchStudentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract query params
    const page = parseInt(req.query.page as string) ?? 1;
    const limit = parseInt(req.query.limit as string) ?? 10;
    const searchQuery = (req.query.search as string) ?? undefined; // Extract search query
    const batchId = (req.query.batch_id as string);

    if (page < 1 || limit < 1) {
      throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: {} });
    }

    // Validate batchId
    const validatedBatchId = batchIdSchema.safeParse(batchId);

    if (!validatedBatchId?.success) {
      const firstErrorMessage = validatedBatchId.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    // Fetch batch and students with optional search
    const { students, currentPage, totalPages, perPage, totalStudents } = await getBatchStudents(
      batchId,
      page,
      limit,
      searchQuery
    );

    // If no students are found, return 404
    if (!students.length) {
      throw new AppError({ statusCode: 404, message: "Students not found", data: {} });
    }

    // Return the batch details with student list
    res.status(200).json({
      status: true,
      data: students,
      page: currentPage,
      limit: perPage,
      totalPages,
      totalStudents,
      message: "Students fetched successfully",
    });
    return;
  } catch (error: any) {
    console.error("Error fetching batch students:", error);
    next(error);
  }
};
