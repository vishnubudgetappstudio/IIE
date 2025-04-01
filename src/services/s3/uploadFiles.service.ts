import { PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../utils/errorHandler";
import dotenv from "dotenv";
import { sanitizeFileName } from "../../utils/s3";
import s3 from "../../config/s3Config";
import { CommonUserRole } from "@prisma/client";

dotenv.config();

/** Constants */
const FILE_TYPE_FOLDER_MAP: Record<string, string> = {
    "text/csv": "csv-files",
    "application/vnd.ms-excel": "excel-files",
    "application/pdf": "pdf-files",
    "image/jpeg": "images",
    "image/png": "images",
};

/**
 * Helper function to upload a single file to S3
 * @param file - The uploaded file
 * @returns {Promise<string>} - Uploaded file URL
 */
export const uploadFileToS3 = async ({ file, batchId }: { file: Express.Multer.File, batchId: string }): Promise<{ fileUrl: string, fileName: string }> => {
    if (!batchId) {
        throw new Error("Batch ID is required to store the file in S3.");
    }

    const { s3url, fileName } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        batchId: batchId,
    });

    return { fileUrl: s3url, fileName: fileName! };
};

export const uploadXLSFileToS3 = async ({ file, role }: { file: Express.Multer.File, role: CommonUserRole }): Promise<{ fileUrl: string }> => {
    if (role !== 'counsellor') {
        throw new Error("Counsellor role is required to store the xls file in S3.");
    }

    const { s3url } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        role: role,
    });

    return { fileUrl: s3url };
};

/**
 * Uploads a buffer (file content) to S3
 * @param buffer - File buffer content
 * @param file - Original file metadata
 * @param folder - Target S3 folder
 * @returns {Promise<string>}
 */
export const uploadBufferToS3 = async ({
    buffer,
    file,
    userId,
    batchId,
    role,
}: {
    buffer: Buffer,
    file: Express.Multer.File,
    userId?: string,
    batchId?: string,
    role?: CommonUserRole
}): Promise<{ s3url: string, fileName?: string }> => {

    // ✅ Check if the file is an image
    const isImage = file.mimetype.startsWith("image/");

    // ✅ Check if the Counsellor Upload XLS file 
    const isCounsellorUploadXLS = role === 'counsellor';

    // ✅ Define folder structure
    let folder: string;
    if (isImage) {
        if (!userId) throw new AppError({ statusCode: 400, message: "User ID is required for image uploads.", data: {} });
        folder = `images/${userId}`;
    } else {
        if (!isCounsellorUploadXLS) {
            if (!batchId) throw new AppError({ statusCode: 400, message: "Batch ID is required for file uploads.", data: {} });
            const fileTypeFolder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";
            folder = `files/${batchId}/${fileTypeFolder}`;
        } else {
            const fileTypeFolder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";
            folder = `files/${role}/${fileTypeFolder}`;
        }
    }

    // ✅ Construct the S3 file key (path)
    const fileKey = `${folder}/${Date.now()}-${sanitizeFileName(file.originalname)}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileKey,
            Body: buffer,
            ContentType: file.mimetype,
        });

        await s3.send(command);

        return {
            s3url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
            fileName: file.originalname
        };
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload file", data: {} });
    }
};






