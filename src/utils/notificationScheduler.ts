import cron from "node-cron";
import { prisma } from "../config/database";
import { NotificationStatus } from "@prisma/client";

const processScheduledNotifications = async () => {
    try {
        const currentEpoch = BigInt(Math.floor(Date.now() / 1000)); // Get current time in seconds as BigInt

        // Step 1: Update "Scheduled" notifications to "Pending" if their time has arrived
        await prisma.notificationRecipient.updateMany({
            where: {
                status: "Scheduled",
                sentAt: { lte: currentEpoch }, // ✅ Compare BigInt with BigInt
            },
            data: { status: "Pending" },
        });

        // Step 2: Fetch "Pending" notifications for processing
        const pendingNotifications = await prisma.notificationRecipient.findMany({
            where: { status: "Pending" },
            include: { notification_relation: true },
        });

        if (pendingNotifications.length === 0) {
            console.log("No pending notifications to process.");
            return;
        }

        console.log(`Processing ${pendingNotifications.length} pending notifications...`);

        // Step 3: Send notifications
        const results = await Promise.all(
            pendingNotifications.map(async (recipient) => {
                try {
                    // Simulate sending logic (Replace with actual push/email logic)
                    console.log(`Sending notification to ${recipient.studentId || recipient.managementStaffId}`);

                    return {
                        id: recipient.id,
                        status: "Sent",
                        sentAt: BigInt(Math.floor(Date.now() / 1000)), // ✅ Store as BigInt epoch
                        notificationId: recipient.notification_relation.id
                    };
                } catch (error) {
                    return {
                        id: recipient.id,
                        status: "Failed",
                        sentAt: null,
                        notificationId: recipient.notification_relation.id
                    };
                }
            })
        );

        // Step 4: Batch update statuses
        await prisma.$transaction(
            results.map((result) =>
                prisma.notificationRecipient.update({
                    where: { id: result.id },
                    data: {
                        status: result.status as NotificationStatus,
                        sentAt: result.sentAt, // ✅ No need to convert, stays BigInt
                    },
                })
            )
        );

        // Step 4: Batch update statuses
        await prisma.$transaction(
            results.map((result) =>
                prisma.notification.update({
                    where: { id: result.notificationId },
                    data: {
                        status: result.status as NotificationStatus,
                    },
                })
            )
        );

        console.log("Notification processing completed.");
    } catch (error) {
        console.error("Error processing scheduled notifications:", error);
    }
};

// Schedule cron job to run every minute
cron.schedule("* * * * *", async () => {
    console.log("Running notification scheduler...");
    await processScheduledNotifications();
});

console.log("Notification scheduler started.");
