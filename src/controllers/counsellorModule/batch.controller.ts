import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  addStudentsToBatchService,
  createNewBatchService,
  getAllBatchesService,
  getBatchStudentsService,
  removeStudentsFromBatchService
} from "../../services/counsellorModule/batch.service";
import { AppError } from "../../utils/errorHandler";
import { BatchSlotsType } from "@prisma/client";
import { addStudentsToBatchSchema, batchIdSchema, createNewBatchSchema, removeStudentsFromBatchSchema } from "../../zodSchema/counsellor.schema";
import { validateFile } from "../../utils/s3";
import { uploadFileToS3 } from "../../services/s3/uploadFiles.service";



export const createNewBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate user authentication
    if (!req.user) {
      throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
    }

    // Validate that a single file is uploaded
    // ✅ Retrieve file (If single file upload)
    const sessionSheetFile = req.files ? (req.files as Express.Multer.File[])[0] : null;

    console.log({ sessionSheetFile })

    if (!sessionSheetFile) {
      throw new AppError({ statusCode: 400, message: "CSV file is required", data: {} });
    }

    // Validate file type (must be .csv)
    if (!sessionSheetFile.mimetype.includes("csv")) {
      throw new AppError({ statusCode: 400, message: "Only CSV files are allowed", data: {} });
    }

    if (!sessionSheetFile) {
      throw new AppError({ statusCode: 400, message: "file is required", data: {} });
    }

    validateFile(sessionSheetFile);

    // Validate Request Body
    const validatedData = createNewBatchSchema.parse(req.body);

    // Call Service to Create New Batch
    const response = await createNewBatchService({
      ...validatedData,
      sessionSheetFile: sessionSheetFile, // Attach uploaded file URL
      students_id: validatedData.students_id!,
    });

    // Send Success Response
    res.status(201).json({
      status: true,
      ...response,
      message: "Batch created successfully with CSV file",
    });
  } catch (error) {
    console.error("❌ Error Creating Batch:", error);
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