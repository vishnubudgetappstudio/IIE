import express from "express";
import { createNotificationController, getNotificationHistoryController } from "../controllers/counsellor/notification.controller";

const router = express.Router();

// Create a new notification
router.post("/create", createNotificationController);
router.get("/get-history", getNotificationHistoryController);

export default router;