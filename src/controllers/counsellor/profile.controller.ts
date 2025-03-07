import { NextFunction, Request, Response } from "express";
import { getCounsellorProfile } from "../../services/counsellor/profile.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { z } from "zod";

// Define a validation schema for batchId
const managementStaffIdSchema = z.string().uuid({ message: "Invalid batch ID format" });

// Get Profile Controller
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    // Validate ManagementStaffId
    const validatedManagementStaffId = managementStaffIdSchema.safeParse(userId);

    if (!validatedManagementStaffId?.success) {
      const firstErrorMessage = validatedManagementStaffId.error.errors[0].message; // Get first error message

      throw new AppError({
        statusCode: 400,
        data: {}, // Always send an empty object
        message: firstErrorMessage, // Set message from Zod error
      });
    }

    // Fetch the counsellor profile
    const profile = await getCounsellorProfile(userId);
    if (!profile) {
      throw new AppError({
        statusCode: 404,
        data: {}, // Always send an empty object
        message: "Profile not found",
      });
    }

    // Send successful response
    res.status(200).json({
      status: true,
      data: {
        credential: profile,
        privacy_url: "https://privacy.url.com",
        terms_url: "https://terms.url.com",
        cancellation_url: "https://cancellation.url.com",
      },
      message: "Profile fetched successfully",
    });
    return;
  } catch (error) {
    console.error("Error fetching profile:", error);
    next(error);
  }
};
