import { prisma } from "../../config/database";

export const createSupportTicket = async (
  management_staff_id: string,
  query: string,
) => {
  return prisma.supportTicketDetails.create({
    data: {
      management_staff_id,
      role: 'counsellor',
      query,
    },
    select: {
      query: true,
    },
  });
};
