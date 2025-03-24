import express from "express";
import { createNotificationController, getNotificationHistoryController } from "../controllers/counsellorModule/notification.controller";
import { student_NotificationList } from "../controllers/studentModule/student_notification.controller";

const router = express.Router();

// Create a new notification (counsellor)
router.post("/create", createNotificationController);
router.get("/get-history", getNotificationHistoryController);

//student notifications
router.get("/list", student_NotificationList);

export default router;