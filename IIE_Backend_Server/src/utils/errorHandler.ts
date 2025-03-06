export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode: number, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
  
      // Maintain proper stack trace (only in development)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export const handleErrorResponse = (res: any, error: any) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ status: false, message: error.message });
    }
  
    if (error.errors) {
      // Handle validation errors from Zod
      const validationErrors = error.errors.map((e: any) => e.message).join(", ");
      return res.status(400).json({ status: false, message: validationErrors });
    }
  
    // Generic server error
    console.error("Unhandled Error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  };
  