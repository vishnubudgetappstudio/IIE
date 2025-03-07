import { NextFunction, Request, Response } from "express";
import { addStudentToBatch } from "../../services/counsellor/addStudentInBatch.service";
import { z } from "zod";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware";

const addStudentToBatchSchema = z.object({
  batch_id: z.string().uuid("Invalid Batch ID format"),
  student_id: z.string().uuid("Invalid Student ID format"),
});

export const addStudentToBatchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body
    const validatedData = addStudentToBatchSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }
    const { batch_id, student_id } = req.body;

    const response = await addStudentToBatch(batch_id, student_id);

    res.status(201).json({ status: true, ...response });
  } catch (error: any) {
    console.error("Error Add Student In Batch:", error);
    next(error);
  }
};
