import { z } from "zod";

//signUp request body Schema
export const signupSchema = z.object({
    email: z.string({ required_error: "*Email is required" }).email("Invalid email format"),
    password: z
        .string({ required_error: "*Password is required" })
        .min(8, "Password must be at least 8 characters long")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number")
        .regex(
            /[@$!%*?&]/,
            "Password must contain at least one special character (@$!%*?&)"
        ),
    name: z.string({ required_error: "*name is required" }).min(2, "Name must be at least 2 characters long"),
    phone: z.optional(
        z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number")
    ),
    address: z.optional(
        z.string().min(5, "Address must be at least 5 characters long")
    ),
});

//login request body Schema
export const loginSchema = z.object({
    email: z.string({ required_error: "*email is required" }).email({ message: "Invalid email format" }),
    role: z.enum(["staff", "counsellor", "student"], { required_error: "*role is required" }).refine(
        (role) => ["staff", "counsellor", "student"].includes(role),
        { message: "Role must be one of: staff, counsellor, student" }
    ),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long" }),
});

//forgotPassword request body Schema
export const forgotPasswordSchema = z.object({
    email: z.string({ required_error: "*email is required" }).email("Invalid email format"),
    role: z.enum(["staff", "counsellor", "student"], { required_error: "*role is required" }).refine(
        (role) => ["staff", "counsellor", "student"].includes(role),
        { message: "Role must be one of: staff, counsellor, student" }
    ),
});

//verifyOTP request body Schema
export const verifyOTPSchema = z.object({
    email: z.string({ required_error: "*email is required" }).email("Invalid email format"),
    otp: z.string({ required_error: "*OTP is required" }).min(4, "OTP must be at least 4 characters long"),
});

//resetPassword request body Schema
export const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
    role: z.enum(["staff", "counsellor", "student"], { required_error: "*role is required" }).refine(
        (role) => ["staff", "counsellor", "student"].includes(role),
        { message: "Role must be one of: staff, counsellor, student" }
    ),
    new_password: z
        .string({ required_error: "*new_password is required" })
        .min(8, "New Password must be at least 8 characters long")
        .regex(/[a-z]/, "New Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "New Password must contain at least one uppercase letter")
        .regex(/\d/, "New Password must contain at least one number")
        .regex(
            /[@$!%*?&]/,
            "New Password must contain at least one special character (@$!%*?&)"
        ),
    confirm_password: z
        .string({ required_error: "*confirm_password is required" })
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