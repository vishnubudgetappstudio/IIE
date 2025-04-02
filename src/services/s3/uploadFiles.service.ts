import { PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../utils/errorHandler";
import dotenv from "dotenv";
import { sanitizeFileName } from "../../utils/s3";
import s3 from "../../config/s3Config";
import { CommonUserRole } from "@prisma/client";

dotenv.config();

interface UploadBufferToS3Params {
    buffer: Buffer;
    file: Express.Multer.File;
    userId?: string;
    batchId?: string;
    role?: CommonUserRole;
}

interface UploadBufferToS3Response {
    s3url: string;
    fileName?: string;
}

/** Constants */
export const FILE_TYPE_FOLDER_MAP: Record<string, string> = {
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
export const uploadFileToS3 = async ({
    file, batchId, role, userId
}: {
    file: Express.Multer.File,
    batchId: string,
    role: CommonUserRole,
    userId: string
}): Promise<{ fileUrl: string, fileName: string }> => {
    if (!batchId) {
        throw new Error("Batch ID is required to store the file in S3.");
    }

    const { s3url, fileName } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        batchId: batchId,
        role: role,
        userId: userId
    });

    return { fileUrl: s3url, fileName: fileName! };
};

export const uploadXLSFileToS3 = async ({
    file, role, userId
}:
    {
        file: Express.Multer.File,
        role: CommonUserRole,
        userId: string
    }): Promise<{ fileUrl: string }> => {
    if (role !== 'counsellor') {
        throw new Error("Counsellor role is required to store the xls file in S3.");
    }

    const { s3url } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        role: role,
        userId: userId
    });

    return { fileUrl: s3url };
};

/**
 * Uploads a buffer (file content) to S3
 * @param buffer - File buffer content
 * @param file - Original file metadata
 * @param folder - Target S3 folder
 * @returns {Promise<UploadBufferToS3Response>}
 */
/**
 * ✅ Uploads a buffer (file content) to S3 with a structured folder hierarchy.
 */
export const uploadBufferToS3 = async ({
    buffer,
    file,
    userId,
    batchId,
    role,
}: UploadBufferToS3Params): Promise<UploadBufferToS3Response> => {

    if (!file) {
        throw new AppError({ statusCode: 400, message: "File is required." });
    }

    const isImage = file.mimetype.startsWith("image/");
    const isCounsellorUploadXLS = role === "counsellor";

    // ✅ Determine Folder Path
    let folder = "";

    if (isImage) {
        if (!userId) throw new AppError({ statusCode: 400, message: "User ID is required for image uploads." });
        folder = `images/${userId}`;
    } else if (isCounsellorUploadXLS) {
        const fileTypeFolder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";
        folder = `files/${fileTypeFolder}/batch-${batchId}`;
    } else {
        const fileTypeFolder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";

        if (!batchId) {
            folder = `files/${fileTypeFolder}/material-draft/${role}-${userId}`;
        } else {
            folder = `files/${fileTypeFolder}/material-published/batch-${batchId}`;
        }
    }

    // ✅ Construct the S3 file key
    const fileKey = `${folder}/${Date.now()}-${sanitizeFileName(file.originalname)}`;

    try {
        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: fileKey,
                Body: buffer,
                ContentType: file.mimetype,
            })
        );

        return {
            s3url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
            fileName: file.originalname,
        };
    } catch (error) {
        console.error("🚨 S3 Upload Error:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload file to S3" });
    }
};






