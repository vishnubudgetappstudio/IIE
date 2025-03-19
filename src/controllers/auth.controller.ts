import { Request, Response } from "express";
import { z } from "zod";
import {
  forgotPasswordManagementStaff,
  loginService,
  registerCounsellor,
  resetPasswordManagementStaff,
  verifyOTPService,
} from "../services/auth.service";
import { AppError } from "../utils/errorHandler";
// import { registerCounsellor } from "../services/auth.service";

// Define Validation Schema
const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&]/,
      "Password must contain at least one special character (@$!%*?&)"
    ),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  phone: z.optional(
    z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number")
  ),
  address: z.optional(
    z.string().min(5, "Address must be at least 5 characters long")
  ),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().min(4, "OTP must be at least 4 characters long"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  new_password: z
    .string()
    .min(8, "New Password must be at least 8 characters long")
    .regex(/[a-z]/, "New Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "New Password must contain at least one uppercase letter")
    .regex(/\d/, "New Password must contain at least one number")
    .regex(
      /[@$!%*?&]/,
      "New Password must contain at least one special character (@$!%*?&)"
    ),
  confirm_password: z
    .string()
    .min(8, "Confirm Password must be at least 8 characters long")
    .regex(
      /[a-z]/,
      "Confirm Password must contain at least one lowercase letter"
    )
    .regex(
      /[A-Z]/,
      "Confirm Password must contain at least one uppercase letter"
    )
    .regex(/\d/, "Confirm Password must contain at least one number")
    .regex(
      /[@$!%*?&]/,
      "Confirm Password must contain at least one special character (@$!%*?&)"
    ),
});

//signup controller
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate Request Body
    const validatedData = signupSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
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
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
      return;
    }

    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

//login controller
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate Request Body
    const validatedData = loginSchema.safeParse(req.body);

    if (!validatedData?.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    const { email, password } = req.body;

    // Call login service
    const response = await loginService(email, password);

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

export const forgotPasswordManagementStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    // Validate Request Body
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

export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    // Validate Request Body
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

export const resetPasswordManagementStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    // Validate Request Body
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
