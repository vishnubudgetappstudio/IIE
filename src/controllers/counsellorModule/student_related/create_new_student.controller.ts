import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { createNewStudentSchema } from "../../../zodSchema/counsellor.schema";
import { AppError } from "../../../utils/errorHandler";
import { createNewStudentService } from "../../../services/counsellorModule/student_related/create_new_student.service";

export const createNewStudentController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Validate user authentication
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }

        const { userId, name: counsellor_name } = req.user;

        // Validate Request Body (based on schema)
        const validatePayload = createNewStudentSchema.safeParse(req.body);

        if (!validatePayload?.success) {
            const firstErrorMessage = validatePayload.error.errors[0].message; // Get first error message

            throw new AppError({
                statusCode: 400,
                data: {}, // Always send an empty object
                message: firstErrorMessage, // Set message from Zod error
            });
        }

        // Extract data from request body
        const { name, email, roll_number, course_name, course_id, phone_number, alt_phone, preferred_batch, branch } = req.body;

        //call create student service
        const response = await createNewStudentService({
            name: name,
            course_name: course_name,
            course_id: course_id,
            email: email,
            roll_number: roll_number,
            phone: phone_number,
            branch: branch,
            alt_phone: alt_phone,
            counsellor_id: userId,
            counsellor_name: counsellor_name,
            preferred_batch: preferred_batch,
        });

        // Send Success Response
        res.status(200).json({
            status: true,
            ...response,
            message: "Create New Student successfully",
        });
    } catch (error: any) {
        console.error("Error Create New Student:", error);
        next(error);
    }
};