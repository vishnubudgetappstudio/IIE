// Use ES module import
import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from "express";
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from "../../utils/errorHandler";

const prisma = new PrismaClient();

export const raiseHaveADoubt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const studentId = req.user?.userId as string;
    const newStatus = req.body.status;

    const result = await prisma.sessionSheetStudentReportDetail.updateMany({
      where: { student_id: studentId },
      data: { status: newStatus },
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
