import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../utils/errorHandler";
import dotenv from "dotenv";
import sharp from "sharp"; // For image compression

dotenv.config();

// Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Allowed MIME types and folders
const FILE_TYPE_FOLDER_MAP: Record<string, string> = {
    "text/csv": "csv-files",
    "application/vnd.ms-excel": "xls-files",
    "application/pdf": "pdf-files",
};

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880"); // Default: 5MB
const MAX_IMAGE_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || "1080"); // Default: 1080px

const formatFileName = (filename: string): string => {
    return filename.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
};

/**
 * Upload a **single image** to S3 with compression
 * @param file - The uploaded image file
 * @returns {Promise<{ fileUrl: string }>}
 */
export const uploadImageToS3 = async (file: Express.Multer.File): Promise<{ fileUrl: string }> => {
    if (!file) throw new AppError({ statusCode: 400, message: "Image file is required", data: {} });

    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
        throw new AppError({ statusCode: 400, message: "Invalid image type. Only JPEG and PNG allowed.", data: {} });
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new AppError({ statusCode: 400, message: "Image size exceeds limit", data: {} });
    }

    let optimizedBuffer = file.buffer;

    try {
        // Compress image using sharp
        optimizedBuffer = await sharp(file.buffer)
            .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: 80 }) // Adjust quality (80% for balance)
            .toBuffer();
    } catch (error) {
        console.error("Image compression failed:", error);
        throw new AppError({ statusCode: 500, message: "Failed to process image", data: {} });
    }

    const fileKey = `images/${Date.now()}-${formatFileName(file.originalname)}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileKey,
            Body: optimizedBuffer,
            ContentType: file.mimetype,
        });

        await s3.send(command);

        return { fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` };
    } catch (error) {
        console.error("Error uploading image to S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload image", data: {} });
    }
};

/**
 * Upload **multiple non-image files** to S3 (CSV, XLS, PDF)
 * @param files - Array of uploaded files
 * @returns {Promise<{ fileUrls: string[] }>}
 */
export const uploadFilesToS3 = async (files: Express.Multer.File[]): Promise<{ fileUrls: string[] }> => {
    if (!files || files.length === 0) {
        throw new AppError({ statusCode: 400, message: "Files are required", data: {} });
    }

    const invalidFiles = files.filter((file) => IMAGE_MIME_TYPES.includes(file.mimetype));
    if (invalidFiles.length > 0) {
        throw new AppError({ statusCode: 400, message: "Image files are not allowed for this upload.", data: {} });
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
        throw new AppError({ statusCode: 400, message: "One or more files exceed size limit.", data: {} });
    }

    try {
        const uploadPromises = files.map(async (file) => {
            const folder = FILE_TYPE_FOLDER_MAP[file.mimetype] || "other-files";
            return uploadFileToS3(file, folder);
        });

        const fileUrls = await Promise.all(uploadPromises);
        return { fileUrls };
    } catch (error) {
        console.error("Error uploading files to S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload files", data: {} });
    }
};

/**
 * Helper function to upload a file to S3
 * @param file - The uploaded file
 * @param folder - Target folder in S3
 * @returns {Promise<string>} - Returns uploaded file URL
 */
const uploadFileToS3 = async (file: Express.Multer.File, folder: string): Promise<string> => {
    if (!file) throw new AppError({ statusCode: 400, message: "File is required", data: {} });

    if (file.size > MAX_FILE_SIZE) {
        throw new AppError({ statusCode: 400, message: "File size exceeds limit", data: {} });
    }

    const fileKey = `${folder}/${Date.now()}-${formatFileName(file.originalname)}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await s3.send(command);

        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to upload file", data: {} });
    }
};