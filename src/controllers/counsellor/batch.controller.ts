import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { z } from "zod";
import { 
  addStudentsToBatchService, 
  createNewBatchService, 
  getAllBatchesService, 
  getBatchStudentsService, 
  removeStudentsFromBatchService 
} from "../../services/counsellor/batch.service";
import { AppError } from "../../utils/errorHandler";
import { BatchSlotsType } from "@prisma/client";

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
  session_sheet_url: z.string().optional(), // Validates as a URL string
  session_sheet: z.record(z.string(), z.any()).optional(), // Validates as a JSON object
  slot: z.enum(["morning", "evening"], {
    message: "Slot must be 'morning' or 'evening'",
  }), // Fixed Enum Validation
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

// Define a validation schema for batchId
const batchIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

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
      session_sheet_url,
      session_sheet,
      students_id,
    } = validatePayload;

    //call create new batch service
    const response = await createNewBatchService(
      batch_number,
      from_date,
      to_date,
      course,
      session_sheet_url as string,
      session_sheet as {},
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

export const getAllBatchesListController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const slot = req.query.slot as BatchSlotsType || 'all';

    // Fetch batches from service
    const { batches, total } = await getAllBatchesService(page, limit, slot);

    res.status(200).json({
      status: true,
      data: batches,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      message: "Batch list get Successfully",
    });

    return;
  } catch (error) {
    console.error("Error fetching data:", error);
    next(error);
  }
};



export const getBatchStudentsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = (req.query.search as string) || undefined; // Extract search query
    const batchId = (req.query.batch_id as string);

    if (page < 1 || limit < 1) {
      throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: {} });
    }

    // Validate batchId
    const validatedBatchId = batchIdSchema.safeParse(batchId);

    if (!validatedBatchId?.success) {
      const firstErrorMessage = validatedBatchId.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: [], // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    // Fetch batch and students with optional search
    const { students, currentPage, totalPages, perPage, totalStudents } = await getBatchStudentsService(
      batchId,
      page,
      limit,
      searchQuery
    );

    // If no students are found, return 404
    if (!students.length) {
      throw new AppError({ statusCode: 404, message: "Batch Students not found", data: [] });
    }

    // Return the batch details with student list
    res.status(200).json({
      status: true,
      data: students,
      page: currentPage,
      limit: perPage,
      totalPages,
      totalStudents,
      message: "Batch Students fetched successfully",
    });
    return;
  } catch (error: any) {
    console.error("Error fetching batch students:", error);
    next(error);
  }
};