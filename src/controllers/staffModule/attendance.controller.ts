import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { attendanceSchema } from "../../zodSchema/staff.schema";
import { getStudentAttendanceStats, markAttendanceService } from "../../services/staffModule/attendance.service";
import { CommonUserRole } from "@prisma/client";

// ✅ Mark Attendance API 
export const markStudentAttendanceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const role = req.user?.role as CommonUserRole;

        if (role !== 'staff') throw new AppError({ statusCode: 400, message: 'Invalid Role, Please check your token' });

        // Validate request body using Zod
        const validationResult = attendanceSchema.safeParse(req.body);
        if (!validationResult.success) {
            throw new AppError({
                statusCode: 400,
                data: {},
                message: validationResult.error.errors[0].message, // Return first validation error message
            });
        }

        // Destructure validated data
        const { batchId, studentId, isPresent } = validationResult.data;

        // ✅ Mark attendance in the database
        const attendance = await markAttendanceService({
            batchId: batchId,
            studentId: studentId,
            isPresent: isPresent,
        });

        // ✅ Send success response
        res.status(201).json({ data: attendance, message: "Attendance marked successfully" });
    } catch (error) {
        console.error("Error in markStudentAttendance ===>", error);
        next(error);
    }
};


// ✅ Get Attendance Percentage API
export const getAttendancePercentageController = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
}
