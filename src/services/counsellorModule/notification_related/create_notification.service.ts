import { NotificationCategory, NotificationType } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { convertTimeToDateFormat, convertToEpoch, formatDateOnly, formatTimeOnly, parseDDMMYYYYToDate } from "../../../utils/commonUtils";

interface CreateNotificationData {
    senderId: string;
    title: string;
    message: string;
    image?: string;
    type: NotificationType;
    category?: NotificationCategory | "";
    date: string;
    time: string;
    batchIds?: string; // Comma-separated batch IDs
    studentIds?: string; // Comma-separated student IDs
}

export const createNotificationService = async (data: CreateNotificationData) => {
    let recipients: any[] = [];

    // Convert comma-separated strings into arrays
    const batchIdsArray = data.batchIds ? data.batchIds.split(",").map(id => id.trim()).filter(id => id) : [];
    const studentIdsArray = data.studentIds ? data.studentIds.split(",").map(id => id.trim()).filter(id => id) : [];

    if (data.category === "all") {
        // Fetch all students and staff
        const students = await prisma.student.findMany({ where: { deletedAt: null }, select: { id: true } });
        const staff = await prisma.managementStaff.findMany({ where: { role: "staff" }, select: { id: true } });

        recipients = [
            ...students.map((s) => ({ studentId: s.id, receiverRole: "student" })),
            ...staff.map((s) => ({ managementStaffId: s.id, receiverRole: "staff" })),
        ];
    } else if (data.category === "staffs") {
        // Fetch only staff members
        const staff = await prisma.managementStaff.findMany({ where: { role: "staff" }, select: { id: true } });
        recipients = staff.map((s) => ({ managementStaffId: s.id, receiverRole: "staff" }));
    } else if (data.category === "students") {
        // Add individual students if provided
        const students = await prisma.student.findMany({
            where: { deletedAt: null },
            select: { id: true }
        })
        recipients = students.map((s) => ({ studentId: s.id, receiverRole: "student" }));
    } else if (data.category === "" && (data.studentIds || data.batchIds)) {
        if (data.studentIds) {
            recipients.push(...studentIdsArray.map((id) => ({ studentId: id, receiverRole: "student" })));

        }
        if (batchIdsArray.length) {
            // Fetch students based on batchIds (Using Relation)
            const batchWithStudents = await prisma.batchWithStudent.findMany({
                where: {
                    batch_id: { in: batchIdsArray }, // Using Prisma relation
                    deletedAt: null, // Exclude soft deleted records
                },
                select: {
                    student_id: true,
                    batch_id: true
                }
            });

            if (!batchWithStudents.length) {
                throw new AppError({ statusCode: 404, data: {}, message: "No students found in the provided batch IDs" });
            }

            const batchMentor = await prisma.batchDetail.findMany({
                where: {
                    id: { in: batchIdsArray },
                    deletedAt: null, // Exclude soft deleted records
                    batchWithStudentModel: {
                        some: {
                            batch_id: { in: batchIdsArray },
                            deletedAt: null, // Exclude soft deleted records
                        },
                    }
                },
                select: {
                    id: true,
                    mentor_id: true
                }
            });

            if (!batchMentor.length) {
                throw new AppError({ statusCode: 404, data: {}, message: "No mentor found for the provided batch IDs" });
            }

            recipients = [
                ...batchWithStudents.map((s) => ({ studentId: s.student_id, receiverRole: "student", batchId: s.batch_id })),
                ...batchMentor.map((m) => ({ managementStaffId: m.mentor_id, receiverRole: "staff", batchId: m.id })),
            ]
        }
    }

    // Create notification and recipients
    try {
        const scheduledDate = formatDateOnly(parseDDMMYYYYToDate(data.date));
        const scheduledTime = formatTimeOnly(convertTimeToDateFormat(data.time));
        const newNotification = await prisma.notification.create({
            data: {
                title: data.title,
                description: data.message,
                image: data.image,
                type: data.type as NotificationType,
                category: data.category ? (data.category as NotificationCategory) : null,
                batch_ids: batchIdsArray.length ? data.batchIds as string : "",
                student_ids: studentIdsArray.length ? data.studentIds as string : "",
                date: scheduledDate,
                time: scheduledTime,
                scheduledAt: convertToEpoch({ date: scheduledDate, time: scheduledTime }),
                senderId: data.senderId,
            },
        });

        await prisma.notificationRecipient.createMany({
            data: recipients.map((r) => ({
                notificationId: newNotification.id,
                studentId: r.studentId || null,
                managementStaffId: r.managementStaffId || null,
                batchId: r.batchId || null,
                type: newNotification.type as NotificationType,
                receiverRole: r.receiverRole,
                status: "Pending",
                createdAt: new Date(),
            })),
        });

        return {
            title: newNotification.title,
            message: newNotification.description,
            image: newNotification.image,
            category: newNotification.category,
            date: newNotification.date as string,
            time: newNotification.time as string,
            batch_ids: batchIdsArray.length ? batchIdsArray.join(',') : "",
            student_ids: studentIdsArray.length ? studentIdsArray.join(',') : "",
        };
    } catch (error) {
        console.error("Error creating notification:", error);
        throw new AppError({
            statusCode: 400,
            message: "Can't create new notification. Something went wrong.",
        });
    }
};