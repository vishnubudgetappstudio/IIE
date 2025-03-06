import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { jwtGenerateToken } from "../utils/jwtTokenGenerate";

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
