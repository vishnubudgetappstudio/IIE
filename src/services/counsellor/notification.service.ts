import { NotificationType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { join } from "path";

interface CreateNotificationData {
    senderId: string;
    title: string;
    message: string;
    image?: string;
    type: string;
    category?: string;
    date?: string;
    time?: string;
    batchIds?: string; // Comma-separated batch IDs
    studentIds?: string; // Comma-separated student IDs
}

export const createNotificationService = async (data: CreateNotificationData) => {
    let recipients: any[] = [];

    // Convert comma-separated strings into arrays
    const batchIdsArray = data.batchIds ? data.batchIds.split(",").map(id => id.trim()).filter(id => id) : [];
    const studentIdsArray = data.studentIds ? data.studentIds.split(",").map(id => id.trim()).filter(id => id) : [];

    try {
        if (data.category === "all") {
            // Fetch all students and staff
            const students = await prisma.student.findMany({ select: { id: true } });
            const staff = await prisma.managementStaff.findMany({ select: { id: true } });

            recipients = [
                ...students.map((s) => ({ studentId: s.id, receiverRole: "student" })),
                ...staff.map((s) => ({ managementStaffId: s.id, receiverRole: "staff" })),
            ];
        } else if (data.category === "staff") {
            // Fetch only staff members
            const staff = await prisma.managementStaff.findMany({ where: { role: "staff" }, select: { id: true } });
            recipients = staff.map((s) => ({ managementStaffId: s.id, receiverRole: "staff" }));
        } else if (data.category === "student") {
            // Add individual students if provided
            if (studentIdsArray.length > 0) {
                recipients.push(...studentIdsArray.map((id) => ({ studentId: id, receiverRole: "student" })));
            }
        } else if (data.category === "" && (data.studentIds || data.batchIds)) {
            if (data.studentIds) {
                recipients.push(...studentIdsArray.map((id) => ({ studentId: id, receiverRole: "student" })));

            }
            if (batchIdsArray.length) {
                // Fetch students based on batchIds (Using Relation)
                const batchStudents = await prisma.student.findMany({
                    where: {
                        batches: {
                            some: {
                                batch_id: { in: batchIdsArray }, // Using Prisma relation
                                deletedAt: null // Exclude soft deleted records
                            },
                        },
                        deletedAt: null
                    },
                    select: { id: true },
                });
                const batchMentor = await prisma.batchDetail.findMany({
                    where: {
                        id: { in: batchIdsArray },
                        deletedAt: null, // Exclude soft deleted records
                    },
                    select: { mentor_id: true }
                })
                // recipients.push(...batchStudents.map((s) => ({ studentId: s.id, receiverRole: "student" })));
                recipients = [
                    ...batchStudents.map((s) => ({ studentId: s.id, receiverRole: "student" })),
                    ...batchMentor.map((m) => ({ managementStaffId: m.mentor_id, receiverRole: "staff" })),
                ]
                console.log({ recipients })
            }
        }

        // Create notification and recipients
        const newNotification = await prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                image: data.image,
                type: data.type as NotificationType,
                category: data.category,
                date: data.date as string,
                time: data.time as string,
                senderId: data.senderId,
            },
        });

        await prisma.notificationRecipient.createMany({
            data: recipients.map((r) => ({
                notificationId: newNotification.id,
                studentId: r.studentId,
                managementStaffId: r.managementStaffId,
                receiverRole: r.receiverRole,
                status: "Pending",
                createdAt: new Date(),
            })),
        });

        return {
            data: {
                title: newNotification.title,
                message: newNotification.message,
                image: newNotification.image,
                category: newNotification.category,
                date: newNotification.date as string,
                time: newNotification.time as string,
                batch_id: batchIdsArray.length ? batchIdsArray.join(',') : "",
                student_id: studentIdsArray.length ? studentIdsArray.join(',') : "",

            }
        };

    } catch (error) {
        console.log({ error })
        throw new AppError({
            statusCode: 400,
            data: {},
            message: "Can't able to schedule notification",
        });
    }


};
