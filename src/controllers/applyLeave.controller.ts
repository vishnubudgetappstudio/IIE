import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/errorHandler";
import { applyLeaveService } from "../services/applyLeave.service";
import { leaveRequestSchema } from "../zodSchema/common.schema";
import { UserRole } from "../types/common.type";
import { getFCMTokensByBatchId } from '../services/notification.service';
// import * as admin from 'firebase-admin';
import { prisma } from "../config/database";
import admin from '../config/firebase';

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

    try {
      // 1. Find the student's batch
      const studentBatch = await prisma.batchWithStudent.findFirst({
          where: { student_id: userId },
          select: { batch_id: true },
      });
  
      if (!studentBatch) {
          console.warn("No batch found for student");
          throw new AppError({
              statusCode: 404,
              message: "No batch found for student",
              data: {},
          });
      }
  
      const batchId = studentBatch.batch_id;
  
      // 2. Get the mentor ID from batch_detail
      const batchDetail = await prisma.batchDetail.findFirst({
          where: { id: batchId },
          select: { mentor_id: true },
      });
  
      if (!batchDetail || !batchDetail.mentor_id) {
          throw new AppError({
              statusCode: 404,
              message: "Mentor not found for the batch",
              data: {},
          });
      }
  
      const mentorId = batchDetail.mentor_id;
  
      // 3. Get mentor's FCM token from management_staff
      const mentor = await prisma.managementStaff.findFirst({
          where: { id: mentorId },
          select: { fcm_token: true },
      });

      const fcmToken = mentor?.fcm_token;

      const message = {
          notification: {
              title: 'Leave Request Submitted',
              body: `A student has submitted a leave request.`,
          },
          token: fcmToken as string,
      };

      const notiId = await prisma.notification.findFirst({
        select: { id: true },
      });

      await prisma.notificationRecipient.create({
        data: {
          title: message.notification.title,
          description: message.notification.body,
          receiverRole: 'staff',
          type: 'leave',
          isRead: false,
          status: 'Sent',
          leaveDetailId: leave.id,
          managementStaffId: mentorId,
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
      

      await admin.messaging().send({
        notification: message.notification,
        token: mentor.fcm_token,
      });
  
      // Optional: Save the notification in DB if needed
  
  } catch (notificationError) {
      console.error('Error sending notification to mentor:', notificationError);
  }

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
