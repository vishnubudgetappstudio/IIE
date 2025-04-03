import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/errorHandler";
import { updateUserFcmTokenService } from "../services/update_user_fcm_token.service";

export const updateUserFcmTokenController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError({
        statusCode: 401,
        data: {},
        message: "Unauthorized User",
      });
    }

    const { fcm_token } = req.body;

    if (!fcm_token) {
      throw new AppError({
        statusCode: 400,
        data: {},
        message: "FCM Token is required",
      });
    }

    // Call update user fcm token service
    const response = await updateUserFcmTokenService({
      email: req.user.email,
      role: req.user.role,
      fcm_token,
    });

    // Send Success Response
    res.status(200).json({
      status: true,
      ...response,
      message: "User FCM Token Updated successfully",
    });


  } catch (error) {
    console.error("Failed to update user fcm token", error);
    next(error);
  }
}