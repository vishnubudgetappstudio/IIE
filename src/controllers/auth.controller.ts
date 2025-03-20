import { Request, Response } from "express";
import {
  forgotPasswordManagementStaff,
  loginService,
  registerCounsellor,
  resetPasswordManagementStaff,
  verifyOTPService,
} from "../services/auth.service";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema, verifyOTPSchema } from "../zodSchema/auth.schema";
import { AppError } from "../utils/errorHandler";

//signup controller
export const signup = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    throw new AppError({
      statusCode: 400,
      data: {},
      message: error.message || "Error registering counsellor",
    });
  }
};

//login controller
export const login = async (req: Request, res: Response) => {
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

    const { email, role, password } = req.body;

    // Call login service
    const response = await loginService(email, role, password);

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "Login successful",
    });
  } catch (error: any) {
    res.status(401).json({
      status: false,
      data: {},
      message: error.message || "Login failed ",
      // error: error.message || "Invalid credentials",
    });
  }
};

//forgotPassword controller
export const forgotPasswordManagementStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    // Validate Request Body (based on schema)
    const validatedData = forgotPasswordSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email } = req.body;

    const result = await forgotPasswordManagementStaff(email);
    res.json({ status: true, data: result, message: "OTP sent to email" });
  } catch (error: any) {
    res.status(400).json({ status: false, message: error.message });
  }
};

//verify OTP controller
export const verifyOTPController = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(400).json({ status: false, data: {}, message: error.message });
  }
};

//resetPassword controller
export const resetPasswordManagementStaffController = async (
  req: Request,
  res: Response
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

    const { email, new_password, confirm_password } = req.body;

    // Check if newPassword and confirmPassword match
    if (new_password !== confirm_password) {
      res.status(400).json({
        status: false,
        data: {},
        message: "Passwords do not match",
      });
      return;
    }
    const result = await resetPasswordManagementStaff(email, new_password);
    res.json({
      status: true,
      data: result,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    res.status(400).json({ status: false, data: {}, message: error.message });
  }
};
