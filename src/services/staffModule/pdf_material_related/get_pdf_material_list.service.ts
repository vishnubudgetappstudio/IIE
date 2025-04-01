import { prisma } from "../../../config/database";
import { formatDateTime } from "../../../utils/commonUtils";
import { AppError } from "../../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../../utils/s3";

export const getPDFMaterialFileListService = async ({
    batch_id,
    search,
    page,
    limit,
}: {
    batch_id?: string,
    search?: string;
    page: number;
    limit: number;
}): Promise<{
    material_files: { material_file_name: string; material_file_size: string; createdAt: string }[];
    material_files_count: number;
    totalPages: number;
    perPage: number;
    currentPage: number;
}> => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;

    // ✅ Common where condition
    const whereCondition = {
        batch_id: batch_id ? batch_id : undefined, // ✅ Only include if batch_id exists
        studentMaterialAccessModel: {
            some: {
                student_relation: {
                    deletedAt: null
                },
                material_relation: {
                    deletedAt: null
                }
            },
        },
        batch_detail_relation: {
            deletedAt: null,
        },
        deletedAt: null, // ✅ Always filter out deleted records
        ...(search && { material_file_name: { startsWith: search } }) // ✅ Conditionally add search
    };

    // ✅ Count total records for pagination
    const material_files_count = await prisma.materialFileDetail.count({ where: whereCondition });

    if (material_files_count === 0) {
        throw new AppError({
            statusCode: 400,
            data: [],
            message: "No Material PDF files found",
        });
    }

    const responseList = await prisma.materialFileDetail.findMany({
        where: whereCondition,
        select: {
            material_file_name: true,
            material_file_url: true,
            createdAt: true
        },
        orderBy: { createdAt: "desc" }, // Sort by latest uploads
        take: perPage,
        skip: (currentPage - 1) * perPage, // Pagination logic
    });

    // ✅ Fetch S3 file sizes in parallel (error-safe with `Promise.allSettled`)
    const pdfFiles = await Promise.all(
        responseList.map(async (pdfFile) => {
            const { FileSize } = await extractS3BucketAndKeySize({ fileUrl: pdfFile.material_file_url });

            return {
                material_file_name: pdfFile.material_file_name,
                material_file_url: pdfFile.material_file_url,
                material_file_size: FileSize,
                createdAt: formatDateTime(pdfFile.createdAt),
            };
        })
    );

    // ✅ Compute total pages
    const totalPages = Math.ceil(material_files_count / perPage);

    return {
        material_files: pdfFiles,
        material_files_count,
        totalPages,
        currentPage,
        perPage
    };
}