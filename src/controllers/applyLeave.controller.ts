import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/errorHandler";
import { applyLeaveService } from "../services/applyLeave.service";
import { leaveRequestSchema } from "../zodSchema/common.schema";
import { UserRole } from "../types/common.type";

export const requestLeaveController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId as string; // Logged-in user ID
    const role = req.user?.role as UserRole;

    console.log({ userId, role });

    if (!userId || !role) {
      return next(
        new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid user credentials.",
        })
      );
    }
    // Validate Request Body (based on schema)
    const validatedData = leaveRequestSchema.safeParse(req.body);

    if (!validatedData.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message
      throw new AppError({
        statusCode: 400,
        data: {}, // Send empty object as per your structure
        message: firstErrorMessage,
      });
    }

    // Extract request body
    const { leave_type, leave_mode, from_date, to_date, reason } = req.body;

    // Ensure from_date is before to_date
    if (new Date(from_date) > new Date(to_date)) {
      throw new AppError({ statusCode: 400, data: {}, message: "Start date must be before End date" });
    }

    // Apply leave
    const leave = await applyLeaveService({
      userId: userId,
      role: role,
      leave_type: leave_type,
      leave_mode: role !== 'student' ? leave_mode : 'Full_Day',
      from_date: from_date,
      to_date: to_date,
      reason: reason,

    });

    res.status(201).json({
      status: true,
      data: leave,
      message: "Leave request submitted successfully",
    });
    return;
  } catch (error) {
    console.error("Error applying leave:", error);
    next(error);
  }
};
