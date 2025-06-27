import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { PrismaClient } from '@prisma/client';
import { AppError } from "../../utils/errorHandler"; // Adjust the path if AppError is located elsewhere

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
      data: {
        status,
        notificationRecipients: {
          updateMany: {
            where: { leaveDetailId: leaveDetailId },
            data: {
              isRead: true,
            },
          },
        },
      },
    });

    if (!statusUpdate.student_id) {
      res.status(400).json({ message: "Student ID is missing in leave detail." });
      return;
    }
    const student = await prisma.student.findUnique({
      where: { id: statusUpdate.student_id },
      select: { fcm_token: true, name: true },
    });

    const fcmToken = student?.fcm_token;
    
          const message = {
              notification: {
                  title: 'Leave Request Update',
                  body: `Your leave request ${status}.`,
              },
              token: fcmToken as string,
          };
    
          await prisma.notificationRecipient.create({
            data: {
              title: message.notification.title,
              description: message.notification.body,
              receiverRole: 'student',
              type: 'message',
              isRead: false,
              status: 'Sent',
              studentId: statusUpdate.student_id,
            },
          });
      
          if (!student || !student.fcm_token) {
              throw new AppError({
                  statusCode: 404,
                  message: "Student FCM token not found",
                  data: {},
              });
          }


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
