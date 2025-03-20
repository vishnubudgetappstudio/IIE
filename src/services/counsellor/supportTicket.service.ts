import { TicketStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { UserRole } from "../../types/common.type";
import { AppError } from "../../utils/errorHandler";

export const createSupportTicket = async ({ userId, role, query }: {
  userId: string,
  role: UserRole,
  query: string,
}) => {
  const supportTicketData: any = {
    role,
    query,
    status: TicketStatus.open, //  Use Prisma enum instead of a string
  };

  // Conditionally connect the correct relation based on role
  if (role === "counsellor" || role === "staff") {
    supportTicketData.management_staff_id = userId;
  } else if (role === "student") {
    supportTicketData.student_id = userId;
  } else {
    throw new AppError({
      statusCode: 400,
      data: {},
      message: "Invalid role provided for support ticket request",
    });
  }
  return prisma.supportTicketDetail.create({
    data: supportTicketData,
    select: {
      query: true,
    },
  });
};
