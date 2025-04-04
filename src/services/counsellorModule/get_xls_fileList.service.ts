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

    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;

    const whereCondition = {
        management_staff_id: counsellorId,
        deletedAt: null,
        ...(search && {
            xls_file_name: {
                startsWith: search,
                mode: "insensitive",
            },
        }),
    };

    // Count total
    const xls_files_count = await prisma.xlsFileDetail.count({ where: whereCondition });

    if (xls_files_count === 0) {
        throw new AppError({
            statusCode: 400,
            data: [],
            message: "No XLS files found",
        });
    }

    // Fetch paginated file list
    const responseList = await prisma.xlsFileDetail.findMany({
        where: whereCondition,
        select: {
            xls_file_name: true,
            xls_file_url: true,
            createdAt: true,
        },
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" }, // Fallback sort for consistency
        ],
        take: perPage,
        skip,
    });

    // Parallel S3 size fetch
    const xlsFiles = await Promise.all(
        responseList.map(async (file) => {
            const { FileSize } = await extractS3BucketAndKeySize({
                fileUrl: file.xls_file_url,
            });

            return {
                xls_file_name: file.xls_file_name,
                xls_file_size: FileSize,
                createdAt: formatDateTime(file.createdAt),
            };
        })
    );

    return {
        xls_files: xlsFiles,
        xls_files_count,
        totalPages: Math.ceil(xls_files_count / perPage),
        currentPage,
        perPage,
    };
};
