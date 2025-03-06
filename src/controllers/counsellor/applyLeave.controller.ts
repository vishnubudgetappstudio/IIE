import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { applyLeave } from "../../services/counsellor/applyLeave.service";

export const requestLeave = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    // Extract request body
    const { leave_type, from_date, to_date, reason } = req.body;

    // Validate required fields
    if (!leave_type || !from_date || !to_date || !reason) {
      res
        .status(400)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    // Ensure from_date is before to_date
    if (new Date(from_date) > new Date(to_date)) {
      res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
      return;
    }

    // Apply leave
    const leave = await applyLeave(
      req.user.userId,
      leave_type,
      new Date(from_date),
      new Date(to_date),
      reason
    );

    res.status(201).json({
      success: true,
      data: leave,
      message: "Leave request submitted successfully",
    });
    return;
  } catch (error) {
    console.error("Error applying leave:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
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
