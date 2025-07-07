import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../../../utils/errorHandler";
import { getSessionSheetDataService } from "../../../services/counsellorModule/batch_related/get_session_sheet_data.service";
import { PrismaClient, SessionSheetStatus } from '@prisma/client';

const prisma = new PrismaClient();
/**
 * ✅ Handles fetching and parsing session sheet data from S3.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function for error handling.
 * @returns JSON response with parsed CSV data.
 */
export const getSessionSheetDataController = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const batchId = req.query.batch_id as string || undefined;
        const search = (req.query.searchQuery as string) || undefined; // Extract search query
        const noParam = req.query.no as string;       // e.g., from URL like ?no=102
        const statusParam = req.query.status as string; // e.g., ?status=completed

        if (page < 1 || limit < 1) {
            throw new AppError({ statusCode: 400, message: "Invalid page or limit", data: [] });
        }

        // ✅ Validate batch_id
        if (!batchId) {
            throw new AppError({ statusCode: 400, message: "Batch ID is required", data: [] });
        }

        // ✅ Fetch and parse session sheet data
        const jsonData = await getSessionSheetDataService({
            batch_id: batchId,
            search: search,
            noParam: noParam,       // Pass the "No." parameter to the service
            statusParam: statusParam, // Pass the "status
            page: page,
            limit: limit
        });

        // ✅ Send successful response
        res.status(200).json({ success: true, data: jsonData, message: "Session sheet data fetched successfully" });
    } catch (error) {
        console.error("❌ Error fetching session sheet:", error);
        next(error);
    }
};


export const getSessionSheetReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // const records = await prisma.$queryRawUnsafe<any[]>(`
    //   SELECT 
    //     sssrd.id,
    //     sssrd.student_id,
    //     sssrd.status,
    //     s.name AS student_name,
    //     s.email AS student_email,
    //     s.roll_number AS roll_number
    //   FROM session_sheet_student_report_detail sssrd
    //   LEFT JOIN student s ON sssrd.student_id = s.id
    //   ORDER BY sssrd.id
    //   LIMIT ${limit} OFFSET ${offset};
    // `);

    // const totalResult = await prisma.$queryRawUnsafe<any[]>(`
    //   SELECT COUNT(*) AS count FROM session_sheet_student_report_detail;
    // `);

    const STATUS_LABELS: Record<SessionSheetStatus, string> = {
      Completed: 'Completed',
      HaveDoubt: 'Have doubt',
      Incomplete: 'inComplete',
      NotMarked: 'Not Marked',
    };

    const transformedRecords = await prisma.sessionSheetStudentReportDetail.findMany({
      where: {
        session_sheet_id: req.query.session_sheet_id as string,
        session_index_id : req.query.session_index_id as string,
        deletedAt: null,
        ...(req.query.search_keyword && {
          status: {
            in: Object.keys(STATUS_LABELS).filter(
              key => STATUS_LABELS[key as SessionSheetStatus].toLowerCase().includes(req.query.search_keyword!.toString().toLowerCase())
            ) as SessionSheetStatus[]
          }
        }),
      },
      select: {
        id: true,
        student_id: true,
        status: true,
        session_sheet_id: true,
        session_index_id: true,
        student: {
          select: {
            name: true,
            profile_img_url: true,
            roll_number: true,
          },
        },
      }
    });

    const records = transformedRecords.map((record) => ({
      // ...record,
      id: record.id,
      student_id: record.student_id,
      student_name: record.student?.name,
      student_profile: record.student?.profile_img_url,
      roll_number: record.student?.roll_number,
      status: STATUS_LABELS[record.status], // ✅ user-friendly display
    }));

    // const totalRecords = parseInt(records[0].count, 10);
    const totalRecords = await prisma.sessionSheetStudentReportDetail.count({
      where: {
        session_sheet_id: req.query.session_sheet_id as string,
        deletedAt: null,
      }
    });
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          totalPages,
          totalRecords,
        },
      },
      message: 'Session sheet data fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching session sheet report:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
