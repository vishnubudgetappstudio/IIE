import { Router } from "express";
import authRoutes from "./auth.route";
// import profileRoutes from "./profile.route";
import batchRoutes from "./batch.route";
import { verifyToken } from "../middlewares/auth.middleware";
import s3Routes from "./s3/s3.route";
import notificationRoutes from "./notification.route";
import { raiseSupportTicket } from "../controllers/counsellorModule/supportTicket.controller";
import { getStaff_Student_BatchController } from "../controllers/counsellorModule/get_Staff_Student_Batch.controller";
import { requestLeaveController } from "../controllers/applyLeave.controller";
import { updateProfileController } from "../controllers/profile.controller";
import { studentHomeScreenController } from "../controllers/studentModule/homeScreen.controller";
import { createNewStudentController } from "../controllers/counsellorModule/student_related/create_new_student.controller";
import { getAllStudentsController } from "../controllers/counsellorModule/student_related/get_all_students.controller";
import { markStudentAttendanceController } from "../controllers/staffModule/attendance_related/mark_student_attendance.controller";
import { getStudentAttendanceStatsController } from "../controllers/staffModule/attendance_related/get_student_attendance_stats.controller";
import { uploadXlsFileController } from "../controllers/counsellorModule/xls_file_upload.controller";
import { updateXlsFileNameController } from "../controllers/counsellorModule/xls_fileName_update.controller";
import { getXLSFileListController } from "../controllers/counsellorModule/get_xls_fileList.controller";
import { uploadPDFMaterialFileController } from "../controllers/staffModule/pdf_material_related/upload_pdf_material.controller";
import { getStudentStudyMaterialsController } from "../controllers/studentModule/get_study_material.controller";
import { getPDFMaterialFileListController } from "../controllers/staffModule/pdf_material_related/get_pdf_material_list.controller";
import { editStudentMaterialAccessController } from "../controllers/staffModule/pdf_material_related/edit_student_material_access.controller";
import { updateUserFcmTokenController } from "../controllers/update_user_fcm_token.controller";
import { getStudentAttendanceController } from "../controllers/studentModule/get_attendance.controller";
import { createCourseTestController } from "../controllers/staffModule/test_relateed/couse_test_related/create_course_test.controller";
import { createMockTestController } from "../controllers/staffModule/test_relateed/mock_test_related/create_mock_test.controller";
import { getAllCourseTestsController } from "../controllers/staffModule/test_relateed/couse_test_related/get_course_test.controller";
import { getAllMockTestsController } from "../controllers/staffModule/test_relateed/mock_test_related/get_mock_test.controller";
import { studentGetAllCourseOrMockTestsController } from "../controllers/studentModule/get_course_or_mock_tests.controller";
import { getQuestionsListController } from "../controllers/studentModule/get_test_qustions.controller";
import { getProfileDetailsController } from "../controllers/profile/get_profile_details.controller";

const router = Router();

//Authorization routes:
router.use("/auth", authRoutes);

// Secure all protected routes
router.use(verifyToken);
router.use("/s3", s3Routes); //upload files and profile images
router.post("/update-fcm-token", updateUserFcmTokenController); //update fcm token for user

//common API routes
router.get("/profile", getProfileDetailsController) // get Profile route
router.post("/update-profile", updateProfileController); // update Profile route
// router.use("/profile", profileRoutes); // Profile routes
router.post("/apply-leave", requestLeaveController); // Apply Leave route
router.post("/rise-support-ticket", raiseSupportTicket); // Support ticket route
router.post("/upload-xls-file", uploadXlsFileController); // Upload XLS or XLSX route
router.post("/update-xls-fileName", updateXlsFileNameController); // Update XLS or XLSX route
router.get("/get-xls-files", getXLSFileListController); // Get XLS or XLSX List route

//Counsellor API routes
router.post("/add-new-student", createNewStudentController); // Create New Student route
router.use("/batch", batchRoutes); // Batch routes
router.get("/get-staff-student-batch", getStaff_Student_BatchController); // get Staff or Student or Batch route
router.get("/all-students", getAllStudentsController);// Get students with pagination & search
router.use("/notification", notificationRoutes);// Counsellor Notification Routes

//Student API routes
router.get("/student-home-details", studentHomeScreenController);
router.get("/get-study-materials", getStudentStudyMaterialsController);
router.get("/get-attendance-detail", getStudentAttendanceController);
router.get("/get-course-or-mock-tests", studentGetAllCourseOrMockTestsController);
router.get("/get-questions-list", getQuestionsListController)

//Staff API routes
router.post("/attendance/mark", markStudentAttendanceController);
router.get("/attendance/percentage", getStudentAttendanceStatsController);
router.post("/upload-pdfMaterial-students", uploadPDFMaterialFileController);
router.post("/edit-pdfMaterial-students-access", editStudentMaterialAccessController);
router.get("/get-pdf-Materials", getPDFMaterialFileListController);
router.post("/create-course-test", createCourseTestController);
router.get("/get-course-tests", getAllCourseTestsController);
router.post("/create-mock-test", createMockTestController);
router.get("/get-mock-tests", getAllMockTestsController);

export default router;
