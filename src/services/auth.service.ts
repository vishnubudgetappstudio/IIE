import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import dotenv from "dotenv";
import { jwtGenerateToken } from "../utils/jwtTokenGenerate";
import { sendEmail } from "../config/nodemailer";

// Load environment variables from .env file
dotenv.config();

interface LoginResponse {
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
  };
}

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
  password: string
): Promise<LoginResponse> => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // Find user in the database with selected fields (excluding unnecessary data)
  const user = await prisma.managementStaff.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, password: true }, // Select only required fields
  });

  if (!user || user.role !== "counsellor") {
    throw new Error("Unauthorized: Invalid email or password.");
  }

  // Validate Password securely
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Unauthorized: Invalid email or password.");
  }

  // Ensure JWT Secret is available
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Internal Server Error: Missing JWT secret.");
  }

  // Generate JWT Token with User Role
  const token = jwtGenerateToken(user.id, user.name, user.email, user.role);

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
  if (!user) throw new Error("User not found");

  // Generate OTP
  // const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otp = '1234'
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
  await sendEmail(email, "Password Reset OTP", `Your OTP is: ${otp}`);

  return { email: user.email, otp: otp };
};

export const verifyOTPService = async (email: string, otp: string) => {
  const user = await prisma.managementStaff.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) throw new Error("User not found");

  const storedOTP = await prisma.storedOTPDetail.findFirst({
    where: { email: user.email, otp: otp, deletedAt: null },
  });

  if (!storedOTP) throw new Error("Invalid OTP");

  return { email: storedOTP.email, otp: storedOTP.otp };
};

export const resetPasswordManagementStaff = async (
  email: string,
  newPassword: string
) => {
  const user = await prisma.managementStaff.findUnique({
    where: { email, deletedAt: null },
  });

  if (!user) throw new Error("User not found");

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  const updatePassword = await prisma.managementStaff.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { email: updatePassword.email };
};
