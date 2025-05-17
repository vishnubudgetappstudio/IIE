import { ReceiverRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const staff_notificationListService = async ({
    staff_id,
    role,
    page,
    pageSize
}: {
    staff_id: string;
    role: ReceiverRole;
    page: number;
    pageSize: number;
}) => {
    try {
        // Calculate the number of records to skip
        const skip = (page - 1) * pageSize;

        // Fetch notifications with pagination
        console.log( "GetNotificationList => ", staff_id, role);
        // const staff_notificationList = await prisma.notificationRecipient.findMany({
        //     where: {
        //         managementStaffId: staff_id,
        //         receiverRole: role,
        //         isRead: false,
        //         status: 'Sent',
        //         // notification_relation: {
        //         //     status: 'Sent',
        //         //     deletedAt: null
        //         // }
        //     },
        //     select: {
        //         // notificationId: true,
        //         // notification_relation: {
        //         // select: {
        //             id: true,
        //             title: true,
        //             description: true,
        //             type: true,
        //             createdAt: true,
        //             leaveDetailId: true,
        //             // updatedAt: true,
        //             status: true,
        //         // }
        //         // }
        //     },
        //     skip, // Skip the first (page - 1) * pageSize records
        //     take: pageSize, // Limit the number of records per page
        //     orderBy: {
        //         createdAt: 'desc' // Order by newest notifications first
        //     }
        // });

        const staff_notificationList = await prisma.notificationRecipient.findMany({
            where: {
                managementStaffId: staff_id,
                receiverRole: role,
                isRead: false,
                status: 'Sent',
            },
            select: {
                id: true,
                title: true,
                description: true,
                type: true,
                createdAt: true,
                leaveDetailId: true,
                status: true,

                // ✅ Include the leaveDetail relation
                leaveDetail: {
                select: {
                    // Only select student and its required fields
                    student_relation: {
                    select: {
                        name: true,
                        profile_img_url: true,
                        roll_number: true,
                    }
                    }
                }
                }
            },
            skip,
            take: pageSize,
            orderBy: {
                createdAt: 'desc'
            }
            });



        // Get total count for pagination
        const totalNotifications = await prisma.notificationRecipient.count({
            where: {
                managementStaffId: staff_id,
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
            notifications: staff_notificationList,
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
