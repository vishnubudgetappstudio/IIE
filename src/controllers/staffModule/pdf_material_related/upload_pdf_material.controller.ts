import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import * as path from "path";
import { validateFile } from "../../../utils/s3";
import { uploadPDFMaterialFileService } from "../../../services/staffModule/pdf_material_related/upload_pdf_material.service";
import { uploadBufferToS3, uploadFileToS3 } from "../../../services/s3/uploadFiles.service";
import { pdfMaterialFileUploadSchema } from "../../../zodSchema/staff.schema";
import { prisma } from "../../../config/database";
import admin from '../../../config/firebase';

export const uploadPDFMaterialFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // ✅ Step 1: Check Auth
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // ✅ Step 2: Validate File
        const file = req.files ? (req.files as Express.Multer.File[])[0] : null;
        if (!file) {
            throw new AppError({ statusCode: 400, message: "File is required", data: {} });
        }

        // ✅ Step 3: Validate Body
        const parsedData = pdfMaterialFileUploadSchema.safeParse(req.body);
        if (!parsedData.success) {
            throw new AppError({
                statusCode: 400,
                message: parsedData.error.errors[0].message,
                data: {}
            });
        }

        const { material_title, batch_id, student_ids } = parsedData.data;

        // ✅ Step 4: Validate PDF
        if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
            throw new AppError({ statusCode: 400, message: "Invalid file type. Only .pdf files are allowed.", data: {} });
        }

        validateFile(file);

        // ✅ Step 5: Upload Service
        const { batchId, material_file_url, material_title: materialTitle, studentIds } =
            await uploadPDFMaterialFileService({
                material_file: file,
                material_title,
                batchId: batch_id,
                studentIds: student_ids.length ? student_ids as string[] : [],
                role: req.user.role,
                userId: req.user.userId
            });

        // ✅ Step 6: Send Notification to Students
        try {
            const fcmTokens = await prisma.student.findMany({
                where: { id: { in: studentIds } },
                select: { fcm_token: true, id: true }
            });

            const validTokens = fcmTokens
                .filter(student => student.fcm_token)
                .map(student => ({
                    token: student.fcm_token!,
                    studentId: student.id
                }));

            const sendPromises = validTokens.map(async ({ token, studentId }) => {
                const message = {
                    notification: {
                        title: "New Material Uploaded",
                        body: `${materialTitle} has been uploaded.`,
                    },
                    token,
                };

                await admin.messaging().send(message);

                // Optional: Save notification
                await prisma.notificationRecipient.create({
                    data: {
                        notificationId: 'PDF_' + Date.now().toString(), // Use UUID or timestamp
                        title: message.notification.title,
                        description: message.notification.body,
                        receiverRole: 'student',
                        type: 'material_uploaded',
                        isRead: false,
                        status: 'Sent',
                        studentId: studentId,
                    },
                });
            });

            await Promise.all(sendPromises);

        } catch (notificationErr) {
            console.error("❌ Error sending notification to students:", notificationErr);
        }

        // ✅ Step 7: Response
        res.status(201).json({
            status: true,
            data: {
                batch_id: batchId,
                material_title: materialTitle,
                material_file_url,
                student_ids: studentIds,
            },
            message: batch_id
                ? "PDF Material uploaded and assigned to selected students successfully"
                : "PDF Material uploaded successfully but Access Status is 'Draft'",
        });

    } catch (error) {
        console.error("❌ Error in uploadPDFMaterialFileController:", error);
        next(error);
    }
};
