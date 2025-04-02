import { Request, Response, NextFunction } from "express";
import { uploadBufferToS3, uploadFileToS3, } from "../../services/s3/uploadFiles.service";
import { AppError } from "../../utils/errorHandler";
import { compressImage, validateFile } from "../../utils/s3";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { CommonUserRole } from "@prisma/client";

/**
 * Controller to upload a **single image**
 */
export const uploadImageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const imageFile = req.files ? (req.files as Express.Multer.File[])[0] : null;

        if (!imageFile) {
            throw new AppError({ statusCode: 400, message: "Image file is required", data: {} });
        }

        validateFile(imageFile, true);

        const optimizedBuffer = await compressImage(imageFile);

        const { s3url } = await uploadBufferToS3({
            buffer: optimizedBuffer,
            file: imageFile,
            userId: req.user?.userId,
        });

        res.status(201).json({
            status: true,
            profileImgUrl: s3url,
            message: "Image uploaded successfully",
        });
    } catch (error) {
        console.error("Error in uploadImageController:", error);
        next(error);
    }
};

/**
 * Controller to upload **single file**
 */
export const uploadSingleFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const file = req.files ? (req.files as Express.Multer.File[])[0] : null;

        if (!file) {
            throw new AppError({ statusCode: 400, message: "file is required", data: {} });
        }

        validateFile(file);

        const { fileUrl } = await uploadFileToS3({
            file: file,
            batchId: req.query.batchId as string,
            role: req.query.role as CommonUserRole,
            userId: req.user?.userId
        });

        res.status(201).json({
            status: true,
            message: "Files uploaded successfully",
            fileUrl,
        });
    } catch (error) {
        console.error("Error in uploadFilesController:", error);
        next(error);
    }
};

/**
 * Controller to upload **multiple files**
 */
// export const uploadMultipleFilesController = async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//         const files = req.files as Express.Multer.File[];

//         if (!files || files.length === 0) {
//             throw new AppError({ statusCode: 400, message: "At least one file is required", data: {} });
//         }

//         files.forEach((file) => validateFile(file));

//         const fileUrls = await Promise.all(files.map((file) => uploadFileToS3({ file: file, userId: req.user?.userId })));

//         res.status(201).json({
//             status: true,
//             message: "Files uploaded successfully",
//             fileUrls,
//         });
//     } catch (error) {
//         console.error("Error in uploadFilesController:", error);
//         next(error);
//     }
// };
