import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { xlsFileEditOrDeleteSchema} from "../../zodSchema/counsellor.schema";
import { updateXlsFileNameService } from "../../services/counsellorModule/xls_fileName_update.service";

export const deleteXlsFileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        if (!req.query.xls_file_id) {
            throw new AppError({ statusCode: 400, message: "xls_file_id is required", data: {} });
        }

        // Validate Request Body
        const validatedData = xlsFileEditOrDeleteSchema.safeParse(req.body);

        if (!validatedData.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validatedData.error.errors[0].message, // Get first error message
            });
        }

        const { fileName: newFileName } = validatedData.data;


        res.status(201).json({
            status: true,
            data: {},
            message: "XLS file name updated successfully",
        });
    } catch (error) {
        console.error("Error in update xls File name Controller:", error);
        next(error);
    }

}