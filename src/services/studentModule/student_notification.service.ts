import { ReceiverRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const student_notificationListService = async ({
    student_id,
    role,
    page,
    pageSize
}: {
    student_id: string;
    role: ReceiverRole;
    page: number;
    pageSize: number;
}) => {
    try {
        // Calculate the number of records to skip
        const skip = (page - 1) * pageSize;

        // Fetch notifications with pagination
        const student_notificationList = await prisma.notificationRecipient.findMany({
            where: {
                studentId: student_id,
                receiverRole: role,
                isRead: false,
                status: 'Sent',
                // notification_relation: {
                //     status: 'Sent',
                //     deletedAt: null
                // }
            },
            // select: {
            //     notificationId: true,
            //     notification_relation: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        createdAt: true,
                        status: true,
                        session_id: true,
                        materialDetail: {
                            select: {   
                                staff_id: true,
                                createdAt: true,
                                staff: {
                                    select: {
                                        id: true,
                                        name: true,
                                    }
                                }
                            }
                        },
                        testCourseDetailRelation: {
                            select: {
                                id: true,
                                start_date: true,
                                end_date: true,
                                timer: true,
                                test_title: true,
                                test_description: true,
                            }
                        }
                    },
            //     }
            // },
            skip, // Skip the first (page - 1) * pageSize records
            take: pageSize, // Limit the number of records per page
            orderBy: {
                createdAt: 'desc' // Order by newest notifications first
            }
        });

        // Get total count for pagination
        const totalNotifications = await prisma.notificationRecipient.count({
            where: {
                studentId: student_id,
                receiverRole: role,
                isRead: false,
                status: 'Sent',
                notification_relation: {
                    status: 'Sent',
                    deletedAt: null
                }
            }
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalNotifications / pageSize);

        return {
            notifications: student_notificationList,
            total: totalNotifications,
            page,
            limit: pageSize,
            totalPages
        };
    } catch (error: any) {
        console.error(`Failed to fetch notifications: ${error.message}`)
        throw new AppError({ statusCode: 400, message: "Failed to fetch notifications", data: [] });
    }
};
