import { Request, Response } from "express";
import { getCounsellorProfile } from "../../services/counsellor/profile.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

// Get Profile Controller
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // `verifyToken` middleware ensures `req.user` exists
    const userId = req.user?.userId;
    if (!userId) {
      res
        .status(401)
        .json({ status: false, message: "Unauthorized: Invalid token" });
      return;
    }

    // Fetch the counsellor profile
    const profile = await getCounsellorProfile(userId);
    if (!profile) {
      res.status(404).json({ status: false, message: "Profile not found" });
      return;
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

    res.status(500).json({
      status: false,
      data: {},
      message: "Error fetching profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
