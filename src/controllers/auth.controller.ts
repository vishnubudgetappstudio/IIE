import { NextFunction, Request, Response } from "express";
import {
  forgotPasswordManagementStaff,
  loginService,
  registerCounsellor,
  resetPasswordManagementStaff,
  verifyOTPService,
} from "../services/auth.service";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, verifyOTPSchema } from "../zodSchema/auth.schema";
import { AppError } from "../utils/errorHandler";
import { PrismaClient } from "@prisma/client";
import { jwtGenerateToken } from "../utils/jwtTokenGenerate";
import { db } from '../utils/db';

const prisma = new PrismaClient();
//signup controller
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = signupSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, name, password, address, phone } = req.body;

    // Register Counsellor
    const response = await registerCounsellor(
      email,
      password,
      name,
      phone,
      address
    );

    // Send Success Response
    res.status(201).json({ message: "Signup successful", user: response });
  } catch (error) {
    next(error)
  }
};

//login controller
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = loginSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, role, password, fcm_token, is_login } = req.body;

    // Call login service
    const response = await loginService(email, role, password, fcm_token,  is_login );

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Failed to login", error);
    next(error);
  }
};

//forgotPassword controller
export const forgotPasswordManagementStaffController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = forgotPasswordSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      console.log({ firstErrorMessage })

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, role } = req.body;

    const result = await forgotPasswordManagementStaff({ email: email, role: role });
    res.json({ status: true, data: result, message: "OTP sent to email" });
  } catch (error) {
    next(error)
  }
};

//verify OTP controller
export const verifyOTPController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = verifyOTPSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, otp } = req.body;
    const result = await verifyOTPService(email, otp);
    res.json({ status: true, data: result, message: "OTP Verify Successful" });
  } catch (error) {
    next(error)
  }
};

//resetPassword controller
export const resetPasswordManagementStaffController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = resetPasswordSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, role, new_password, confirm_password } = req.body;

    // Check if newPassword and confirmPassword match
    if (new_password !== confirm_password) {
      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: "Passwords do not match", // Set message from Zod error
      });
    }

    const result = await resetPasswordManagementStaff({
      email: email,
      role: role,
      newPassword: new_password,
    });

    res.json({
      status: true,
      data: result,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};



//guest module signup
export const sendGuestOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Valid 10-digit phone number is required." });
    }

    const otpCode = "123456"; // Or Math.floor(100000 + Math.random() * 900000)

    // Check if phone exists
    const [rows] = await db.query('SELECT id FROM Guest WHERE phone = ?', [phone]);
    console.log("rows", rows);
    console.log((rows as any[]).length > 0)

    if ((rows as any[]).length > 0) {
      // Update existing record
      await db.query('UPDATE Guest SET otpCode = ? WHERE phone = ?', [otpCode, phone]);
    } else {
      // Insert new guest
      await db.query('INSERT INTO Guest (id, phone, otpCode, createdAt) VALUES (UUID(), ?, ?, NOW())', [phone, otpCode]);
    }
   // console.log()

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ message: "Something went wrong while sending OTP." });
  }
};


export const verifyGuestOtp = async (req: Request, res: Response) => {
  const { phone, otpCode, fcm_token } = req.body;

  if (!phone || !otpCode) {
    return res.status(400).json({ message: "Phone and OTP are required." });
  }

  try {
    // Fetch guest by phone
    const [rows] = await db.query('SELECT * FROM Guest WHERE phone = ?', [phone]);
    const guest = (rows as any[])[0];

    if (!guest || guest.otpCode !== otpCode) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

   

    // ✅ Generate JWT token
    const token = jwtGenerateToken({
      userId: guest.id,
      name: "Guest",
      email: `${guest.phone}@guest.com`, // Placeholder
      role: "guest",
    });

    return res.json({
      data: {
        id: guest.id,
        phone: guest.phone,
        role: "guest",
        token,
      },
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Something went wrong while verifying OTP." });
  }
};


