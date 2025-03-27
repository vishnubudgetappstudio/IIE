import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../utils/errorHandler";
import dotenv from "dotenv";
import { sanitizeFileName } from "../../utils/s3";

dotenv.config();

// Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

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
export const uploadFileToS3 = async ({ file, batchId }: { file: Express.Multer.File, batchId: string }): Promise<{ fileUrl: string }> => {
    if (!batchId) {
        throw new Error("Batch ID is required to store the file in S3.");
    }

    const { s3url } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        batchId: batchId,
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
    batchId
}: {
    buffer: Buffer,
    file: Express.Multer.File,
    userId?: string,
    batchId?: string
}): Promise<{ s3url: string }> => {
    if (!userId && !batchId) {
        throw new Error("Either userId or batchId is required for uploading.");
    }

    // ✅ Check if the file is an image
    const isImage = file.mimetype.startsWith("image/");

    // ✅ Define folder structure
    let folder: string;
    if (isImage) {
        if (!userId) throw new Error("User ID is required for image uploads.");
        folder = `images/${userId}`;
    } else {
        if (!batchId) throw new Error("Batch ID is required for file uploads.");
        const fileTypeFolder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";
        folder = `files/${batchId}/${fileTypeFolder}`;
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

        return { s3url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` };
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload file" });
    }
};






