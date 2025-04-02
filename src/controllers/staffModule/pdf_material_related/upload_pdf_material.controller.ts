import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import * as path from "path";
import { validateFile } from "../../../utils/s3";
import { uploadBufferToS3, uploadFileToS3 } from "../../../services/s3/uploadFiles.service";
import { pdfMaterialFileUploadSchema } from "../../../zodSchema/staff.schema";
import { uploadPDFMaterialFileService } from "../../../services/staffModule/pdf_material_related/upload_pdf_material.service";

export const uploadPDFMaterialFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // ✅ Step 1: Validate User Authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // ✅ Step 2: Validate File Presence
        const file = req.files ? (req.files as Express.Multer.File[])[0] : null;
        if (!file) {
            throw new AppError({ statusCode: 400, message: "File is required", data: {} });
        }

        // ✅ Step 3: Validate Request Body
        const parsedData = pdfMaterialFileUploadSchema.safeParse(req.body);
        if (!parsedData.success) {
            throw new AppError({
                statusCode: 400,
                message: parsedData.error.errors[0].message, // Get the first error message
                data: {}
            });
        }

        const { material_title, batch_id, student_ids } = parsedData.data;

        // ✅ Step 4: Validate File Type
        if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
            throw new AppError({ statusCode: 400, message: "Invalid file type. Only .pdf files are allowed.", data: {} });
        }

        validateFile(file); // Ensure valid file size, type, etc.

        // ✅ Step 5: Save Material File & Assign Students (if applicable)
        const { batchId, material_file_url, material_title: materialTitle, studentIds } =
            await uploadPDFMaterialFileService({
                material_file: file,
                material_title,
                batchId: batch_id,
                studentIds: student_ids.length ? student_ids as string[] : [],
                role: req.user.role,
                userId: req.user.userId
            });

        // ✅ Step 6: Send Response
        res.status(201).json({
            status: true,
            data: {
                batch_id: batchId,
                material_title: materialTitle,
                material_file_url,
                student_ids: studentIds,
            },
            message: batch_id
                ? "PDF Material uploaded and assigned to selected students successfully"
                : "PDF Material uploaded successfully but Access Status is 'Draft'",
        });

    } catch (error) {
        console.error("❌ Error in uploadPDFMaterialFileController:", error);
        next(error);
    }
};
