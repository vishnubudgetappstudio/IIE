import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { CommonUserRole } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { attendanceSchema } from "../../../zodSchema/staff.schema";
import { markBatchAttendanceFlagSchema } from "../../../zodSchema/staff.schema";
import { markAttendanceService, updateBatchIsMarkedService } from "../../../services/staffModule/attendance_related/mark_student_attendance.service";

export const markStudentAttendanceController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {

        const role = req.user?.role as CommonUserRole;
        // console.log("User Role ===>", role);
        

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
            isPresent: isPresent ?? false,
        });

        // ✅ Send success response
        res.status(201).json({ data: attendance, message: "Attendance marked successfully" });
    } catch (error) {
        console.error("Error in markStudentAttendance ===>", error);
        next(error);
    }
};



export const updateBatchAttendanceFlagController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  try {
    const validation = markBatchAttendanceFlagSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError({
        statusCode: 400,
        message: validation.error.errors[0]?.message || "Invalid request body",
      });
    }

    const { batchId, isMarked } = validation.data;
    const result = await updateBatchIsMarkedService(batchId, isMarked);

    res.status(200).json({ message: "Batch flag updated", data: result });
  } catch (error) {
    next(error);
  }
};


