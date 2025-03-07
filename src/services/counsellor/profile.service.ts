import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get Counsellor Profile
export const getCounsellorProfile = async (management_staff_id: string) => {
  return await prisma.managementStaff.findUnique({
    where: { id: management_staff_id },
    select: {
      id: true,
      email: true,
      profile_img_url: true,
      phone: true,
      address: true,
      role: true,
    },
  });
};
