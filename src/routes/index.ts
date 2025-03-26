import { Router } from "express";
import authRoutes from "./auth.route";
// import profileRoutes from "./profile.route";
import batchRoutes from "./batch.route";
import { verifyToken } from "../middlewares/auth.middleware";
import s3Routes from "./s3/s3.route";
import notificationRoutes from "./notification.route";
import { raiseSupportTicket } from "../controllers/counsellorModule/supportTicket.controller";
import { getStaff_Student_BatchController } from "../controllers/counsellorModule/getStaff_Student_Batch.controller";
import { createNewStudentController, getAllStudentsController } from "../controllers/counsellorModule/students.controller";
import { requestLeaveController } from "../controllers/applyLeave.controller";
import { getProfileController, updateProfileController } from "../controllers/profile.controller";
import { studentHomeScreenController } from "../controllers/studentModule/homeScreen.controller";
import { getAttendancePercentageController, markStudentAttendanceController } from "../controllers/staffModule/attendance.controller";

const router = Router();

//Authorization routes:
router.use("/auth", authRoutes);
router.use("/s3", s3Routes); //upload files and profile images

// Secure all protected routes
router.use(verifyToken);

//common API routes
router.get("/profile", getProfileController) // get Profile route
router.post("/update-profile", updateProfileController); // update Profile route
// router.use("/profile", profileRoutes); // Profile routes
router.post("/apply-leave", requestLeaveController); // Apply Leave route
router.post("/rise-support-ticket", raiseSupportTicket); // Support ticket route

//Counsellor API routes
router.post("/add-new-student", createNewStudentController); // Create New Student route
router.use("/batch", batchRoutes); // Batch routes
router.get("/get-staff-student-batch", getStaff_Student_BatchController); // get Staff or Student or Batch route
router.get("/all-students", getAllStudentsController);// Get students with pagination & search
router.use("/notification", notificationRoutes);// Counsellor Notification Routes

//Student API routes
router.get("/student-home-details", studentHomeScreenController)

//Staff API routes
router.post("/attendance/mark", markStudentAttendanceController)
router.get("/attendance/percentage", getAttendancePercentageController)

export default router;
