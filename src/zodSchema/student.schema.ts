import { z } from "zod";

export const studentIdSchema = z.string({ required_error: "*student Id required" }).uuid({ message: "Invalid Student ID format" });

// export const submitTestSchema = z.object({
//     test_id: z.string().uuid(),
//     test_type: z.enum(["course_test", "mock_test"]),
//     total_questions_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
//     total_correct_answers_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
// });

export const submitTestSchema = z
  .object({
    test_id: z.string().optional(), // optional by default
    test_type: z.enum(["course_test", "mock_test"]),
    total_questions_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
    total_correct_answers_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
  })
  .superRefine((data, ctx) => {
    if (data.test_type === "course_test") {
      if (!data.test_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "test_id is required for course_test",
          path: ["test_id"],
        });
      } else if (!z.string().uuid().safeParse(data.test_id).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "test_id must be a valid UUID",
          path: ["test_id"],
        });
      }
    }
  });
