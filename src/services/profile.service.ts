import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/errorHandler";

const prisma = new PrismaClient();

// Common URLs (to avoid duplication)
const COMMON_RESPONSE_DATA = {
  privacy_url: "https://privacy.url.com",
  terms_url: "https://terms.url.com",
  cancellation_url: "https://cancellation.url.com",
};

// Get Generic Function for Management Staff Profiles
const getManagementStaffProfile = async (id: string, role: "counsellor" | "staff") => {
  const profile = await prisma.managementStaff.findUnique({
    where: { id, role, deletedAt: null },
    select: {
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!profile) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile not found`,
    });
  }

  return { credential: profile, ...COMMON_RESPONSE_DATA };
};

// Get Counsellor Profile
export const getCounsellorProfileService = async ({ counsellor_id }: { counsellor_id: string }) => {
  return getManagementStaffProfile(counsellor_id, "counsellor");
};

// Get Staff Profile
export const getStaffProfileService = async ({ staff_id }: { staff_id: string }) => {
  return getManagementStaffProfile(staff_id, "staff");
};

// Get Student Profile
export const getStudentProfileService = async ({ student_id }: { student_id: string }) => {
  const studentProfile = await prisma.student.findUnique({
    where: { id: student_id },
    select: {
      name: true,
      email: true,
      phone: true,
      alt_phone: true,
      roll_number: true,
      course_id: true,
      Course: true,
      profile_img_url: true,
    },
  });

  if (!studentProfile) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Student Profile not found",
    });
  }

  return { ...studentProfile, ...COMMON_RESPONSE_DATA };
};


// update Generic Function for Management Staff Profiles
const updateManagementStaffProfile = async ({ id, email, role, data }: {
  id: string,
  email: string,
  role: "counsellor" | "staff",
  data: {
    name?: string,
    phone?: string,
    alt_phone?: string,
  }
}) => {
  const profile = await prisma.managementStaff.findUnique({
    where: { id, email, role, deletedAt: null },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile not found`,
    });
  }

  return await prisma.managementStaff.update({
    where: { id, email, role, deletedAt: null },
    data: {
      name: data.name,
      phone: data.phone,
      alt_phone: data.alt_phone,
    },
    select: {
      email: true,
      name: true,
      phone: true,
      alt_phone: true,
    }
  });
}

// update Counsellor Profile
export const updateCounsellorProfileService = async ({ counsellor_id, email, data }:
  {
    counsellor_id: string,
    email: string,
    data: {
      name?: string,
      phone?: string,
      alt_phone?: string,
    }
  }) => {
  return updateManagementStaffProfile({
    id: counsellor_id,
    role: 'counsellor',
    email,
    data,
  });
};

// update Staff Profile
export const updateStaffProfileService = async ({ staff_id, email, data }:
  {
    staff_id: string,
    email: string,
    data: {
      name?: string,
      phone?: string,
      alt_phone?: string,
    }
  }) => {
  return updateManagementStaffProfile({
    id: staff_id,
    role: 'staff',
    email,
    data,
  });
};

export const updateStudentProfileService = async ({ student_id, email, role, data }: {
  student_id: string,
  email: string,
  role: "student",
  data: {
    name?: string,
    phone?: string,
    alt_phone?: string,
    roll_number?: string,
    course_id?: string,
  }
}) => {
  const profile = await prisma.student.findUnique({
    where: {
      id: student_id,
      email: email,
      deletedAt: null
    },
    select: { id: true }
  });

  if (!profile) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} Profile not found`,
    });
  }

  const updateStudentProfile = await prisma.student.update({
    where: { id: student_id, email, deletedAt: null },
    data: {
      name: data.name,
      phone: data.phone,
      alt_phone: data.alt_phone,
    },
    select: {
      email: true,
      name: true,
      phone: true,
      alt_phone: true,
    }
  });

  return { ...updateStudentProfile, ...COMMON_RESPONSE_DATA };
}
