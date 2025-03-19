import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { createNewStudentService } from "../../services/counsellor/createStudent.service";
import { AppError } from "../../utils/errorHandler";

// Student Creation Schema
export const createNewStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  roll_number: z
    .string()
    .min(3, "Roll number must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  phone: z.optional(
    z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number")
  ),
  alt_phone: z.optional(
    z.string().regex(/^\d{10}$/, "Alternate Phone must be a valid 10-digit number")
  ),
  course_id: z.string(),
  preferred_batch: z.string().uuid().optional(),
});

export const createNewStudentController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { userId, name: counsellor_name } = req.user;

    // Validate Request Body
    const validatePayload = createNewStudentSchema.safeParse(req.body);

    if (!validatePayload?.success) {
      const firstErrorMessage = validatePayload.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    // Extract data from request body
    const { name, email, roll_number, course_id, phone, alt_phone, preferred_batch } = req.body;

    //call create student service
    const response = await createNewStudentService({
      name: name,
      course_id: course_id,
      email: email,
      roll_number: roll_number,
      phone: phone,
      alt_phone: alt_phone,
      counsellor_id: userId,
      counsellor_name: counsellor_name,
      preferred_batch: preferred_batch,
    });

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "Create New Student successfully",
    });
  } catch (error: any) {
    console.error("Error Create New Student:", error);
    next(error);
  }
};
