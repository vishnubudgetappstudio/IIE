import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { AppError } from "../utils/errorHandler";
import { upload } from "./upload.middleware";

dotenv.config()

// ✅ Extend Request Interface (ONLY for user)
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ✅ Middleware to verify token & handle form-data
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ First, parse form-data (files & fields)
    upload.any()(req, res, async (err: any) => {
      if (err) {
        return next(new AppError({ statusCode: 400, message: "Form-data parsing error", data: {} }));
      }

      let token: string | undefined;

      // ✅ 1. Authorization Header Check
      const authHeader = req.header("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      // ✅ 2. Body Check (Form-data fields)
      if (!token && req.body?.token) {
        token = req.body.token;
      }

      // ✅ 3. Query Params Check
      if (!token && req.query?.token) {
        token = req.query.token as string;
      }

      // console.log("Token:", token);
      // console.log("Form Data:", req.body);
      // console.log("Uploaded Files:", req.files); // ✅ Files are still accessible in req.files

      if (!token) {
        return next(new AppError({ statusCode: 401, message: "Access Denied. No token provided.", data: {} }));
      }

      // // ✅ Verify the token
      // const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      // ✅ 3. Verify the token (this is where the crash happens if the token is invalid)
      jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
          console.error("❌ JWT Verification Error:", err.message);

          let errorMessage = "Unauthorized: Invalid Token";
          if (err.name === "TokenExpiredError") {
            errorMessage = "Unauthorized: Token Expired";
          } else if (err.name === "JsonWebTokenError") {
            errorMessage = "Unauthorized: Malformed Token";
          }

          return res.status(401).json({ success: false, message: errorMessage });
        }

        // ✅ 4. Store decoded user data in request
        req.user = decoded as JwtPayload;
        next(); // Proceed to next middleware
      });
    });
  } catch (error) {
    // return next(new AppError({ statusCode: 403, message: "Invalid or expired token.", data: {} }));
    console.error("❌ Unexpected Error in Auth Middleware:", error);
    throw new AppError({ statusCode: 500, message: "Internal Server Error", data: {} });
  }
};
