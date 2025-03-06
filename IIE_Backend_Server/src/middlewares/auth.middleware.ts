import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Middleware to verify token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Query Params:", req.query);

    // Check Authorization header first
    const authHeader = req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback: Check if token is in request body
    if (!token && req.body?.token) {
      token = req.body.token;
    }

    // Fallback: Check if token is in query params
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    console.log("Extracted Token:", token);

    if (!token) {
      res.status(401).json({
        success: false,
        data: {},
        message: "Access Denied. No token provided.",
      });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.user = decoded; // Attach user data to request
    next(); // Proceed to next middleware
  } catch (error) {
    res
      .status(403)
      .json({ success: false, data: {}, message: "Invalid or expired token." });
  }
};
