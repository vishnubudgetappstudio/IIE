import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { UserRole } from "../../types/common.type";
import { AppError } from "../../utils/errorHandler";
import { updateProfileDetailsService } from "../../services/profile/update_profile_details.service";

export const updateProfileDetailsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId as string; // Logged-in user ID
        const userEmail = req.user?.email as string; // Logged-in user Email
        const role = req.user?.role as UserRole;

        // const imageFile = req.files ? (req.files as Express.Multer.File[])[0] : null;
        const imageFile = req.files?.['image']
            ? (req.files['image'] as Express.Multer.File[])[0]
            : null;

        console.log({ imageFile })

        if (!userId || !role) {
            return next(
                new AppError({
                    statusCode: 401,
                    data: {},
                    message: "Unauthorized: Invalid user credentials.",
                })
            );
        }

        const { name, alt_phone, phone } = req.body;

        const updatedProfile = await updateProfileDetailsService({
            id: userId,
            email: userEmail,
            role: role,
            name: name,
            phone: phone,
            alt_phone: alt_phone,
            profile_img: imageFile
        });

        res.status(200).json({
            status: true,
            data: updatedProfile,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile fetched successfully.`,
        });


    } catch (error) {
        console.error("Error updating profile:", error);
        next(error);
    }
}