import { z } from "zod";

export const attendanceSchema = z.object({
    batchId: z.string().min(1, "Batch ID is required"),
    studentId: z.string().min(1, "Student ID is required"),
    isPresent: z.boolean(),
});

// Custom transformation & validation for `student_ids`
const studentIdsSchema = z.preprocess((val) => {
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            throw new z.ZodError([{ code: "custom", message: "Invalid student_ids format. Expected a JSON array.", path: ["student_ids"] }]);
        }
    }
    return val;
}, z.array(z.string().uuid("Invalid student ID format")).nonempty({ message: "*At least one student ID is required" }));

export const pdfMaterialFileUploadSchema = z.object({
    material_title: z
        .string({ required_error: "*Material title is required" })
        .min(2, "Material title must be at least 2 characters long"),

    batch_id: z
        .string({ required_error: "*Batch ID is required" })
        .uuid("Invalid batch ID format"), // Ensure batch ID is a valid UUID

    student_ids: studentIdsSchema, // Custom validation for student_ids
});