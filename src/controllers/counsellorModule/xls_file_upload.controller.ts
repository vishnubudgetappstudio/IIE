import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { validateFile } from "../../utils/s3";
import * as path from "path";
import { xlsFileUploadSchema } from "../../zodSchema/counsellor.schema";
import { uploadXlsFileService } from "../../services/counsellorModule/xls_file_upload.service";
import { uploadXLSFileToS3 } from "../../services/s3/uploadFiles.service";
import { CommonUserRole } from "@prisma/client";

export const uploadXlsFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        const file = req.files ? (req.files as Express.Multer.File[])[0] : null;

        if (!file) {
            throw new AppError({ statusCode: 400, message: "file is required", data: {} });
        }

        // Validate Request Body
        const validatedData = xlsFileUploadSchema.safeParse(req.body);

        if (!validatedData.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validatedData.error.errors[0].message, // Get first error message
            });
        }

        const { fileName } = validatedData.data;

        // Validate file extension
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (![".xlsx", ".xls"].includes(fileExtension)) {
            throw new AppError({ statusCode: 400, message: "Invalid file type. Only .xlsx and .xls files are allowed.", data: {} });
        }

        validateFile(file);

        const { fileUrl } = await uploadXLSFileToS3({ file: file, role: req.user?.role as CommonUserRole });

        // Call Service to upload the xls file
        const { responseUploadXlsFile } = await uploadXlsFileService({
            fileName: fileName,
            fileUrl: fileUrl,
            management_staff_id: req.user?.userId,
        });

        res.status(201).json({
            status: true,
            data: responseUploadXlsFile,
            message: "XLS file uploaded successfully",
        });
    } catch (error) {
        console.error("Error in upload xls File Controller:", error);
        next(error);
    }

}