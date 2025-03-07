import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly data: any;

  constructor({
    statusCode,
    message,
    data = {},
    isOperational = true
  }: {
    statusCode: number;
    message: string;
    data?: any;
    isOperational?: boolean;
  }) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

  // If it's an AppError, return its status code, message, and custom data
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: false,
      statusCode: err.statusCode,
      data: err.data || {}, // Send additional data if available
      message: err.message,
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    status: false,
    statusCode: 500,
    data: {},
    message: "Internal Server Error",
  });
  return;
};

export default errorHandler;


