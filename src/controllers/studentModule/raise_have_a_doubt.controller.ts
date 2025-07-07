// Use ES module import
import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from "express";
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from "../../utils/errorHandler";
import { SessionSheetStatus } from '@prisma/client';
import admin from '../../config/firebase';

const prisma = new PrismaClient();

export const raiseHaveADoubt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const studentId = req.user?.userId as string;
    const studnetName = req.user?.name as string;
    const sessionId = req.body.session_id as string;
    const sessionIndexId = req.body.session_index_id as string;
    // Import the enum from Prisma client
    console.log("studentId", studentId, "sessionId", sessionId);

    const newStatus: SessionSheetStatus = req.body.status === "Have doubt" ? SessionSheetStatus.HaveDoubt : SessionSheetStatus.Completed;

    const batchId = await prisma.batchWithStudent.findFirst({
      where: { student_id: studentId },
      select: { batch_id: true },
    });

    const mentorId = await prisma.batchDetail.findFirst({
      where: { id: batchId?.batch_id },
      select: { mentor_id: true },
    });

    const mentor = await prisma.managementStaff.findFirst({
      where: { id: mentorId?.mentor_id },
      select: { fcm_token: true },
    });

    const fcmToken = mentor?.fcm_token;

      const message = {
          notification: {
              title: 'Session Update',
              body: `A ${studnetName} has update the session status to ${newStatus}.`,
          },
          token: fcmToken as string,
      };

      await prisma.notificationRecipient.create({
        data: {
          title: message.notification.title,
          description: message.notification.body,
          receiverRole: 'staff',
          type: 'message',
          isRead: false,
          status: 'Sent',
          managementStaffId: mentorId?.mentor_id,
        },
      });
  
      if (!mentor || !mentor.fcm_token) {
          throw new AppError({
              statusCode: 404,
              message: "Mentor FCM token not found",
              data: {},
          });
      }

  
      // 4. Send push notification to the mentor
      

      try {
        await admin.messaging().send({
          notification: message.notification,
          token: mentor.fcm_token,
        });
      } catch (err) {
        console.error('FCM push failed:', err);
      }

    const result = await prisma.sessionSheetStudentReportDetail.updateMany({
      where: { student_id: studentId, session_sheet_id: sessionId, session_index_id: sessionIndexId },
      data: { status: newStatus },
    });
    console.log("result", result.count);

    if(newStatus === SessionSheetStatus.Completed) {

      const deleteNotificatioin = await prisma.notificationRecipient.deleteMany({
        where: {
          studentId: studentId,
          session_id: sessionId,
          session_index_id: sessionIndexId,
          type: "session_completed",
        },
      });
    }

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
