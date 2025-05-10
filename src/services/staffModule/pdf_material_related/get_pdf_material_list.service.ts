import { prisma } from "../../../config/database";
import { formatDateTime } from "../../../utils/commonUtils";
import { AppError } from "../../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../../utils/s3";

interface PDFMaterialFile {
    material_file_name: string;
    material_file_size: string;
    createdAt: string;
}

interface PDFMaterialResponse {
    material_files: PDFMaterialFile[];
    material_files_count: number;
    totalPages: number;
    perPage: number;
    currentPage: number;
}

export const getPDFMaterialFileListService = async ({
    batch_id,
    search,
    userId,
    page,
    limit,
}: {
    batch_id?: string;
    search?: string;
    page: number;
    userId?: string;
    limit: number;
}): Promise<PDFMaterialResponse> => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    const whereCondition: any = {
        deletedAt: null,
        staff_id : userId,
       // ...(batch_id && { batch_id }),
        ...(searchTerm && { material_file_name: { startsWith: searchTerm } }),
        studentMaterialAccessModel: {
            some: {
                student_relation: { deletedAt: null },
                material_relation: { deletedAt: null },
            },
        },
        batch_detail_relation: {
            deletedAt: null,
        },
    };

    const [material_files_count, draft_files_count] = await Promise.all([
        prisma.materialFileDetail.count({ where: whereCondition }),
        prisma.materialFileDetail.count({
            where: { status: "draft", deletedAt: null },
        }),
    ]);

    const totalFiles = material_files_count + draft_files_count;
    console.log("Total Files: ", totalFiles);

    if (totalFiles === 0) {
        throw new AppError({
            statusCode: 404,
            message: "No material PDF files found.",
            data: [],
        });
    }

    const [activeFiles, draftFiles] = await Promise.all([
        prisma.materialFileDetail.findMany({
            where: whereCondition,
            select: {
                id: true,
                material_title: true,
                material_file_url: true,
                createdAt: true,
                status: true,

            },
            orderBy: { createdAt: "desc" },
            skip,
            take: perPage,
        }),
        prisma.materialFileDetail.findMany({
            where: { status: "draft", deletedAt: null },
            select: {
                id: true,
                material_title: true,
                material_file_url: true,
                createdAt: true,
                status: true,
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    const allFiles = [...activeFiles, ...draftFiles];


    const resolvedFiles = await Promise.allSettled(
        allFiles.map(async (file) => {
            const { FileSize } = await extractS3BucketAndKeySize({ fileUrl: file.material_file_url });
            return {
                material_file_id: file.id,
                material_file_name: file.material_title,
                material_file_url: file.material_file_url,
                material_file_size: FileSize,
                createdAt: formatDateTime(file.createdAt),
                status: file.status,
            };
        })
    );

    const material_files: PDFMaterialFile[] = resolvedFiles
        .filter((res) => res.status === "fulfilled")
        .map((res) => (res as PromiseFulfilledResult<PDFMaterialFile>).value);

    return {
        material_files,
        material_files_count,
        totalPages: Math.ceil(totalFiles / perPage),
        currentPage,
        perPage,
    };
};
