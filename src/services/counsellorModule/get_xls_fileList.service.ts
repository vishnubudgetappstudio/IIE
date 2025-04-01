import { prisma } from "../../config/database";
import { formatDateTime } from "../../utils/commonUtils";
import { AppError } from "../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../utils/s3";


export const getXLSFileListService = async ({
    counsellorId,
    search,
    page,
    limit,
}: {
    counsellorId: string;
    search?: string;
    page: number;
    limit: number;
}): Promise<{
    xls_files: { xls_file_name: string; xls_file_size: string; createdAt: string }[];
    xls_files_count: number;
    totalPages: number;
    perPage: number;
    currentPage: number;
}> => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;

    // ✅ Count total records for pagination
    const xls_files_count = await prisma.xlsFileDetail.count({
        where: {
            management_staff_id: counsellorId,
            deletedAt: null,
            xls_file_name: { startsWith: search, },
        },
    });

    if (xls_files_count === 0) {
        throw new AppError({
            statusCode: 400,
            data: [],
            message: "No XLS files found",
        });
    }
    const responseList = await prisma.xlsFileDetail.findMany({
        where: {
            management_staff_id: counsellorId,
            deletedAt: null,
            xls_file_name: { startsWith: search },
        },
        select: {
            xls_file_name: true,
            xls_file_url: true,
            createdAt: true
        },
        orderBy: { createdAt: "desc" }, // Sort by latest uploads
        take: perPage,
        skip: (currentPage - 1) * perPage, // Pagination logic
    });

    if (!responseList?.length) {
        throw new AppError({
            statusCode: 400,
            data: [],
            message: "No xls files found",
        });
    }

    // ✅ Fetch S3 file sizes in parallel using `Promise.all`
    const xlsFiles = await Promise.all(
        responseList.map(async (xlsFile) => {
            const { FileSize } = await extractS3BucketAndKeySize({ fileUrl: xlsFile.xls_file_url });

            return {
                xls_file_name: xlsFile.xls_file_name,
                xls_file_url: xlsFile.xls_file_url,
                xls_file_size: FileSize,
                createdAt: formatDateTime(xlsFile.createdAt),
            };
        })
    );

    // ✅ Compute total pages
    const totalPages = Math.ceil(xls_files_count / perPage);

    return {
        xls_files: xlsFiles,
        xls_files_count,
        totalPages,
        currentPage,
        perPage
    };
};