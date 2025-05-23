import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import dotenv from "dotenv";
import { jwtGenerateToken } from "../utils/jwtTokenGenerate";
import { sendEmail } from "../config/nodemailer";
import { AppError } from "../utils/errorHandler";
import { UserRole } from "../types/common.type";

// Load environment variables from .env file
dotenv.config();

export const registerCounsellor = async (
  email: string,
  password: string,
  name: string,
  phone?: string,
  address?: string
) => {
  // Check if email already exists
  const existingUser = await prisma.managementStaff.findUnique({
    where: { email: email, deletedAt: null },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Counsellor in Database
  const newCounsellor = await prisma.managementStaff.create({
    data: {
      email,
      password: hashedPassword,
      role: "counsellor",
      name,
      phone,
      address,
      emailVerified: false,
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newCounsellor;

  return userWithoutPassword;
};

export const loginService = async (
  email: string,
  role: UserRole,
  password: string,
  fcm_token: string
) => {
  if (!email || !password) {
    throw new AppError({
      statusCode: 400,
      data: {},
      message: "Email and password are required."
    });
  }

  let user: any;

  switch (role) {
    case 'counsellor':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'counsellor', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      //update FcmToken for counsellor user
      await prisma.managementStaff.update({
        where: { id: user.id },
        data: { fcm_token },
      });
      break;
    case 'staff':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'staff', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      //update FcmToken for staff user
      await prisma.managementStaff.update({
        where: { id: user.id },
        data: { fcm_token },
      });
      break;
    default: // Code to execute if no cases match
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.student.findUnique({
        where: { email, deletedAt: null },
        select: { id: true, name: true, email: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      //update FcmToken for student user
      await prisma.student.update({
        where: { id: user.id },
        data: { fcm_token },
      });

      user = { ...user, role: "student" };
  }

  // Validate Password securely
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError({
      statusCode: 401,
      data: {},
      message: "Unauthorized: Invalid Password."
    });
  }

  // Ensure JWT Secret is available
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Internal Server Error: Missing JWT secret.");
  }

  // Generate JWT Token with User Role
  const token = jwtGenerateToken({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
  };
};

export const forgotPasswordManagementStaff = async ({ email, role }: { email: string, role: UserRole }) => {
  let user: any;

  switch (role) {
    case 'counsellor':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'counsellor', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      break;
    case 'staff':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'staff', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      break;
    default: // Code to execute if no cases match
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.student.findUnique({
        where: { email, deletedAt: null },
        select: { id: true, name: true, email: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      user = { ...user, role: "student" };
  }

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  //const otp = '1234';

  const existingUserStoredTOP = await prisma.storedOTPDetail.findMany({
    where: { email: email, deletedAt: null },
  })

  if (existingUserStoredTOP.length) {
    // Soft Delete Previous OTP from DB
    await prisma.storedOTPDetail.updateMany({
      where: { email: email, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  // Store OTP in DB and send via email
  await prisma.storedOTPDetail.create({
    data: {
      email: user.email,
      otp: otp,
    },
  });

  // Send email
  await sendEmail({
    to: user.email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
    html: `<h2>Password Reset OTP</h2></br><p>Your OTP is: ${otp}</p>`,
  });

  return { email: user.email, otp: otp };
};

export const verifyOTPService = async (email: string, otp: string) => {

  const storedOTP = await prisma.storedOTPDetail.findFirst({
    where: { email: email, otp: otp, deletedAt: null },
    select: { email: true, otp: true, } // Select only required fields
  });

  if (!storedOTP) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Invalid OTP.",
    });
  };

  // Soft Delete OTP from DB
  await prisma.storedOTPDetail.updateMany({
    where: { email: storedOTP.email, otp: storedOTP.otp, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return { email: storedOTP.email, otp: storedOTP.otp };
};

export const resetPasswordManagementStaff = async ({ email, role, newPassword }: {
  email: string,
  role: UserRole,
  newPassword: string
}) => {

  let user: any;

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  switch (role) {
    case 'counsellor':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'counsellor', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      // Update password
      await prisma.managementStaff.update({
        where: { email: user.email, role: 'counsellor', deletedAt: null },
        data: { password: hashedPassword },
      });

      break;
    case 'staff':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'staff', deletedAt: null },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      // Update password
      await prisma.managementStaff.update({
        where: { email: user.email, role: 'staff', deletedAt: null },
        data: { password: hashedPassword },
      });

      break;
    default: // Code to execute if no cases match
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.student.findUnique({
        where: { email, deletedAt: null },
        select: { id: true, name: true, email: true, password: true }, // Select only required fields
      });

      if (!user) {
        throw new AppError({
          statusCode: 401,
          data: {},
          message: "Unauthorized: Invalid Email Address."
        });
      }

      // Update password
      await prisma.student.update({
        where: { email: user.email, deletedAt: null },
        data: { password: hashedPassword },
      });

      user = { ...user, role: "student" };
  }

  return { email: user.email };
};
