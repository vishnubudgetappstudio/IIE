import { Response, NextFunction } from "express";
import { AppError } from "../../../utils/errorHandler";
import { EditStudentMaterialFileAccessService } from "../../../services/staffModule/pdf_material_related/edit_student_material_access.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { editStudentMaterialFileAccessSchema } from "../../../zodSchema/staff.schema";

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

        const { material_title, batch_id, material_id } = parsedData.data;

        const student_ids = req.body.student_ids || [];

        const file = req.files ? (req.files as Express.Multer.File[])[0] : null;

        // 🔹 Call Service Layer
        const updatedMaterial = await EditStudentMaterialFileAccessService({
            material_id,
            batchId: batch_id ? batch_id : null,
            studentIds: student_ids.length ? student_ids as string[] : [],
            material_title: material_title,
            material_file: file || undefined,
        });

        // 🔹 Send Response
        res.status(200).json({
            status: true,
            message: "Material file access updated successfully",
            data: updatedMaterial,
        });
    } catch (error) {
        console.error("Error editing student material access:", error);
        next(error); // Pass to global error handler
    }
};
