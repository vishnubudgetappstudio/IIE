import { z } from "zod";

export const attendanceSchema = z.object({
    batchId: z.string().min(1, "Batch ID is required"),
    studentId: z.string().min(1, "Student ID is required"),
isPresent: z.coerce.boolean().optional(),

});
// export const markStudentAttendanceSchema = z.object({
//   batchId: z.string().uuid(),
//   studentId: z.string().uuid(),
//   isPresent: z.boolean(),
// });

export const markBatchAttendanceFlagSchema = z.object({
  batchId: z.string().uuid(),
  isMarked: z.boolean(),
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

    batch_id: z.string().optional().nullable(),

    student_ids: studentIdsArraySchema.optional().nullable(),
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

// 🟢 Question Schema
export const editStudentMaterialFileAccessSchema = z.object({
    material_title: z.string().optional(),

    material_id: z
        .string({ required_error: "*Material ID is required" })
        .uuid("Invalid material ID format"),

    batch_id: z.string().optional(),

    // student_ids: studentIdsArraySchema, // Custom validation for student_ids
});

export const questionObjectSchema = z.object({
    question: z
        .string({ required_error: "*question is required" })
        .min(1, "Question is required"),
    options: z
        .array(z.string({ required_error: "*option is required" }))
        .min(1, "Options are required"),
    explanation: z.string({ required_error: "*explanation is required" }).optional(),
    correctAnswer: z
        .string({ required_error: "*correct answer is required" })
        .min(1, "Correct answer is required"),
});

// 🟢 Course Test Schema
export const createCourseTestSchema = z.object({
    // batch_id: z.string({ required_error: "*Batch ID is required" }).min(1),
    test_title: z.string({ required_error: "*Test title is required" }).min(1),
    test_description: z.string({ required_error: "*Test description is required" }).min(1),
    start_date: z
        .string()
        .regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
            message: "Invalid date format (DD/MM/YYYY required)",
        }),
    end_date: z
        .string()
        .regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
            message: "Invalid date format (DD/MM/YYYY required)",
        }),
    timer: z
        .string()
        .min(1, "Timer is required")
        .refine(
            (val) => {
                const parts = val.split(":");
                if (parts.length !== 2) return false;
                const [hours, minutes] = parts.map(Number);
                return (
                    !isNaN(hours) &&
                    !isNaN(minutes) &&
                    hours >= 0 &&
                    hours < 24 &&
                    minutes >= 0 &&
                    minutes < 60
                );
            },
            {
                message: "Timer must be a valid HH:MM format (e.g., 1:30, 00:45)",
            }
        ),
    questions: z.array(questionObjectSchema).optional(),
});

export const createMockTestSchema = z.object({
    // batch_id: z.string({ required_error: "*Batch ID is required" }).uuid({ message: "Invalid Batch ID format" }),
    test_mode: z
        .enum(["easy", "medium", "hard"], {
            invalid_type_error: "Test mode must be one of: easy, medium, hard",
        }),
    questions: z.array(questionObjectSchema).optional(),
});
