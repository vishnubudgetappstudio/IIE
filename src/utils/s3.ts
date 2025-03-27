import { AppError } from "./errorHandler";
import sharp from "sharp"; // For image compression

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