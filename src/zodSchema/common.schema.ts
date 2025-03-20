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
