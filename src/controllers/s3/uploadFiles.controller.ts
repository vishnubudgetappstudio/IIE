import { Request, Response, NextFunction } from "express";
import { uploadImageToS3, uploadFilesToS3 } from "../../services/s3/uploadFiles.service";
import { AppError } from "../../utils/errorHandler";

/**
 * Controller to upload a **single image**
 */
export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            throw new AppError({ statusCode: 400, message: "Image file is required", data: {} });
        }

        const { fileUrl } = await uploadImageToS3(req.file);

        res.status(201).json({
            status: true,
            profileImgUrl: fileUrl,
            message: "Image uploaded successfully",
        });
    } catch (error) {
        console.error("Error in uploadImageController:", error);
        next(error);
    }
};

/**
 * Controller to upload **multiple files**
 */
export const uploadFilesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            throw new AppError({ statusCode: 400, message: "At least one file is required", data: {} });
        }

        const { fileUrls } = await uploadFilesToS3(files);

        res.status(201).json({
            status: true,
            message: "Files uploaded successfully",
            fileUrls,
        });
    } catch (error) {
        console.error("Error in uploadFilesController:", error);
        next(error);
    }
};
