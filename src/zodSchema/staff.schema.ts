import { z } from "zod";

export const attendanceSchema = z.object({
    batchId: z.string().min(1, "Batch ID is required"),
    studentId: z.string().min(1, "Student ID is required"),
    isPresent: z.boolean(),
});

// Custom transformation & validation for `student_ids Array`
const studentIdsArraySchema = z.preprocess((val) => {
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            throw new z.ZodError([{ code: "custom", message: "Invalid student_ids format. Expected a JSON array.", path: ["student_ids"] }]);
        }
    }
    return val;
}, z.array(z.string().optional(), { required_error: '*student_ids array missing, At least empty array is required' }));

export const pdfMaterialFileUploadSchema = z.object({
    material_title: z
        .string({ required_error: "*Material title is required" })
        .min(2, "Material title must be at least 2 characters long"),

    batch_id: z.string().optional(),
    student_ids: studentIdsArraySchema, // Custom validation for student_ids Array
});

// // Custom transformation & validation for `student_ids`
// const studentIdsSchema = z.preprocess((val) => {
//     if (typeof val === "string") {
//         try {
//             const parsed = JSON.parse(val);
//             if (Array.isArray(parsed)) return parsed;
//         } catch {
//             throw new z.ZodError([{ code: "custom", message: "Invalid student_ids format. Expected a JSON array.", path: ["student_ids"] }]);
//         }
//     }
//     return val;
// }, z.array(z.string().uuid("Invalid student ID format")).nonempty({ message: "*At least one student ID is required" }));

export const editStudentMaterialFileAccessSchema = z.object({
    material_title: z.string().optional(),

    material_id: z
        .string({ required_error: "*Material ID is required" })
        .uuid("Invalid material ID format"),

    batch_id: z.string().optional(),

    student_ids: studentIdsArraySchema, // Custom validation for student_ids
});