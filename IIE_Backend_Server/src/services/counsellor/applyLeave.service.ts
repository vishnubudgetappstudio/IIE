import { LeaveStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export const applyLeave = async (
  management_staff_id: string,
  leave_type: "SICK" | "CASUAL" | "EARNED" | "UNPAID" | "OTHER",
  from_date: Date,
  to_date: Date,
  reason: string
) => {
  return await prisma.leaveRequest.create({
    data: {
      management_staff_id,
      role: "counsellor",
      reason,
      from_date,
      to_date,
      leave_type,
    },
  });
};

// export const getLeaveRequests = async (management_staff_id: string) => {
//   return await prisma.leaveRequest.findMany({
//     where: { management_staff_id },
//   });
// };

// export const updateLeaveStatus = async (
//   leaveId: string,
//   status: LeaveStatus
// ) => {
//   return await prisma.leaveRequest.update({
//     where: { id: leaveId },
//     data: { status },
//   });
// };
