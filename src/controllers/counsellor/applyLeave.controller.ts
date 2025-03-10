import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { applyLeave } from "../../services/counsellor/applyLeave.service";
import { AppError } from "../../utils/errorHandler";
import { z } from "zod";


export const leaveRequestSchema = z.object({
  leave_type: z.enum(["Sick", "Casual", "Earned", "Unpaid", "Other"], {
    message: "Invalid leave type. Allowed values: Sick, Casual, Earned, Unpaid, Other",
  }),
  leave_mode: z.enum(["Full_Day", "Half_Day"], { message: "Invalid leave mode. Allowed values: Full_Day, Half_Day", }),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  reason: z.string().min(1, "Reason is required"),
});

export const requestLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      throw new AppError({ statusCode: 401, data: {}, message: "Unauthorized access" });
    }

    // Validate Request Body
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
    const leave = await applyLeave(
      req.user.userId,
      leave_type,
      leave_mode,
      new Date(from_date),
      new Date(to_date),
      reason
    );

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

// export const fetchLeaves = async (req: AuthRequest, res: Response) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized access" });
//     }

//     const leaves = await getLeaveRequests(req.user.id);
//     return res.status(200).json({ leaves });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching leave requests", error });
//   }
// };

// export const modifyLeaveStatus = async (req: Request, res: Response) => {
//   try {
//     const { leaveId, status } = req.body;

//     const updatedLeave = await updateLeaveStatus(leaveId, status);
//     return res
//       .status(200)
//       .json({ message: "Leave status updated", updatedLeave });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Error updating leave status", error });
//   }
// };
