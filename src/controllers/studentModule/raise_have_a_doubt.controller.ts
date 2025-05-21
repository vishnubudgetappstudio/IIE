// Use ES module import
import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from "express";
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from "../../utils/errorHandler";
import { SessionSheetStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const raiseHaveADoubt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const studentId = req.user?.userId as string;
    const sessionId = req.body.session_id as string;
    // Import the enum from Prisma client

    const newStatus: SessionSheetStatus = req.body.status === "Have doubt" ? SessionSheetStatus.HaveDoubt : SessionSheetStatus.Completed;

    const result = await prisma.sessionSheetStudentReportDetail.updateMany({
      where: { student_id: studentId, id: sessionId },
      data: { status: newStatus },
    });

    const deleteNotificatioin = await prisma.notificationRecipient.deleteMany({
      where: {
        studentId: studentId,
        session_id: sessionId,
        type: "session_completed",
      },
    });

    if (result.count === 0) {
      res.status(404).json({ message: 'No rows updated for this student ID.' });
    }

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Prisma update error:', error);
    next(error);
    // return res.status(500).json({ error: 'Internal server error.' });
  }
};
