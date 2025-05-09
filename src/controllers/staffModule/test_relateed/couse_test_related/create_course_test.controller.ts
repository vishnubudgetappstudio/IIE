import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { AppError } from "../../../../utils/errorHandler";
import { createCourseTestSchema } from "../../../../zodSchema/staff.schema";
import { createCourseTestService } from "../../../../services/staffModule/test_related/course_test_related/create_course_test.service";
import { validateFile } from "../../../../utils/s3";
import admin from '../../../../config/firebase';
import { getFCMTokensByBatchId } from '../../../../services/notification.service'; // implement this service

export const createCourseTestController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // Validate that a single file is uploaded
        // ✅ Retrieve file (If single file upload)
        const testCSVFile = req.files ? (req.files as Express.Multer.File[])[0] : null;

        // Validate file type (must be .csv)
        if (testCSVFile && !testCSVFile.mimetype.includes("csv")) {
            throw new AppError({ statusCode: 400, message: "Only CSV files are allowed", data: {} });
        }

        if (testCSVFile) validateFile(testCSVFile);

        // Parse JSON string fields from form-data
        if (typeof req.body.questions === "string") {
            try {
                req.body.questions = JSON.parse(req.body.questions);
            } catch (err) {
                throw new AppError({
                    statusCode: 400,
                    message: "Invalid JSON format in questions",
                    data: {},
                });
            }
        }

        // Validate request body
        const validation = createCourseTestSchema.safeParse(req.body);

        if (!validation.success) {
            const firstError = validation.error.errors[0].message;
            throw new AppError({
                statusCode: 400,
                message: firstError,
                data: {},
            });
        }

        const {
            batch_id,
            test_title,
            test_description,
            start_date,
            end_date,
            timer,
            questions,
        } = validation.data;

        const response = await createCourseTestService({
            userId: req.user?.userId as string,
            batchId: batch_id,
            test_title,
            test_description,
            test_csv_file: testCSVFile,
            startDate: start_date,
            endDate: end_date,
            timer,
            questions,
        });

        try {
            const fcmTokens = await getFCMTokensByBatchId(batch_id); // You must implement this logic
        
            const sendPromises = fcmTokens.map(token => {
                const message = {
                    notification: {
                        title: 'New Course Test Available',
                        body: `A new test "${test_title}" has been scheduled.`,
                    },
                    token,
                };
                return admin.messaging().send(message).catch(err => {
                    console.error(`Failed to send to token ${token}:`, err);
                });
            });
            
            await Promise.all(sendPromises);
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
        }

        res.status(201).json({
            status: true,
            data: response,
            message: "Course test created successfully",
        });
    } catch (error) {
        console.error("Error creating course test:", error);
        next(error);
    }
};
