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
    is_xls_file?: boolean
    is_test_file?: boolean
    test_file_type?: 'mock_test' | 'course_test'
    mock_test_mode?: 'easy' | 'medium' | 'hard'
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
    is_xls_file,
    is_test_file,
    test_file_type,
    mock_test_mode,
}: UploadBufferToS3Params): Promise<UploadBufferToS3Response> => {
    // 🚨 File presence validation
    if (!file) {
        throw new AppError({ statusCode: 400, message: "File is required." });
    }

    const { mimetype, originalname } = file;
    const isImage = mimetype.startsWith("image/");
    const fileTypeFolder = FILE_TYPE_FOLDER_MAP[mimetype] || "other-files";

    // ✅ Determine folder path
    let folderPath: string;

    if (isImage) {
        if (!userId) {
            throw new AppError({ statusCode: 400, message: "User ID is required for image uploads." });
        }
        folderPath = `images/${role}/${userId}`;
    } else if (role === "counsellor") {
        if (is_xls_file) {
            if (!userId) {
                throw new AppError({ statusCode: 400, message: "User ID is required for XLS uploads." });
            }
            folderPath = `files/${fileTypeFolder}/counsellor-${userId}`;
        } else {
            if (!batchId) {
                throw new AppError({ statusCode: 400, message: "Batch ID is required for counsellor uploads." });
            }
            folderPath = `files/${fileTypeFolder}/batch-${batchId}`;
        }
    } else {
        // Other roles (e.g., admin/staff/etc.)
        if (is_test_file) {
            if (!batchId || !test_file_type) {
                throw new AppError({
                    statusCode: 400,
                    message: "Batch ID and Test File Type are required for test uploads.",
                });
            }
            if (mock_test_mode) {
                folderPath = `files/${fileTypeFolder}/batch-${batchId}/${test_file_type}/${mock_test_mode}`
            } else {
                folderPath = `files/${fileTypeFolder}/batch-${batchId}/${test_file_type}`;
            }
        } else if (!batchId) {
            if (!userId) {
                throw new AppError({ statusCode: 400, message: "User ID is required for draft uploads." });
            }
            folderPath = `files/${fileTypeFolder}/material-draft/${role}-${userId}`;
        } else {
            folderPath = `files/${fileTypeFolder}/material-published/batch-${batchId}`;
        }
    }

    // 🧠 Construct final S3 key
    const sanitizedName = sanitizeFileName(originalname);
    const fileKey = `${folderPath}/${Date.now()}-${sanitizedName}`;

    try {
        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME!,
                Key: fileKey,
                Body: buffer,
                ContentType: mimetype,
            })
        );

        const s3url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        return {
            s3url,
            fileName: originalname,
        };
    } catch (error) {
        console.error("🚨 S3 Upload Error:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload file to S3" });
    }
};







