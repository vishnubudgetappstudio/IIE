import { NextFunction, Response } from "express";
import { getCounsellorProfileService, getStaffProfileService, getStudentProfileService } from "../services/profile.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/errorHandler";
import { UserRole } from "../types/common.type";

export const getProfileController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId as string; // Logged-in user ID
    const role = req.user?.role as UserRole;

    if (!userId || !role) {
      return next(
        new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid user credentials.",
        })
      );
    }

    switch (role) {
      case "counsellor":
        res.status(200).json({
          status: true,
          data: await getCounsellorProfileService({ counsellor_id: userId }),
          message: "Counsellor profile fetched successfully.",
        });

        break;
      case "staff":
        res.status(200).json({
          status: true,
          data: await getStaffProfileService({ staff_id: userId }),
          message: "Staff profile fetched successfully.",
        });

        break;
      case "student":
        res.status(200).json({
          status: true,
          data: await getStudentProfileService({ student_id: userId }),
          message: "Student profile fetched successfully.",
        });

        break;
      default:
        next(
          new AppError({
            statusCode: 400,
            data: {},
            message: "Invalid role. Please check your account type.",
          })
        );
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    next(error);
  }
};
