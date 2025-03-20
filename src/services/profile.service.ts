import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/errorHandler";

const prisma = new PrismaClient();

// Common URLs (to avoid duplication)
const COMMON_RESPONSE_DATA = {
  privacy_url: "https://privacy.url.com",
  terms_url: "https://terms.url.com",
  cancellation_url: "https://cancellation.url.com",
};

// Generic Function for Management Staff Profiles
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





// import { PrismaClient } from "@prisma/client";
// import { AppError } from "../utils/errorHandler";

// const prisma = new PrismaClient();

// // Get Counsellor Profile
// export const getCounsellorProfileService = async ({ counsellor_id }: { counsellor_id: string }) => {
//   const counsellorProfile = await prisma.managementStaff.findUnique({
//     where: { id: counsellor_id, role: 'counsellor', deletedAt: null },
//     select: {
//       email: true,
//       phone: true,
//       role: true,
//     },
//   });

//   if (!counsellorProfile) {
//     throw new AppError({
//       statusCode: 404,
//       data: {},
//       message: "Counsellor Profile not found",
//     })
//   }

//   return {
//     credential: counsellorProfile,
//     privacy_url: "https://privacy.url.com",
//     terms_url: "https://terms.url.com",
//     cancellation_url: "https://cancellation.url.com",
//   }
// };

// // Get Staff Profile
// export const getStaffProfileService = async ({ staff_id }: { staff_id: string }) => {
//   const staffProfile = await prisma.managementStaff.findUnique({
//     where: { id: staff_id, role: 'staff', deletedAt: null },
//     select: {
//       email: true,
//       phone: true,
//       role: true,
//     },
//   });

//   if (!staffProfile) {
//     throw new AppError({
//       statusCode: 404,
//       data: {},
//       message: "Staff Profile not found",
//     })
//   }

//   return {
//     ...staffProfile,
//     privacy_url: "https://privacy.url.com",
//     terms_url: "https://terms.url.com",
//     cancellation_url: "https://cancellation.url.com",
//   }
// };

// // Get Counsellor Profile
// export const getStudentProfileService = async ({ student_id }: { student_id: string }) => {
//   const studentProfile = await prisma.student.findUnique({
//     where: { id: student_id },
//     select: {
//       name: true,
//       email: true,
//       phone: true,
//       alt_phone: true,
//       roll_number: true,
//       course_id: true,
//       Course: true,
//       profile_img_url: true,
//     },
//   });

//   if (!studentProfile) {
//     throw new AppError({
//       statusCode: 404,
//       data: {},
//       message: "Student Profile not found",
//     })
//   }

//   return {
//     ...studentProfile,
//     privacy_url: "https://privacy.url.com",
//     terms_url: "https://terms.url.com",
//     cancellation_url: "https://cancellation.url.com",
//   }
// };
