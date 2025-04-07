import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { xlsFileEditOrDeleteSchema } from "../../zodSchema/counsellor.schema";
import { updateXlsFileNameService } from "../../services/counsellorModule/xls_fileName_update.service";

export const updateXlsFileNameController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Validate user authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
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

        const { fileName: newFileName, xls_file_id } = validatedData.data;

        // Call Service to update the xls file name
        const { responseUpdateXlsFileName } = await updateXlsFileNameService({
            newFileName: newFileName as string,
            xls_file_id: xls_file_id,
            management_staff_id: req.user.id
        });

        res.status(201).json({
            status: true,
            data: responseUpdateXlsFileName,
            message: "XLS file name updated successfully",
        });
    } catch (error) {
        console.error("Error in update xls File name Controller:", error);
        next(error);
    }

}