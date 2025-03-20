import { z } from "zod";

// Student Creation Schema
export const createNewStudentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    roll_number: z
        .string()
        .min(3, "Roll number must be at least 3 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().optional(),
    phone_number: z.optional(
        z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number")
    ),
    alt_phone: z.optional(
        z.string().regex(/^\d{10}$/, "Alternate Phone must be a valid 10-digit number")
    ),
    course_id: z.string(),
    preferred_batch: z.string().uuid().optional(),
});