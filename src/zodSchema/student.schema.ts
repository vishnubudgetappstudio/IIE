import { z } from "zod";

export const studentIdSchema = z.string({ required_error: "*student Id required" }).uuid({ message: "Invalid Student ID format" });