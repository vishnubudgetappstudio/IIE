import { z } from "zod";

export const leaveRequestSchema = z.object({
    leave_type: z.enum(["Sick", "Casual", "Earned", "Unpaid", "Other"], {
        required_error: "*leave_type is required",
        message: "Invalid leave type. Allowed values: Sick, Casual, Earned, Unpaid, Other",
    }),
    leave_mode: z.enum(["Full_Day", "Half_Day"], {
        required_error: "*leave_mode is required",
        message: "Invalid leave mode. Allowed values: Full_Day, Half_Day",
    }).optional(),
    from_date: z
        .string({ required_error: "*from_date is required" })
        .min(1, "From date is required"),
    to_date: z
        .string({ required_error: "*to_date is required" })
        .min(1, "To date is required"),
    reason: z
        .string({ required_error: "*reason is required" })
        .min(1, "Reason is required"),
});


export const roleSchema = z.enum(["staff", "counsellor", "student", "admin", "guest"], { required_error: "*role is required" }).refine(
    (role) => ["staff", "counsellor", "student", "admin", "guest"].includes(role),
    { message: "Role must be one of: staff, counsellor, student, admin, guest" }    
);

/**
 * Define the validation schema using Zod
 */
export const csvSessionSheetSchema = z.object({
    "No.": z.string().regex(/^\d+$/, "No. must be a numeric value"),
    "Course Name": z.string().min(1, "Course Name cannot be empty"),
    "Course Id": z.string().min(1, "Course Id cannot be empty"),
    "Topics": z.string().min(1, "Topics cannot be empty"),
    "Description": z.string().min(1, "Description cannot be empty"),
    "Status": z.enum(["completed", "pending", "Completed", "Pending"], {
        errorMap: () => ({ message: 'Status must be either "completed" or "pending"' }),
    }),
    "Completed Date": z.string().optional().refine((date) => {
        return !date || /^\d{4}-\d{2}-\d{2}$/.test(date);
    }, { message: "Completed Date must be in YYYY-MM-DD format" }),
});

/**
 * Define the validation schema using Zod
 */
export const csvTestCourseOrMockSchema = z.object({
    "No.": z.string().regex(/^\d+$/, "No. must be a numeric value"),
    "Question": z.string({ required_error: "*Question is required" }).min(1, "Question is required"),
    "Option_1": z.string({ required_error: "*Option_1 is required" }).min(1, "Option_1 are required"),
    "Option_2": z.string({ required_error: "*Option_2 is required" }).min(1, "Option_2 are required"),
    "Option_3": z.string().optional(),
    "Option_4": z.string().optional(),
    "Explanation": z.string({ required_error: "*Explanation is required" }).optional(),
    "Correct Answer": z.string({ required_error: "*Correct Answer is required" }).min(1, "Correct Answer is required"),
});