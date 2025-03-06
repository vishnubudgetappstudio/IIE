import { Request, Response } from "express";
import { z } from "zod";
import { loginService, registerCounsellor } from "../services/auth.service";
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

//signup controller
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate Request Body
    const validatedData = signupSchema.parse(req.body);

    const { email, name, password, address, phone } = validatedData;

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
      const formattedErrors = validatedData?.error.format();

      // Extract meaningful messages
      Object.values(formattedErrors)
        .flat()
        .filter((msg) => typeof msg === "string"); // Remove unwanted objects
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
