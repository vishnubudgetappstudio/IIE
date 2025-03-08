import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { addStudentsToBatchService, createNewBatchService, removeStudentsFromBatchService } from "../../services/counsellor/batch.service";
import { AppError } from "../../utils/errorHandler";

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

// Define Schema for Batch and Multiple Student IDs
const addStudentsToBatchSchema = z.object({
  batch_id: z.string().uuid("Invalid Batch ID format"),
  student_ids: z.array(z.string().uuid("Invalid Student ID format")).min(1, "At least one student ID is required"),
});

const removeStudentsFromBatchSchema = z.object({
  batch_id: z.string().uuid("Invalid Batch ID format"),
  student_ids: z.array(z.string().uuid("Invalid Student ID format")).nonempty("Student IDs are required"),
});

export const createNewBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      throw new AppError({ statusCode: 401, data: {}, message: "Unauthorized access" });
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
    next(error);
  }
};


export const addStudentsToBatchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body
    const validatedData = addStudentsToBatchSchema.safeParse(req.body);

    if (!validatedData.success) {
      throw new AppError({
        statusCode: 400,
        data: {},
        message: validatedData.error.errors[0].message, // Get first error message
      });
    }

    const { batch_id, student_ids } = validatedData.data;

    // Call Service Function to Add Students
    const { addedStudents } = await addStudentsToBatchService(batch_id, student_ids);

    res.status(201).json({
      status: true,
      data: addedStudents,
      message: `${addedStudents?.length} students added successfully`,
    });
  } catch (error: any) {
    console.error("Error Adding Students to Batch:", error);
    next(error);
  }
};

export const removeStudentsFromBatchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate Request Body
    const validatedData = removeStudentsFromBatchSchema.safeParse(req.body);

    if (!validatedData.success) {
      const firstErrorMessage = validatedData.error.errors[0].message; // Get first error message
      throw new AppError({ statusCode: 400, data: {}, message: firstErrorMessage });
    }

    const { batch_id, student_ids } = validatedData.data;

    const { removedStudents } = await removeStudentsFromBatchService(batch_id, student_ids);

    res.status(200).json({
      status: true,
      data: removedStudents,
      message: `${removedStudents?.length} Students removed successfully`
    });
  } catch (error: any) {
    console.error("Error Removing Students From Batch:", error);
    next(error);
  }
};
