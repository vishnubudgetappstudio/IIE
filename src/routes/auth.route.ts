import express from "express";
import {
  forgotPasswordManagementStaffController,
  resetPasswordManagementStaffController,
  login,
  signup,
  verifyOTPController,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPasswordManagementStaffController);
router.post("/verify-otp", verifyOTPController);
router.post("/reset-password", resetPasswordManagementStaffController);

export default router;
