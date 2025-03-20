import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { createSupportTicket } from "../../services/counsellor/supportTicket.service";
import { AppError } from "../../utils/errorHandler";
import { z } from "zod";
import { UserRole } from "../../types/common.type";

const raiseSupportTicketSchema = z.object({
  query: z.string().min(5, "Query must be at least 5 characters long"),
});

export const raiseSupportTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body
    const validatedData = raiseSupportTicketSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const userId = req.user?.userId as string;

    const role = req.user?.role as UserRole;

    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: "Query is required", // Set message from Zod error
      });
    }

    const ticket = await createSupportTicket({
      userId: userId,
      role: role,
      query: query,
    });

    res.status(201).json({
      status: true,
      data: ticket,
      message: "Support ticket created successfully",
    });

    return;
  } catch (error: unknown) {
    console.error("Error creating support ticket:", error);
    next(error);
  }
};
