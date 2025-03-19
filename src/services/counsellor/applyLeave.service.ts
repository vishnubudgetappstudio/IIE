import { LeaveStatus, LeaveMode, LeaveType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const applyLeaveService = async (
  management_staff_id: string,
  leave_type: LeaveType,
  leave_mode: LeaveMode,
  from_date: string,
  to_date: string,
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
    select: {
      reason: true,
      leave_type: true,
      leave_mode: true,
      from_date: true,
      to_date: true,
    }
  }).catch(err => {
    console.error({ err });

    throw new AppError({
      statusCode: 400,
      data: {},
      message: "Counsellor Leave request operation failed",
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
