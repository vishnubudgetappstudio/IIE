import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import * as path from "path";
import { validateFile } from "../../../utils/s3";
import { uploadFileToS3 } from "../../../services/s3/uploadFiles.service";
import { pdfMaterialFileUploadSchema } from "../../../zodSchema/staff.schema";
import { uploadPDFMaterialFileService } from "../../../services/staffModule/pdf_material_related/upload_pdf_material.service";

export const uploadPDFMaterialFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        const validatedData = pdfMaterialFileUploadSchema.safeParse(req.body);

        console.log(req.body);

        if (!validatedData.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validatedData.error.errors[0].message, // Get first error message
            });
        }

        const { material_title, batch_id, student_ids } = validatedData.data;

        // Validate file extension
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (![".pdf"].includes(fileExtension)) {
            throw new AppError({ statusCode: 400, message: "Invalid file type. Only .pdf files are allowed.", data: {} });
        }

        validateFile(file);

        const { fileUrl } = await uploadFileToS3({ file: file, batchId: batch_id });

        const { batchId, material_file_url, material_title: materialTitle, studentIds } = await uploadPDFMaterialFileService({
            material_file_url: fileUrl,
            material_title: material_title,
            batchId: batch_id,
            studentIds: student_ids
        });

        res.status(201).json({
            status: true,
            data: {
                batch_id: batchId,
                material_title: materialTitle,
                material_file_url: material_file_url,
                student_ids: studentIds,
            },
            message: "PDF Material uploaded and assigned to selected students successfully",
        });

    } catch (error) {
        console.error("Error in upload Material PDF File Controller:", error);
        next(error);
    }

}