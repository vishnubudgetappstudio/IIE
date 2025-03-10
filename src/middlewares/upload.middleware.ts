import multer from "multer";
import { AppError } from "../utils/errorHandler"; // Ensure correct import path
import { Request } from "express";

// Allowed MIME types
const allowedMimeTypes = new Set([
    "text/csv",
    "application/vnd.ms-excel",
    "application/pdf",
    "image/jpeg",
    "image/png",
]);

// Multer Configuration
const storage = multer.memoryStorage();


const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
        return cb(new AppError({
            statusCode: 400,
            message: "Invalid file type. Allowed types: CSV, XLS, PDF, JPEG, PNG",
            data: {},
        }));
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter,
});
