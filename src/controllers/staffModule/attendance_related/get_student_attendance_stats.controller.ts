import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { CommonUserRole } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { getStudentAttendanceStats } from "../../../services/staffModule/attendance_related/get_student_attendance_stats.service";
import { getStaffAttendanceService } from "../../../services/staffModule/attendance_related/get_student_attendance_stats.service";

export const getStudentAttendanceStatsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { batchId, studentId } = req.query;

        const role = req.user?.role as CommonUserRole;

        if (role !== 'staff') throw new AppError({ statusCode: 400, message: 'Invalid Role, Please check your token' });

        if (!batchId || !studentId) {
            throw new AppError({ statusCode: 400, message: "Batch ID and Student ID are required" });
        }

        const { overAll, weekly, thisMonth, lastMonth } = await getStudentAttendanceStats({
            batchId: batchId as string,
            studentId: studentId as string,
        });
        res.status(200).json({
            overAll,
            weekly,
            thisMonth,
            lastMonth,
            message: "Attendance Percentage fetched successfully",
        });
        // res.status(200).json({ attendancePercentage: percentage.toFixed(2) + "%" });
    } catch (error) {
        console.error("Error in getAttendancePercentageController ===>", error);
        next(error);
    }
};

export const getStaffAttendanceController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) throw new AppError({ statusCode: 404, message: "Unauthorized access", data: {} });
        if (req.user?.role !== 'staff') throw new AppError({
            statusCode: 403,
            message: "Unauthorized Role access, need staff token",
            data: {}
        });

        const staffId = req.user?.userId as string;
        const finalResult = await getStaffAttendanceService({ staffId });

        res.status(200).json({
            status: true,
            data: finalResult,
            message: "Staff Attendance fetched successfully.",
        });
    } catch (error) {
        console.error("Error in getStaffAttendanceController:", error);
        next(error);
    }
};
