import { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { Response, NextFunction } from "express"
import { studentIdSchema } from "../../zodSchema/student.schema";
import { AppError } from "../../utils/errorHandler";
import { roleSchema } from "../../zodSchema/common.schema";
import { studentHomeScreenService } from "../../services/studentModule/homeScreen.service";

export const studentHomeScreenController = async (req: AuthRequest, res: Response, next: NextFunction) => {

    const { userId, role } = req.user as JwtPayload;

    // Validate StudentId - Request query params (based on schema)
    const validatedStudentId = studentIdSchema.safeParse(userId);
    if (!validatedStudentId.success) {
        return next(new AppError({
            statusCode: 400,
            data: [],
            message: validatedStudentId.error.errors[0].message, // First Zod error message
        }));
    }

    // Validate Role - Request query params (based on schema)
    const validatedRole = roleSchema.safeParse(role);
    if (!validatedRole.success) {
        return next(new AppError({
            statusCode: 400,
            data: [],
            message: validatedRole.error.errors[0].message, // First Zod error message
        }));
    }

    const studentHomeDetails = await studentHomeScreenService({ student_id: userId });

    res.status(200).json({
        status: true,
        data: studentHomeDetails,
        message: "Student Home Screen Details fetched successfully.",
    });
}