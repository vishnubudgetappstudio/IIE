import cron from "node-cron";
import { prisma } from "../config/database";
import admin from "firebase-admin";

const processScheduledNotifications = async () => {
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

  let hours = now.getHours();
  const minutes = pad(now.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time = `${pad(hours)}:${minutes} ${ampm}`;

  const notifications = await prisma.notification.findMany({
    where: {
      date: date,
      time: time,
      status: "Pending",
    },
  });

  console.log("Check Notifications schedule are there", date, time, notifications);

  for (const notif of notifications) {
    const sentAt = Math.floor(Date.now() / 1000);

    // 1. Process direct student_ids (with batchid = null)
    let individualStudentIds: string[] = [];
    if (notif.student_ids) {
      individualStudentIds = notif.student_ids.split(",").map((id) => id.trim());
    }

    const individualStudents = await prisma.student.findMany({
      where: {
        id: { in: individualStudentIds },
        fcm_token: { not: null },
      },
      select: { id: true, fcm_token: true },
    });

    const individualTokens = individualStudents.map((s) => s.fcm_token).filter((token): token is string => !!token);

    // 2. Process batch_ids
    let batchRecipients: any[] = [];
    let batchTokens: string[] = [];

    if (notif.batch_ids) {
      const batchIds = notif.batch_ids.split(",").map((id) => id.trim());

      for (const batchId of batchIds) {
        const batchStudents = await prisma.batchWithStudent.findMany({
          where: {
            batch_id: batchId,
          },
          select: { student_id: true },
        });

        const studentIds = batchStudents.map((b) => b.student_id);

        const students = await prisma.student.findMany({
          where: {
            id: { in: studentIds },
            fcm_token: { not: null },
          },
          select: { id: true, fcm_token: true },
        });

        const tokens = students.map((s) => s.fcm_token).filter((token): token is string => !!token);
        batchTokens.push(...tokens);

        batchRecipients.push(
          ...students.map((s) => ({
            notificationId: notif.id,
            title: notif.title,
            description: notif.description,
            studentId: s.id,
            batchId: batchId,
            managementStaffId: null,
            receiverRole: "student",
            isRead: false,
            status: "Sent",
            type: notif.type,
            sentAt: sentAt,
          }))
        );
      }
    }

    // 3. Process category: "all", "student", "staff"
    let categoryTokens: string[] = [];
    const categoryRecipients: any[] = [];

    if (notif.category === "all" || notif.category === "students") {
      const students = await prisma.student.findMany({
        where: {
          fcm_token: { not: null },
        },
        select: { id: true, fcm_token: true },
      });

      const tokens = students.map((s) => s.fcm_token).filter((token): token is string => !!token);
      categoryTokens.push(...tokens);

      categoryRecipients.push(
        ...students.map((s) => ({
          notificationId: notif.id,
          title: notif.title,
          description: notif.description,
          studentId: s.id,
          batchId: null,
          managementStaffId: null,
          receiverRole: "student",
          isRead: false,
          status: "Sent",
          type: notif.type,
          sentAt: sentAt,
        }))
      );
    }

    if (notif.category === "all" || notif.category === "staffs") {
      const staffs = await prisma.managementStaff.findMany({
        where: {
          fcm_token: { not: null },
        },
        select: { id: true, fcm_token: true },
      });

      const tokens = staffs.map((s) => s.fcm_token).filter((token): token is string => !!token);
      categoryTokens.push(...tokens);

      categoryRecipients.push(
        ...staffs.map((s) => ({
          notificationId: notif.id,
          title: notif.title,
          description: notif.description,
          studentId: null,
          batchId: null,
          managementStaffId: s.id,
          receiverRole: "staff",
          isRead: false,
          status: "Sent",
          type: notif.type,
          sentAt: sentAt,
        }))
      );
    }

    // 4. Combine all tokens and recipients
    const allTokens = [...individualTokens, ...batchTokens, ...categoryTokens];
    const allRecipients = [
      ...individualStudents.map((s) => ({
        notificationId: notif.id,
        title: notif.title,
        description: notif.description,
        studentId: s.id,
        batchId: null,
        managementStaffId: null,
        receiverRole: "student",
        isRead: false,
        status: "Sent",
        type: notif.type,
        sentAt: sentAt,
      })),
      ...batchRecipients,
      ...categoryRecipients,
    ];

    if (!allTokens.length) {
      console.log(`No valid tokens found for notification ID ${notif.id}`);
      continue;
    }

    // 5. Send notification
    const payload = {
      notification: {
        title: notif.title,
        body: notif.description,
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: allTokens,
        notification: payload.notification,
      });

      console.log(`Sent to ${allTokens.length} users:`, response);

      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: "Sent" },
      });

      await prisma.notificationRecipient.createMany({
        data: allRecipients,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error(`Error sending notification ID ${notif.id}:`, error);
    }
  }
};

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("Running notification scheduler...");
  await processScheduledNotifications();
});

console.log("Notification scheduler started.");
