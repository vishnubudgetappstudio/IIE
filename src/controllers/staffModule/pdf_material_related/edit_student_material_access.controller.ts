import { Response, NextFunction } from "express";
import { AppError } from "../../../utils/errorHandler";
import { EditStudentMaterialFileAccessService } from "../../../services/staffModule/pdf_material_related/edit_student_material_access.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { editStudentMaterialFileAccessSchema } from "../../../zodSchema/staff.schema";
import { PrismaClient } from "@prisma/client";

/**
 * 🎯 Controller to Edit Student Material Access
 */
const prisma = new PrismaClient();
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
            file: file || undefined,
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


export const requestDeleteMaterialFileController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Step 1: Auth Check
        if (!req.user) {
            throw new AppError({ statusCode: 401, message: "Unauthorized", data: {} });
        }

        // Step 2: Validate Input
        const { material_file_id } = req.body;
        if (!material_file_id) {
            throw new AppError({ statusCode: 400, message: "Material file ID is required", data: {} });
        }

        // Step 3: Check if Material Exists
        const material = await prisma.materialFileDetail.findUnique({
            where: { id: material_file_id }
        });

        if (!material) {
            throw new AppError({ statusCode: 404, message: "Material file not found", data: {} });
        }

        // Step 4: Update Delete Request Status
        await prisma.materialFileDetail.update({
            where: { id: material_file_id },
            data: { delete_request: 'Pending' }
        });

        // Step 5: Response
        res.status(200).json({
            status: true,
            message: "Delete request sent successfully",
            data: {
                material_file_id,
                delete_request: "pending"
            }
        });

    } catch (error) {
        console.error("❌ Error in requestDeleteMaterialFileController:", error);
        next(error);
    }
};
