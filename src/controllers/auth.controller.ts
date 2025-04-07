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
    console.log("1111188888888=====>", req.body);
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

    const { email, role, password, fcm_token } = req.body;

    // Call login service
    const response = await loginService(email, role, password, fcm_token);

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

