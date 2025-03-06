import { prisma } from "../../config/database";


export const createSupportTicket = async (
  management_staff_id: string,
  query: string,
  attachments?: string
) => {
  return prisma.supportTicket.create({
    data: {
      management_staff_id,
      role: 'counsellor',
      query,
      attachments,
    },
    select: {
      id: true,
      query: true,
      status: true,
      attachments: true,
      createdAt: true,
    },
  });
};
