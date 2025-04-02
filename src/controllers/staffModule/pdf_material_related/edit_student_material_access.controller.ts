import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errorHandler";
import { EditStudentMaterialFileAccessService } from "../../../services/staffModule/pdf_material_related/edit_student_material_access.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

/**
 * 🎯 Controller to Edit Student Material Access
 */
export const editStudentMaterialAccessController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { material_id, batch_id, student_ids } = req.body;

        // 🔹 Validate request data
        if (!material_id || !batch_id || !Array.isArray(student_ids)) {
            throw new AppError({
                statusCode: 400,
                message: "Invalid request data",
            });
        }

        // 🔹 Call Service Layer
        const updatedMaterial = await EditStudentMaterialFileAccessService({
            material_id,
            batchId: batch_id,
            studentIds: student_ids,
            role: req.user?.role,
            userId: req.user?.id,
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
