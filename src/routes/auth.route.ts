import express from "express";
import {
  forgotPasswordManagementStaffController,
  resetPasswordManagementStaffController,
  login,
  signup,
  verifyOTPController,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

router.post("/signup", upload.none(), signup);
router.post("/login", upload.none(), login);
router.post("/forgot-password", upload.none(), forgotPasswordManagementStaffController);
router.post("/verify-otp", upload.none(), verifyOTPController);
router.post("/reset-password", upload.none(), resetPasswordManagementStaffController);

export default router;
