import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/errorHandler";
import { compressImage, validateFile } from "../../utils/s3";
import { uploadBufferToS3 } from "../s3/uploadFiles.service";
import { UserRole } from "../../types/common.type";

// Initialize Prisma client
const prisma = new PrismaClient();

// Define input type for updateProfileDetailsService
interface UpdateProfileInput {
    id: string;
    email: string;
    role: UserRole;
    name?: string | null;
    phone?: string | null;
    alt_phone?: string | null;
    profile_img?: Express.Multer.File | null;
}

// Common fields to return in response
const COMMON_SELECT = {
    email: true,
    name: true,
    phone: true,
    alt_phone: true,
    profile_img_url: true,
};

// Service function to update student or management staff profile details
export const updateProfileDetailsService = async ({
    id,
    email,
    role,
    name,
    phone,
    alt_phone,
    profile_img,
}: UpdateProfileInput) => {
    const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

    const isStudent = role === "student";

    // Step 1: Fetch the profile based on role
    const profile = await (isStudent
        ? prisma.student.findUnique({
            where: { id, email, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                alt_phone: true,
                profile_img_url: true,
            },
        })
        : prisma.managementStaff.findUnique({
            where: { id, email, role, deletedAt: null },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                alt_phone: true,
                profile_img_url: true,
            },
        }));

    // Step 2: Handle profile not found
    if (!profile) {
        throw new AppError({
            statusCode: 404,
            message: `${capitalize(role)} profile not found.`,
            data: {},
        });
    }

    // Step 3: Default to existing image URL
    // let profileImageUrl = profile.profile_img_url;

    // Step 4: Handle profile image upload (if present)
    // if (profile_img) {
    //     try {
    //         // Validate file type/size
    //         validateFile(profile_img, true);

    //         // Compress image buffer
    //         const optimizedBuffer = await compressImage(profile_img);

    //         // Upload to S3 and get public URL
    //         const { s3url } = await uploadBufferToS3({
    //             buffer: optimizedBuffer,
    //             file: profile_img,
    //             userId: profile.id,
    //             role,
    //         });

    //         profileImageUrl = s3url;
    //     } catch (err) {
    //         // Throw error if image processing/upload fails
    //         throw new AppError({
    //             statusCode: 400,
    //             message: "Failed to process and upload profile image.",
    //             data: {},
    //         });
    //     }
    // }

    const isFileUpload = profile_img && typeof profile_img !== 'string' && profile_img.buffer;

    let profileImageUrl: string | null | undefined;

    if (isFileUpload) {
        try {
            validateFile(profile_img, true);
            const optimizedBuffer = await compressImage(profile_img);
            const { s3url } = await uploadBufferToS3({
                buffer: optimizedBuffer,
                file: profile_img,
                userId: profile.id,
                role,
            });
            profileImageUrl = s3url;
        } catch (err) {
            throw new AppError({
                statusCode: 400,
                message: "Failed to process and upload profile image.",
                data: {},
            });
        }
    } else {
        profileImageUrl = typeof profile_img === 'string' ? profile_img : profile.profile_img_url;
    }

    // Step 5: Prepare data for update (fallback to existing values)
    const updateData = {
        name: name ? name : profile.name,
        phone: phone ? phone : profile.phone,
        alt_phone: alt_phone ? alt_phone : profile.alt_phone,
        profile_img_url: profileImageUrl,
    };

    // Step 6: Perform update and handle DB errors
    const updated = await (isStudent
        ? prisma.student.update({
            where: { id, email, deletedAt: null },
            data: updateData,
            select: COMMON_SELECT,
        }).catch(() => {
            throw new AppError({
                statusCode: 400,
                message: `Failed to update ${capitalize(role)} profile.`,
                data: {},
            });
        })
        : prisma.managementStaff.update({
            where: { id, email, role, deletedAt: null },
            data: updateData,
            select: COMMON_SELECT,
        })).catch(() => {
            throw new AppError({
                statusCode: 400,
                message: `Failed to update ${capitalize(role)} profile.`,
                data: {},
            });
        });

    // Step 7: Return updated profile
    return updated;
};
