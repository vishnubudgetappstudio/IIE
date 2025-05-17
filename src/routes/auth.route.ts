import express from "express";
import {
  forgotPasswordManagementStaffController,
  resetPasswordManagementStaffController,
  login,
  signup,
  verifyOTPController,
  sendGuestOtp,
  verifyGuestOtp
} from "../controllers/auth.controller";
import { upload } from "../middlewares/upload.middleware";

const router = express.Router();

router.post("/signup", upload.none(), signup);
router.post("/login", upload.none(), login);
router.post("/forgot-password", upload.none(), forgotPasswordManagementStaffController);
router.post("/verify-otp", upload.none(), verifyOTPController);
router.post("/reset-password", upload.none(), resetPasswordManagementStaffController);


// ✅ Guest login routes
//router.post("/guest/signup", upload.none(), sendGuestOtp);
router.post("/guest/signup", upload.none(), async (req, res, next) => {
  try {
    
    await sendGuestOtp(req, res);
  } catch (error) {
    next(error);
  }
});
router.post("/guest/verify-otp", upload.none(), async (req, res, next) => {
  try {
    await verifyGuestOtp(req, res);
  } catch (error) {
    next(error);
  }
});//router.post('/auth/guest/send-otp', sendGuestOtp);
//router.post('/auth/guest/verify-otp', verifyGuestOtp);


export default router;
