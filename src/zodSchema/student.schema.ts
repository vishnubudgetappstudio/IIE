import { z } from "zod";

export const studentIdSchema = z.string({ required_error: "*student Id required" }).uuid({ message: "Invalid Student ID format" });

export const submitTestSchema = z.object({
    test_id: z.string().uuid(),
    test_type: z.enum(["course_test", "mock_test"]),
    total_questions_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
    total_correct_answers_count: z.string().regex(/^\d+$/, "Must be a numeric string"),
});