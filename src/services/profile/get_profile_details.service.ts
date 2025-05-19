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
        // const profile = await prisma.managementStaff.findUnique({
        //     where: { id: userId, role, deletedAt: null },
        //     select: {
        //         name: true,
        //         email: true,
        //         phone: true,
        //         role: true,
        //         address: true,
        //         alt_phone: true,
        //         profile_img_url: true,
        //     },
        // });

        const profile = await prisma.managementStaff.findUnique({
            where: { id: userId, role, deletedAt: null },
            select: {
            id: true,
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
            throw new AppError({ statusCode: 404, message: "Profile not found", data: [] });
        }

        // Step 2: Get batches where mentor_id = userId
        const batches = await prisma.batchDetail.findMany({
            where: { mentor_id: userId, deletedAt: null },
            select: { id: true },
        });

        const batchIds = batches.map(batch => batch.id);

        // Default counts if no batches found
        if (batchIds.length === 0) {
            return {
            profile: {
                id: profile.id,
                name: profile.name,
                easy_count: 0,
                medium_count: 0,
                hard_count: 0,
            },
            };
        }

        // Step 3: Fetch test mocks for those batches
        const mockTests = await prisma.test_Mock.findMany({
            where: {
            batch_id: { in: batchIds },
            deletedAt: null,
            },
            select: {
            test_mode: true,
            questions: true, // assuming questions is array of objects
            },
        });

        // Step 4: Calculate question counts
        let easy_count = 0, medium_count = 0, hard_count = 0;

        for (const test of mockTests) {
            const count = Array.isArray(test.questions) ? test.questions.length : 0;

            if (test.test_mode === 'easy') {
            easy_count += count;
            } else if (test.test_mode === 'medium') {
            medium_count += count;
            } else if (test.test_mode === 'hard') {
            hard_count += count;
            }
        }

        // Step 5: Return the combined response
        return {
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
            address: profile.address,
            alt_phone: profile.alt_phone,
            profile_img_url: profile.profile_img_url,
            privacy_url: COMMON_RESPONSE_DATA.privacy_url,
            terms_url: COMMON_RESPONSE_DATA.terms_url,
            cancellation_url: COMMON_RESPONSE_DATA.cancellation_url,
            easy_count,
            medium_count,
            hard_count,
        };

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