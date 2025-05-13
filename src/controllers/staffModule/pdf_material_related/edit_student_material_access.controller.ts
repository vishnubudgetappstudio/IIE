import { Response, NextFunction } from "express";
import { AppError } from "../../../utils/errorHandler";
import { EditStudentMaterialFileAccessService } from "../../../services/staffModule/pdf_material_related/edit_student_material_access.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { editStudentMaterialFileAccessSchema } from "../../../zodSchema/staff.schema";
import { moveFileInS3 } from "../../../utils/s3";

/**
 * 🎯 Controller to Edit Student Material Access
 */
export const editStudentMaterialAccessController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // ✅ Step 1: Validate User Authentication
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized access", data: {} });
        }

        // ✅ Step 2: Validate Request Body
        const parsedData = editStudentMaterialFileAccessSchema.safeParse(req.body);
        if (!parsedData.success) {
            throw new AppError({
                statusCode: 400,
                message: parsedData.error.errors[0].message, // Get the first error message
                data: {}
            });
        }

        const { material_title, batch_id, student_ids, material_id } = parsedData.data;

        // 🔹 Call Service Layer
        const material_file = req.body.material_file;

        // Check if a new material_file is provided
        let materialFileUrl;
        if (material_file) {
            // Assume a function `uploadToS3` exists to handle S3 uploads
            const destinationKey = `new/path/${material_file}`; // Define the destination key
            materialFileUrl = await moveFileInS3(material_file, destinationKey);
        } else {
            // Use the existing material_file URL
            materialFileUrl = req.body.existing_material_file_url;
        }

        const updatedMaterial = await EditStudentMaterialFileAccessService({
            material_id,
            batchId: batch_id ? batch_id : null,
            studentIds: student_ids.length ? (student_ids as string[]) : [],
            material_title: material_title,
            material_file_url: materialFileUrl,
        });

        // 🔹 Send Response
        res.status(200).json({
            success: true,
            message: "Material file access updated successfully",
            data: updatedMaterial,
        });
    } catch (error) {
        console.error("Error editing student material access:", error);
        next(error); // Pass to global error handler
    }
};
