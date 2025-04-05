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

// Batch Creation Schema
export const createNewBatchSchema = z.object({
    batch_number: z
        .string()
        .min(2, { message: "Batch number must be at least 2 characters long" }),
    from_date: z.string().regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
        message: "Invalid date format (DD/MM/YYYY required)",
    }),
    to_date: z.string().regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
        message: "Invalid date format (DD/MM/YYYY required)",
    }),
    course: z
        .string()
        .min(3, { message: "Course name must be at least 3 characters long" }),
    slot: z.enum(["morning", "evening"], {
        message: "Slot must be 'morning' or 'evening'",
    }), // Fixed Enum Validation
    mentor_id: z
        .string()
        .uuid({ message: "Invalid mentor ID format (must be a UUID)" }),
    students_id: z.string().optional(),
});

// Add Multiple Student IDs to the batch
export const addStudentsToBatchSchema = z.object({
    batch_id: z.string().uuid("Invalid Batch ID format"),
    student_ids: z.array(z.string().uuid("Invalid Student ID format")).min(1, "At least one student ID is required"),
});

// Remove Multiple Student IDs from the batch
export const removeStudentsFromBatchSchema = z.object({
    batch_id: z.string().uuid("Invalid Batch ID format"),
    student_ids: z.array(z.string().uuid("Invalid Student ID format")).nonempty("Student IDs are required"),
});

// validation schema for batchId
export const batchIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

//validation schema for xls file upload
export const xlsFileUploadSchema = z.object({
    xls_file_id: z.string({ required_error: "*xls_file_id is required" }).uuid({ message: "Invalid xls_file_id format" }),
    fileName: z.string({ required_error: "*file name is required" }).min(2, "Name must be at least 2 characters long"),
});