import { Router } from "express";
import authRoutes from "./auth.route";
import batchRoutes from "./batch.route";
import { verifyToken } from "../middlewares/auth.middleware";
import s3Routes from "./s3/s3.route";
import notificationRoutes from "./notification.route";
import { raiseSupportTicket } from "../controllers/counsellorModule/supportTicket.controller";
import { getProfileController } from "../controllers/profile.controller";
import { getStaff_Student_BatchController } from "../controllers/counsellorModule/getStaff_Student_Batch.controller";
import { createNewStudentController, getAllStudentsController } from "../controllers/counsellorModule/students.controller";
import { requestLeaveController } from "../controllers/applyLeave.controller";

const router = Router();

//Authorization routes:
router.use("/auth", authRoutes);
router.use("/s3", s3Routes); //upload files and profile images

// Secure all protected routes
router.use(verifyToken);

//common API routes
router.use("/profile", getProfileController); // Profile route
router.use("/apply-leave", requestLeaveController); // Apply Leave route
router.use("/rise-support-ticket", raiseSupportTicket); // Support ticket route

//Counsellor API routes
router.use("/add-new-student", createNewStudentController); // Create New Student route
router.use("/batch", batchRoutes); // Batch routes
router.use("/get-staff-student-batch", getStaff_Student_BatchController); // Create New Batch route
router.get("/all-students", getAllStudentsController);// Get students with pagination & search
router.use("/notification", notificationRoutes);// Counsellor Notification Routes

//Student API routes


export default router;
