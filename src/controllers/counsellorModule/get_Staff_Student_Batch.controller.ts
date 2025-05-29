import { Response, NextFunction } from "express";
import { getStaff_Student_BatchService } from "../../services/counsellorModule/getStaff_Student_Batch.service";
import { AppError } from "../../utils/errorHandler";
import { AuthRequest } from "../../middlewares/auth.middleware"; // ✅ Ensure this points to the right middleware

/**
 * Controller to handle fetching staff, student, or batch details based on search parameter.
 */
export const getStaff_Student_BatchController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== "string") {
      throw new AppError({
        statusCode: 400,
        data: [],
        message: "Search parameter is required",
      });
    }

    // ✅ Get branch from decoded token
    const branch = req.user?.branch;
    
    if (!branch) {
      throw new AppError({
        statusCode: 403,
        data: [],
        message: "Branch information is missing in token",
      });
    }

    console.log("Branch from token:", branch);

    // ✅ Optionally: pass branch to the service if needed
    const data = await getStaff_Student_BatchService(search, branch);

    res.status(200).json({
      status: true,
      data,
      message: `${search} details fetched successfully`,
    });
  } catch (error) {
    console.error("Error fetching staff/student/batch:", error);
    next(error);
  }
};
