import { LeaveStatus, LeaveMode, LeaveType } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../utils/errorHandler";
import { UserRole } from "../types/common.type";
import { formatDateToDDMMYYYY, parseDDMMYYYYToDate } from "../utils/commonUtils";

export const applyLeaveService = async ({
  userId,
  role,
  leave_type,
  leave_mode,
  from_date,
  to_date,
  reason,
}: {
  userId: string;
  role: UserRole;
  leave_type: LeaveType;
  leave_mode?: LeaveMode;
  from_date: string; // Format: DD/MM/YYYY
  to_date: string;
  reason: string;
}) => {
  // 🔁 Parse string dates to Date objects
  const fromDateObj = parseDDMMYYYYToDate(from_date);
  const toDateObj = parseDDMMYYYYToDate(to_date);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 🧼 Normalize for accurate comparison

  console.log({ fromDateObj })

  console.log({ today })

  // ❌ Validate: from_date must be today or future
  if (fromDateObj < today) {
    throw new AppError({
      statusCode: 400,
      message: "Leave cannot be applied for past dates.",
    });
  }

  // ❌ Validate: to_date must be >= from_date
  if (toDateObj < fromDateObj) {
    throw new AppError({
      statusCode: 400,
      message: "To Date must be greater than or equal to From Date.",
    });
  }

  // 🧠 Check for overlapping leave request in the same date range
  const overlapLeave = await prisma.leaveDetail.findFirst({
    where: {
      role,
      deletedAt: null,
      from_date: { lte: (formatDateToDDMMYYYY(toDateObj)).toString() },
      to_date: { gte: (formatDateToDDMMYYYY(fromDateObj)).toString() },
      ...(role === "student"
        ? { student_id: userId }
        : { management_staff_id: userId }),
    },
  });

  console.log({ overlapLeave })

  if (overlapLeave) {
    throw new AppError({
      statusCode: 400,
      message: "A leave request already exists for the selected date range.",
    });
  }

  // ✅ Prepare data
  const leaveData: any = {
    role,
    reason,
    from_date: (formatDateToDDMMYYYY(fromDateObj)).toString(),
    to_date: (formatDateToDDMMYYYY(toDateObj)).toString(),
    leave_type,
    leave_mode,
    status: LeaveStatus.Pending,
  };

  // 🔐 Role-based relation mapping
  switch (role) {
    case "student":
      leaveData.student_id = userId;
      break;
    case "counsellor":
    case "staff":
      leaveData.management_staff_id = userId;
      break;
    default:
      throw new AppError({
        statusCode: 400,
        message: "Invalid role provided.",
      });
  }

  // ✅ Create leave request
  try {
    const leave = await prisma.leaveDetail.create({
      data: leaveData,
      select: {
        reason: true,
        leave_type: true,
        leave_mode: true,
        from_date: true,
        to_date: true,
        role: true,
        status: true,
      },
    });

    return {
      ...leave,
      applied: leave.status !== 'Approved' ? true : false,
      review: leave.status !== 'Approved' ? false : true,
      approved: leave.status !== 'Approved' ? false : true,

    };
  } catch (err) {
    console.error("Error creating leave request:", err);
    throw new AppError({
      statusCode: 500,
      message: "Leave request failed. Please try again.",
    });
  }
};
