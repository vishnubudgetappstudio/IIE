import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { createNewStudentService } from "../../services/counsellor/createStudent.service";

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
  course_id: z.string(),
  preferred_batch: z.string().optional(),
});

export const createNewStudentController = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const { userId, name: counsellor_name } = req.user;

    // Validate Request Body
    const validatePayload = createNewStudentSchema.parse(req.body);

    // Extract data from request body
    const { name, email, roll_number, course_id } = validatePayload;

    //call create student service
    const response = await createNewStudentService(
      name,
      email,
      roll_number,
      course_id,
      userId,
      counsellor_name
    );

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "Create New Student successfully",
    });
  } catch (error) {
    console.error("Error Create New Student:", error);

    res.status(400).json({
      status: false,
      data: {},
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
