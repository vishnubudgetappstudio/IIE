import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const approveStudentLeaveController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { leaveDetailId, status } = req.body;

    if (!leaveDetailId || !status) {
      res.status(400).json({ message: "leaveDetailId and status are required." });
      return;
    }

    const allowedStatuses = ["approved", "rejected", "pending"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      res.status(400).json({ message: "Invalid status value." });
      return;
    }

    const statusUpdate = await prisma.leaveDetail.update({
      where: { id: leaveDetailId },
      data: { status },
    });

    res.status(200).json({
      message: "Leave status updated successfully.",
      data: statusUpdate,
    });
  } catch (error: any) {
    console.error('Error updating leave status:', error);

    if (error.code === "P2025") {
      res.status(404).json({ message: "Leave request not found." });
      return;
    }

    next(error); // Let the global error handler deal with it
  }
};
