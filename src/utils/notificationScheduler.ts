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
                    };
                } catch (error) {
                    return {
                        id: recipient.id,
                        status: "Failed",
                        sentAt: null,
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
                    where: { id: result.id },
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





// import cron from "node-cron";
// import { prisma } from "../config/database";
// import { NotificationStatus } from "@prisma/client";

// const processScheduledNotifications = async () => {
//     try {
//         const currentEpoch = BigInt(Math.floor(Date.now() / 1000)); // Get current time in seconds

//         // Step 1: Fetch all "Scheduled" notifications whose time has arrived
//         const scheduledNotificationIds = await prisma.notification.findMany({
//             where: { status: "Scheduled", scheduledAt: { lte: currentEpoch }, deletedAt: null },
//             select: { id: true },
//         }).then(notifications => notifications.map(n => n.id));

//         if (scheduledNotificationIds.length === 0) {
//             console.log("✅ No scheduled notifications to process.");
//             return;
//         }

//         // Step 2: Fetch related "Scheduled" NotificationRecipients
//         const scheduledRecipientIds = await prisma.notificationRecipient.findMany({
//             where: { notificationId: { in: scheduledNotificationIds }, status: "Scheduled" },
//             select: { id: true },
//         }).then(recipients => recipients.map(r => r.id));

//         if (scheduledRecipientIds.length === 0) {
//             console.log("✅ No recipients found for scheduled notifications.");
//             return;
//         }

//         console.log(`🚀 Updating ${scheduledNotificationIds.length} notifications & ${scheduledRecipientIds.length} recipients to Pending.`);

//         // Step 3: Batch update notifications & recipients to "Pending"
//         await prisma.$transaction([
//             prisma.notification.updateMany({
//                 where: { id: { in: scheduledNotificationIds } },
//                 data: { status: "Pending" },
//             }),
//             prisma.notificationRecipient.updateMany({
//                 where: { id: { in: scheduledRecipientIds } },
//                 data: { status: "Pending" },
//             }),
//         ]);

//         // Step 4: Process sending notifications
//         const results = await Promise.all(
//             scheduledRecipientIds.map(async (recipientId) => {
//                 try {
//                     console.log(`📩 Sending notification to recipient: ${recipientId}`);

//                     // ✅ Simulated send logic (Replace with actual push/email sending)
//                     await new Promise((resolve) => setTimeout(resolve, 500)); // Simulating delay

//                     return { id: recipientId, sentAt: BigInt(Math.floor(Date.now() / 1000)) };
//                 } catch (error) {
//                     console.error(`❌ Failed to send notification: ${recipientId}`, error);
//                     return { id: recipientId, status: "Failed", sentAt: null };
//                 }
//             })
//         );

//         // Step 5: Batch update NotificationRecipient statuses
//         await prisma.$transaction(
//             results.map(({ id, sentAt }) =>
//                 prisma.notificationRecipient.update({
//                     where: { id },
//                     data: { status: 'Sent', sentAt },
//                 })
//             )
//         );

//         // Step 6: Update Notification model status to "Sent" where all recipients are sent
//         await prisma.notification.updateMany({
//             where: { id: { in: scheduledNotificationIds } },
//             data: { status: "Sent" },
//         });

//         console.log("✅ Notifications processed successfully.");
//     } catch (error) {
//         console.error("❌ Error processing notifications:", error);
//     }
// };

// // Run the cron job every minute
// cron.schedule("* * * * *", async () => {
//     console.log("⏳ Running notification scheduler...");
//     await processScheduledNotifications();
// });

// console.log("✅ Notification scheduler started.");
