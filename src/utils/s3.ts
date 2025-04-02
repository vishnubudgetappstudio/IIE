import { HeadObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3Config";
import { AppError } from "./errorHandler";
import sharp from "sharp"; // For image compression
import { formatFileSize } from "./commonUtils";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
const FILE_MIME_TYPES = ["text/csv", "application/vnd.ms-excel", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1080; // Max width for images


/**
 * Validate file type and size
 * @param file - The uploaded file
 * @param isImage - Whether the file is an image (default: false)
 */
export const validateFile = (file: Express.Multer.File, isImage: boolean = false): void => {
    const allowedTypes = isImage ? IMAGE_MIME_TYPES : FILE_MIME_TYPES;

    if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError({ statusCode: 400, message: `Invalid file type: ${file.mimetype}` });
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new AppError({ statusCode: 400, message: `File ${file.originalname} exceeds 5MB size limit.` });
    }
};

/**
 * Compress an image using sharp
 * @param file - The uploaded image file
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
export const compressImage = async (file: Express.Multer.File): Promise<Buffer> => {
    try {
        return await sharp(file.buffer)
            .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: 80 }) // Adjust quality (80% for balance)
            .toBuffer();
    } catch (error) {
        console.error("Image compression failed:", error);
        throw new AppError({ statusCode: 500, message: "Failed to process image" });
    }
};

/**
 * Sanitize file name (remove spaces & special chars)
 * @param filename - Original file name
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (filename: string): string => {
    return filename.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
};

/**
 * ✅ Extracts S3 Bucket and Key from file URL.
 */
export const extractS3BucketAndKeySize = async ({ fileUrl }: { fileUrl: string }): Promise<{ Bucket: string; Key: string; FileSize: string }> => {
    const match = fileUrl.match(/https:\/\/(.+?)\.s3\.(.+?)\.amazonaws\.com\/(.+)/);
    if (!match) {
        throw new AppError({ statusCode: 400, message: "Invalid S3 URL format." });
    }
    const Bucket = match[1];
    const Key = match[3];

    try {
        // ✅ Fetch file metadata (head request) to get size
        const response = await s3.send(new HeadObjectCommand({ Bucket, Key }));

        if (!response.ContentLength) {
            throw new AppError({ statusCode: 404, message: "File not found or size unavailable." });
        }

        const fileSize = formatFileSize(response.ContentLength); // Convert to KB/MB

        return { Bucket, Key, FileSize: fileSize };
    } catch (error) {
        console.error("❌ Error fetching S3 file size:", error);
        throw new AppError({ statusCode: 500, message: "Failed to retrieve file size." });
    }
};


/**
 * Moves a file from one S3 location to another
 * @param sourceKey - Existing file path in S3
 * @param destinationKey - New file path in S3
 * @returns New S3 URL
 */
export const moveFileInS3 = async (sourceKey: string, destinationKey: string): Promise<string> => {
    try {
        const bucketName = process.env.AWS_BUCKET_NAME!;

        // ✅ Step 1: Copy the file to the new location
        await s3.send(new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destinationKey,
        }));

        // ✅ Step 2: Delete the old file
        await s3.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: sourceKey,
        }));

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinationKey}`;
    } catch (error) {
        console.error("❌ Error moving file in S3:", error);
        throw new AppError({ statusCode: 500, message: "Failed to move file in S3", data: {} });
    }
};