import { prisma } from "../config/database";
import { UserRole } from "../types/common.type";
import { AppError } from "../utils/errorHandler";

export const updateUserFcmTokenService = async ({ email, role, fcm_token }: { email: string, role: UserRole, fcm_token: string }) => {
    let user: any;

    switch (role) {
        case 'counsellor':
            // Find user in the database with selected fields (excluding unnecessary data)
            user = await prisma.managementStaff.findUnique({
                where: { email, role: 'counsellor', deletedAt: null },
                select: { id: true, name: true, email: true, role: true }, // Select only required fields
            });

            if (!user) {
                throw new AppError({
                    statusCode: 401,
                    data: {},
                    message: "Unauthorized: Invalid Email Address."
                });
            }

            //update FcmToken for counsellor user
            await prisma.managementStaff.update({
                where: { id: user.id },
                data: { fcm_token },
            });
            break;
        case 'staff':
            // Find user in the database with selected fields (excluding unnecessary data)
            user = await prisma.managementStaff.findUnique({
                where: { email, role: 'staff', deletedAt: null },
                select: { id: true, name: true, email: true, role: true }, // Select only required fields
            });

            if (!user) {
                throw new AppError({
                    statusCode: 401,
                    data: {},
                    message: "Unauthorized: Invalid Email Address."
                });
            }

            //update FcmToken for staff user
            await prisma.managementStaff.update({
                where: { id: user.id },
                data: { fcm_token },
            });
            break;
        default: // Code to execute if no cases match
            // Find user in the database with selected fields (excluding unnecessary data)
            user = await prisma.student.findUnique({
                where: { email, deletedAt: null },
                select: { id: true, name: true, email: true }, // Select only required fields
            });

            if (!user) {
                throw new AppError({
                    statusCode: 401,
                    data: {},
                    message: "Unauthorized: Invalid Email Address."
                });
            }

            //update FcmToken for student user
            await prisma.student.update({
                where: { id: user.id },
                data: { fcm_token },
            });

            user = { ...user, role: "student" };
    }
    return { email: user.email, role: user.role };
}