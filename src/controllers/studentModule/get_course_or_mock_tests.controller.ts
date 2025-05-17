import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/errorHandler";
import { studentGetAllCourseOrMockTestsService } from "../../services/studentModule/get_course_or_mock_tests.service";
import { studentMockTestService } from "../../services/studentModule/get_course_or_mock_tests.service";
import { TestType } from "@prisma/client";

// Controller to fetch all course tests
export const studentGetAllCourseOrMockTestsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.searchQuery as string || null;
        const testType = req.query.test_type as TestType;

        if (!req.user) throw new AppError({ statusCode: 404, message: "User not found", data: [] });

        if (req.user?.role !== 'student' && req.user?.role !== 'guest') throw new AppError({ statusCode: 404, message: "Invalid roleee", data: [] });

        if (!testType || testType !== "mock_test" && testType !== "course_test") {
            throw new AppError({
                statusCode: 400,
                message: "Test type is required and must mock_test or course_test",
                data: [],
            });
        }

        // Call service
        const { enhancedTests, perPage, currentPage, totalPages, totalTests } = await studentGetAllCourseOrMockTestsService({
            studentId: req.user?.userId,
            role: req.user?.role,
            test_type: testType,
            test_mode: (req.query.test_mode as string) || "default_mode",
             correct_answer_count: 0, // Default value added
            search,
            page,
            limit,
        });

        // Send response
        res.status(200).json({
            status: true,
            data: enhancedTests,
            totalTestCount: totalTests,
            limit: perPage,
            page: currentPage,
            totalPages,
            message: "Course tests fetched successfully",
        });
    } catch (error) {
        console.error("Error in get course tests controller:", error);
        next(error); // Pass error to centralized error handler
    }
};


export const studentMockTestController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { test_mode, correct_answer_count, test_type } = req.body;

    // Validate request body
    if (!test_mode || !correct_answer_count || !test_type) {
      throw new AppError({ statusCode: 400, message: "test_mode, correct_answer_count and test_type are required" });
    }

    if (!req.user || req.user.role !== 'student') {
      throw new AppError({ statusCode: 403, message: "Unauthorized access" });
    }

    // if (!test_mode || !test_type) {
    //   throw new AppError({ statusCode: 400, message: "test_mode and test_type are required" });
    // }

    const result = await studentMockTestService({
      studentId: req.user.userId,
      role: req.user.role,
      test_mode,
      correct_answer_count,
      test_type,
      search: req.query.searchQuery as string || null,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    });

    res.status(200).json({
      status: true,
      message: "Next questions fetched successfully",
      data: result,
    });

  } catch (error) {
    console.error("Adaptive Test Error:", error);
    next(error);
  }
};
