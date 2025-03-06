import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { createNewBatchService } from "../../services/counsellor/batch.service";

const createNewBatchSchema = z.object({
  batch_number: z
    .string()
    .min(2, { message: "Batch number must be at least 2 characters long" }),
  from_date: z.string().regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: "Invalid date format (DD/MM/YYYY required)",
  }),
  to_date: z.string().regex(/^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: "Invalid date format (DD/MM/YYYY required)",
  }),
  course: z
    .string()
    .min(3, { message: "Course name must be at least 3 characters long" }),
  session_sheet: z.string().optional(),
  slot: z.enum(["morning", "evening"], {
    message: "Slot must be 'morning' or 'evening'",
  }), // ✅ Fixed Enum Validation
  mentor_id: z
    .string()
    .uuid({ message: "Invalid mentor ID format (must be a UUID)" }),
  students_id: z.string().optional(),
});

export const createNewBatch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    // Validate Request Body
    const validatePayload = createNewBatchSchema.parse(req.body);

    // Extract data from request body
    const {
      batch_number,
      course,
      from_date,
      mentor_id,
      to_date,
      slot,
      session_sheet,
      students_id,
    } = validatePayload;

    //call create new batch service
    const response = await createNewBatchService(
      batch_number,
      from_date,
      to_date,
      course,
      session_sheet!,
      slot,
      mentor_id,
      students_id!
    );

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "Create New Student successfully",
    });

    return;
  } catch (error) {
    console.error("Error Creating Batch:", error);
    res.status(400).json({
      status: false,
      data: {},
      // message: "Error Creating Batch",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
