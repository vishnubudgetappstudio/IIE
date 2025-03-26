import { z } from "zod";

export const attendanceSchema = z.object({
    batchId: z.string().min(1, "Batch ID is required"),
    studentId: z.string().min(1, "Student ID is required"),
    isPresent: z.boolean(),
});