import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { CommonUserRole } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { attendanceSchema } from "../../../zodSchema/staff.schema";
import { markAttendanceService } from "../../../services/staffModule/attendance_related/mark_student_attendance.service";

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