import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { getStudentAttendanceService } from "../../services/studentModule/get_attendance.service";

export const getStudentAttendanceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        if (!req.user) throw new AppError({ statusCode: 404, message: "Unauthorized access", data: {} });

        if (req.user?.role !== 'student') throw new AppError({
            statusCode: 404,
            message: "Unauthorized Role access, need student token",
            data: {}
        });

        const studentId = req.user?.userId as string;

        const { finalResult } = await getStudentAttendanceService({ studentId });

        res.status(200).json({
            status: true,
            data: finalResult,
            message: "Student Attendance fetched successfully.",
        });

    } catch (error) {
        console.error("Error in getStudentAttendanceController:", error);
        next(error);
    }
}