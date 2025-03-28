import { z } from "zod";

export const leaveRequestSchema = z.object({
    leave_type: z.enum(["Sick", "Casual", "Earned", "Unpaid", "Other"], {
        required_error: "*leave_type is required",
        message: "Invalid leave type. Allowed values: Sick, Casual, Earned, Unpaid, Other",
    }),
    leave_mode: z.enum(["Full_Day", "Half_Day"], {
        required_error: "*leave_mode is required",
        message: "Invalid leave mode. Allowed values: Full_Day, Half_Day",
    }),
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
export const csvSchema = z.object({
    "No.": z.string().regex(/^\d+$/, "No. must be a numeric value"),
    "Course Name": z.string().min(1, "Course Name cannot be empty"),
    "Course Id": z.string().min(1, "Course Id cannot be empty"),
    "Topics": z.string().min(1, "Topics cannot be empty"),
    "Description": z.string().min(1, "Description cannot be empty"),
    "Status": z.enum(["completed", "pending"], {
        errorMap: () => ({ message: 'Status must be either "completed" or "pending"' }),
    }),
    "Completed Date": z.string().optional().refine((date) => {
        return !date || /^\d{4}-\d{2}-\d{2}$/.test(date);
    }, { message: "Completed Date must be in YYYY-MM-DD format" }),
});