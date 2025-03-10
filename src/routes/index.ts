import { Router } from "express";
import authRoutes from "./auth.route";
import profileRoutes from "./profile.route";
import supportTicketRoutes from "./supportTicket.route";
import applyLeaveRoutes from "./applyLeave.route";
import addNewStudentRoutes from "./student.route";
import batchRoutes from "./batch.route";
import getStaff_Student_BatchRoutes from "./getStaff_Student_Batch.route";
import { verifyToken } from "../middlewares/auth.middleware";
import s3Routes from "./s3/s3.route";
import { getAllStudentsController } from "../controllers/counsellor/allStudentsList.controller";

const router = Router();

//Authorization routes:
router.use("/auth", authRoutes);
router.use("/s3", s3Routes); //upload files and profile images

// Secure all protected routes
router.use(verifyToken);
router.use("/profile", profileRoutes); // Profile route
router.use("/rise-support-ticket", supportTicketRoutes); // Support ticket route
router.use("/apply-leave", applyLeaveRoutes); // Apply Leave route
router.use("/add-new-student", addNewStudentRoutes); // Create New Student route
router.use("/batch", batchRoutes); // Create New Batch route
router.use("/get-staff-student-batch", getStaff_Student_BatchRoutes); // Create New Batch route
router.get("/all-students", getAllStudentsController);// Get students with pagination & search


export default router;
