import { LeaveStatus, LeaveMode, LeaveType } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/errorHandler";
import { UserRole } from "../types/common.type";

export const applyLeaveService = async ({
  userId, //Based on token (Counsellor_id or Staff_id or Student_id )
  role,
  leave_type,
  leave_mode,
  from_date,
  to_date,
  reason
}: {
  userId: string,
  role: string,
  leave_type: LeaveType,
  leave_mode: LeaveMode,
  from_date: string,
  to_date: string,
  reason: string
}) => {
  const leaveData: any = {
    role,
    reason,
    from_date,
    to_date,
    leave_type,
    leave_mode,
    status: LeaveStatus.Pending, //  Use Prisma enum instead of a string
  };

  // Conditionally connect the correct relation based on role
  if (role === "counsellor" || role === "staff") {
    leaveData.management_staff_id = userId;
  } else if (role === "student") {
    leaveData.student_id = userId;
  } else {
    throw new AppError({
      statusCode: 400,
      data: {},
      message: "Invalid role provided for leave request",
    });
  }

  // Create Leave Request
  return await prisma.leaveDetail.create({
    data: leaveData,
    select: {
      reason: true,
      leave_type: true,
      leave_mode: true,
      from_date: true,
      to_date: true,
      role: true,
    },
  }).catch(err => {
    console.error("Error applying leave:", err);

    throw new AppError({
      statusCode: 400,
      data: {},
      message: "Leave request operation failed",
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
