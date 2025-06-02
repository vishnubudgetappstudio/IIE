import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../../../config/database";
import { extractS3BucketAndKeySize } from "../../../utils/s3";
import s3 from "../../../config/s3Config";
import { AppError } from "../../../utils/errorHandler";
import { formatDateTime, parseSessionSheet_CSV_Stream } from "../../../utils/commonUtils";
import { Readable } from "stream";
import { stringify } from "csv-stringify/sync"; // for converting JSON to CSV
import admin from "firebase-admin"; // Make sure firebase-admin is initialized properly somewhere
import { SessionSheetStatus } from '@prisma/client';

export const getSessionSheetDataService = async ({
    batch_id,
    search,
    noParam,
    statusParam,
    page,
    limit,
}: {
    batch_id: string;
    search?: string;
    noParam: string;
    statusParam: string;
    page: number;
    limit: number;
}): Promise<{
    session_sheet_id: string;
    session_file_name: string;
    session_file_size: string;
    session_sheet_data: any[];
    createdAt: string;
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}> => {

    // 1. Fetch session sheet info from DB
    const sessionSheet = await prisma.sessionSheetDetail.findFirst({
        where: { batch_id, deletedAt: null },
        select: {
            id: true,
            session_file_name: true,
            session_file_url: true,
            createdAt: true,
        },
    });

    if (!sessionSheet?.session_file_url) {
        throw new AppError({ statusCode: 404, message: "Session sheet not found for the given batch.", data: {} });
    }

    // 2. Get S3 bucket, key, size
    const { Bucket, Key, FileSize } = await extractS3BucketAndKeySize({
        fileUrl: sessionSheet.session_file_url,
    });

    // 3. Get the CSV file from S3
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await s3.send(command);

    if (!response.Body) {
        throw new AppError({ statusCode: 400, message: "Failed to retrieve file from S3.", data: {} });
    }

    // 4. Parse the CSV file
    const allData = await parseSessionSheet_CSV_Stream(response.Body as Readable).catch((error) => {
        console.error("❌ Error parsing CSV from S3:", error);
        throw new AppError({ statusCode: 400, message: "Failed to parse CSV file from S3.", data: error });
    });

    // 5. Update status if applicable
    if (noParam && statusParam) {
        let isUpdated = false;

        allData.forEach((row) => {
            if (row["No."] === noParam) {
                row.Status = statusParam;
                isUpdated = true;
            }
        });

        if (isUpdated) {
            // Convert updated JSON to CSV string
            const updatedCsv = stringify(allData, { header: true });

            // Upload updated file back to S3
            await s3.send(
                new PutObjectCommand({
                    Bucket,
                    Key,
                    Body: updatedCsv,
                    ContentType: "text/csv",
                })
            );

            // --- SEND NOTIFICATIONS TO ALL STUDENTS IN BATCH ---

            // Get student IDs from batchWithStudent table
            const batchStudents = await prisma.batchWithStudent.findMany({
                where: { batch_id },
                select: { student_id: true },
            });

            const studentIds = batchStudents.map((s) => s.student_id);

            // Fetch students with fcm_token
            const students = await prisma.student.findMany({
                where: {
                    id: { in: studentIds },
                    fcm_token: { not: null },
                },
                select: { id: true, fcm_token: true },
            });

            const messageTitle = "Session Status Updated";
            const messageBody = `Status has been updated for No. ${noParam} to ${statusParam}`;

            // Send notifications concurrently
            const notifyPromises = students.map(async ({ id, fcm_token }) => {
                try {
                    // Store notification record in DB
                    await prisma.notificationRecipient.create({
                        data: {
                            // notificationId: 'SESSION_' + Date.now().toString() + '_' + id,
                            title: messageTitle,
                            description: messageBody,
                            receiverRole: 'student',
                            type: 'session_completed',
                            isRead: false,
                            status: 'Sent',
                            studentId: id,
                            session_id: sessionSheet.id,
                        },
                    });

                    await prisma.sessionSheetStudentReportDetail.create({
                        data: {
                            batch_id: batch_id,
                            student_id: id,
                            session_sheet_id: sessionSheet.id,
                            status: SessionSheetStatus.NotMarked,
                        },
                    });
                    if (fcm_token) {
                        // Send FCM push notification
                        await admin.messaging().send({
                            token: fcm_token,
                            notification: {
                                title: messageTitle,
                                body: messageBody,
                            },
                            data: {
                                role: 'student',
                                type: 'session_completed',
                                session_sheet_id: sessionSheet.id,
                                session_file_name: sessionSheet.session_file_name,
                            },
                        });
                    }
                } catch (err) {
                    console.error(`❌ Notification failed for student ${id}:`, err);
                }
            });

            await Promise.all(notifyPromises);
        }
    }

    // 6. Filter by search keyword in "Topics"
    const filteredData = search
        ? allData.filter((row) =>
            row.Topics?.toLowerCase().includes(search.toLowerCase())
        )
        : allData;

    // 7. Paginate
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

    return {
        session_sheet_id: sessionSheet.id,
        session_file_name: sessionSheet.session_file_name,
        session_file_size: FileSize,
        createdAt: formatDateTime(sessionSheet.createdAt),
        session_sheet_data: paginatedData,
        totalRecords,
        totalPages,
        currentPage: page,
    };
};
