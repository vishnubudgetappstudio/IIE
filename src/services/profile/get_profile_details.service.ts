import { PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/errorHandler";
import { UserRole } from "../../types/common.type";

const prisma = new PrismaClient();

// Common URLs (to avoid duplication)
const COMMON_RESPONSE_DATA = {
    privacy_url: "https://privacy.url.com",
    terms_url: "https://terms.url.com",
    cancellation_url: "https://cancellation.url.com",
};

// Get Generic Function for Management Staff Profiles
export const getProfileDetailsService = async ({ userId, role }: { userId: string, role: UserRole }) => {
    if (role === "student") {
        const studentProfile = await prisma.student.findUnique({
            where: { id: userId, deletedAt: null },
            select: {
                name: true,
                email: true,
                phone: true,
                alt_phone: true,
                roll_number: true,
                address: true,
                City: true,
                Pincode: true,
                course_id: true,
                Course: true,
                profile_img_url: true,
            },
        });

        if (!studentProfile) {
            throw new AppError({
                statusCode: 404,
                data: {},
                message: "Student Profile not found",
            });
        }

        return { ...studentProfile, ...COMMON_RESPONSE_DATA };
    } else {
        const profile = await prisma.managementStaff.findUnique({
            where: { id: userId, role, deletedAt: null },
            select: {
                name: true,
                email: true,
                phone: true,
                role: true,
                address: true,
                alt_phone: true,
                profile_img_url: true,
            },
        });

        if (!profile) {
            throw new AppError({
                statusCode: 404,
                data: {},
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile not found`,
            });
        }

        return { ...profile, ...COMMON_RESPONSE_DATA };

    }
};