import { Request, Response, NextFunction } from "express";
import { getAllCourseTestsService } from "../../../../services/staffModule/test_related/course_test_related/get_course_test.service";
import { AppError } from "../../../../utils/errorHandler";
import { AuthRequest } from "../../../../middlewares/auth.middleware";
import { prisma } from "../../../../config/database";
import { Console } from "console";

// Controller to fetch all course tests
export const getAllCourseTestsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Extract query params
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.searchQuery as string || null;
        const batchId = req.query.batch_id as string || null;

        if (!req.user) throw new AppError({ statusCode: 404, message: "User not found", data: [] });

        if (req.user?.role !== 'staff') throw new AppError({ statusCode: 404, message: "Invalid role", data: [] });

        // Validate required param
        if (!batchId || typeof batchId !== "string") {
            throw new AppError({
                statusCode: 400,
                message: "Batch ID is required and must be a string",
                data: [],
            });
        }

        // Call service
        const { enhancedTests, perPage, currentPage, totalPages, totalTests } = await getAllCourseTestsService({
            batchId,
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

export const getTestResultsController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const batchId = (req.query.batchId as string) ?? null;
    const testId = (req.query.testId as string) ?? null;
//     const batchId = req.params.batchId;
// const testId = req.params.testId;
    console.log("batchId ===>", batchId);
    if (!batchId) {
      res.status(400).json({ error: "Batch ID is required" });
      return;
    }
   // const testId = req.query.testId as string || null;
    console.log("testId ===>", testId); 
    
  //  const testId = req.params.testId;
    if (!testId) {
       res.status(400).json({ error: "Test ID is required" });
        return;
    }
  
    try {
      // Step 1: Fetch test results (students who attended)
      const testResults = await prisma.test_Course_Or_Mock_With_Student.findMany({
        where: {
          batchId: batchId,
          courseTestId: testId,
        },
        select: {
          studentId: true,
          score: true,
          score_status: true,
        },
      });
  console.log("testResults ===>", testResults); 
      const attendedStudentIds = testResults.map((r) => r.studentId);
  
      // Step 2: Fetch student details for attended students
      const attendedStudents = await prisma.student.findMany({
        where: {
          id: { in: attendedStudentIds },
        },
        select: {
          id: true,
          name: true,
          roll_number: true,
          profile_img_url: true,
        },
      });
  
      const resultMap = new Map(testResults.map((r) => [r.studentId, r]));
  
      const attended = attendedStudents.map((student) => {
        const result = resultMap.get(student.id);
        return {
          student_name: student.name,
          roll_number: student.roll_number,
          profile_image: student.profile_img_url,
          score: result?.score ?? '-',
          score_status: result?.score_status ?? 'Not attended',
        };
      });
  
      res.json({ attended, message: "Test results fetched successfully" });
      return;
    } catch (error) {
      console.error('Error fetching test results:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  };
  