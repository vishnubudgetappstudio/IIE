import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../../../config/database";
import { extractS3BucketAndKeySize } from "../../../utils/s3";
import s3 from "../../../config/s3Config";
import { AppError } from "../../../utils/errorHandler";
import { formatDateTime, parseCSVStream } from "../../../utils/commonUtils";
import { Readable } from "stream";

export const getSessionSheetDataService = async ({
    batch_id,
    search,
    page,
    limit,
}: {
    batch_id: string;
    search?: string;
    page: number;
    limit: number;
}): Promise<{
    session_file_name: string;
    session_file_size: string;
    session_sheet_data: any[];
    createdAt: string;
    totalRecords: number;
    totalPages: number;
    currentPage: number;
}> => {
    // ✅ Fetch session sheet URL from database
    const sessionSheet = await prisma.sessionSheetDetail.findFirst({
        where: { batch_id, deletedAt: null },
        select: {
            session_file_name: true,
            session_file_url: true,
            createdAt: true
        },
    });

    if (!sessionSheet?.session_file_url) {
        throw new AppError({ statusCode: 404, message: "Session sheet not found for the given batch.", data: {} });
    }

    // ✅ Extract S3 details
    const { Bucket, Key, FileSize } = await extractS3BucketAndKeySize({ fileUrl: sessionSheet.session_file_url });
    // console.log(`📥 Fetching CSV from S3: ${Bucket}/${Key}`);

    // ✅ Fetch file from S3
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await s3.send(command);

    if (!response.Body) {
        throw new AppError({ statusCode: 400, message: "Failed to retrieve file from S3.", data: {} });
    }

    // ✅ Parse CSV data from the S3 stream
    const allData = await parseCSVStream(response.Body as Readable).catch((error) => {
        console.error("❌ Error parsing CSV from S3:", error);
        throw new AppError({ statusCode: 400, message: "Failed to parse CSV file from S3." });
    });

    // ✅ Search Filtering with Explicit Type Casting
    const filteredData = search
        ? allData.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(search.toLowerCase())
            )
        )
        : allData;

    // ✅ Pagination Logic
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

    return {
        session_file_name: sessionSheet.session_file_name,
        session_file_size: FileSize,
        createdAt: formatDateTime(sessionSheet.createdAt),
        session_sheet_data: paginatedData,
        totalRecords,
        totalPages,
        currentPage: page,
    };
};