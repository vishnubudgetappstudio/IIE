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
    where: { email: email },
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
  password: string
) => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  let user: any;

  switch (role) {
    case 'counsellor':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'counsellor' },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });
      break;
    case 'staff':
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.managementStaff.findUnique({
        where: { email, role: 'staff' },
        select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
      });
      break;
    default: // Code to execute if no cases match
      // Find user in the database with selected fields (excluding unnecessary data)
      user = await prisma.student.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, password: true }, // Select only required fields
      });

      user = { ...user, role: "student" };
  }

  if (!user) {
    throw new AppError({
      statusCode: 401,
      data: {},
      message: "Unauthorized: Invalid Email Address."
    });
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

export const forgotPasswordManagementStaff = async (email: string) => {
  const user = await prisma.managementStaff.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Invalid User.",
    });
  };

  // Generate OTP
  // const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otp = '1234'

  // Soft Delete Previous OTP from DB (optional)
  await prisma.storedOTPDetail.updateMany({
    data: { deletedAt: new Date() },
    where: { email: email, deletedAt: null },
  });

  // Store OTP in DB (optional) or send via email
  await prisma.storedOTPDetail.create({
    data: {
      email: user.email,
      otp: otp,
    },
  });

  // Send email
  // await sendEmail({
  //   to: user.email,
  //   subject: "Password Reset OTP",
  //   text: `Your OTP is: ${otp}`,
  //   html: `<h2>Password Reset OTP</h2></br><p>Your OTP is: ${otp}</p>`,
  // });

  return { email: user.email, otp: otp };
};

export const verifyOTPService = async (email: string, otp: string) => {
  const user = await prisma.managementStaff.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Invalid User.",
    });
  };

  const storedOTP = await prisma.storedOTPDetail.findFirst({
    where: { email: user.email, otp: otp, deletedAt: null },
  });

  if (!storedOTP) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Invalid OTP.",
    });
  };

  return { email: storedOTP.email, otp: storedOTP.otp };
};

export const resetPasswordManagementStaff = async (
  email: string,
  newPassword: string
) => {
  const user = await prisma.managementStaff.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) {
    throw new AppError({
      statusCode: 404,
      data: {},
      message: "Invalid User.",
    })
  };

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  const updatePassword = await prisma.managementStaff.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { email: updatePassword.email };
};
