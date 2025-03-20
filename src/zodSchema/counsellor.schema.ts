import { z } from "zod";

export const managementStaffIdSchema = z.string({required_error: "*counsellor Id required"}).uuid({ message: "Invalid Counsellor ID format" });