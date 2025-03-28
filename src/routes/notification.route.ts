import express from "express";
import { student_NotificationList } from "../controllers/studentModule/student_notification.controller";
import { createNotificationController } from "../controllers/counsellorModule/notification_related/create_notification.controller";
import { getNotificationHistoryController } from "../controllers/counsellorModule/notification_related/get_notification_history.controller";

const router = express.Router();

// Create a new notification (counsellor)
router.post("/create", createNotificationController);
router.get("/get-history", getNotificationHistoryController);

//student notifications
router.get("/list", student_NotificationList);

export default router;