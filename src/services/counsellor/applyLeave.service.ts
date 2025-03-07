import { LeaveStatus, LeaveMode, LeaveType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const applyLeave = async (
  management_staff_id: string,
  leave_type: LeaveType,
  leave_mode: LeaveMode,
  from_date: Date,
  to_date: Date,
  reason: string
) => {
  return await prisma.leaveManagementStaff.create({
    data: {
      management_staff_id,
      role: "counsellor",
      reason,
      from_date,
      to_date,
      leave_type,
      leave_mode,
    },
  }).catch(err => {
    throw new AppError({
      statusCode: 500,
      data: {},
      message: "Internal Server Error",
    });
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
