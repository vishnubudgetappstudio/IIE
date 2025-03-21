import { z } from "zod";

export const managementStaffIdSchema = z.string({ required_error: "*counsellor Id required" }).uuid({ message: "Invalid Counsellor ID format" });

// Student Creation Schema
export const createNewStudentSchema = z.object({
    name: z.string({ required_error: "*name is required" }).min(2, "Name must be at least 2 characters long"),
    roll_number: z
        .string({ required_error: "*roll_number is required" })
        .min(3, "Roll number must be at least 3 characters long"),
    email: z.string({ required_error: "*email is required" }).email("Invalid email format"),
    phone_number: z.optional(
        z.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number")
    ),
    alt_phone: z.optional(
        z.string().regex(/^\d{10}$/, "Alternate Phone must be a valid 10-digit number")
    ),
    course_id: z.string({ required_error: "*course_id is required" }),
    preferred_batch: z.string().optional(),
});