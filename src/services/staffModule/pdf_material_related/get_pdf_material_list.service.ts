import { prisma } from "../../../config/database";
import { formatDateTime } from "../../../utils/commonUtils";
import { AppError } from "../../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../../utils/s3";

interface PDFMaterialFile {
    material_file_name: string;
    material_file_size: string;
    createdAt: string;
    material_file_id: string;
    material_file_url: string;
    batch_id?: string;
    batch_name?: string;
    status: string;
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
    role,
    search,
    userId,
    page,
    limit,
}: {
    batch_id?: string;
    search?: string;
    role?: string;
    page: number;
    userId?: string;
    limit: number;
}): Promise<PDFMaterialResponse> => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    console.log("Batch ID:", batch_id);
    // console.log("Search Term:", searchTerm);
    console.log("Role:", role);

    if (role !== "counsellor") {
        var whereCondition: any = {
            deletedAt: null,
            staff_id: userId,

            ...(searchTerm && {
                material_title: {
                    contains: searchTerm,
                    // mode: "insensitive", // Optional: for PostgreSQL case-insensitive search
                },
            }),

            ...(batch_id && { batch_id }),

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
    } else {
        var whereCondition: any = {
            deletedAt: null,
            batch_id: batch_id,

            ...(searchTerm && {
                material_title: {
                    contains: searchTerm,
                    // mode: "insensitive", // Optional: for PostgreSQL case-insensitive search
                },
            }),

            // ...(batch_id && { batch_id }),

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
    }

    console.log("Where Condition:", whereCondition);

    const [material_files_count, draft_files_count] = await Promise.all([
        prisma.materialFileDetail.count({ where: whereCondition }),
        prisma.materialFileDetail.count({
            where: {
                status: "draft",
                deletedAt: null,
            },
        }),
    ]);

    const totalFiles = material_files_count + draft_files_count;

    if (totalFiles === 0) {
        throw new AppError({
            statusCode: 404,
            message: "No material PDF files found.",
            data: [],
        });
    }

    // const [activeFiles, draftFiles] = await Promise.all([
    //     prisma.materialFileDetail.findMany({
    //         where: whereCondition,
    //         select: {
    //             id: true,
    //             material_title: true,
    //             material_file_url: true,
    //             batch_id: true,
    //             createdAt: true,
    //             status: true,
    //         },
    //         orderBy: { createdAt: "desc" },
    //         skip,
    //         take: perPage,
    //     }),
    //     prisma.materialFileDetail.findMany({
    //         where: { status: "draft", deletedAt: null },
    //         select: {
    //             id: true,
    //             material_title: true,
    //             material_file_url: true,
    //             batch_id: true,
    //             createdAt: true,
    //             status: true,
    //         },
    //         orderBy: { createdAt: "desc" },
    //     }),
    // ]);

    const [activeGroup, draftGroup] = await Promise.all([
        prisma.materialFileDetail.groupBy({
            by: ['material_title'],
            where: whereCondition,
            _max: { createdAt: true },
            orderBy: {
                _max: {
                    createdAt: 'desc',
                },
            },
        }),
        prisma.materialFileDetail.groupBy({
            by: ['material_title'],
            where: { status: 'draft', deletedAt: null },
            _max: { createdAt: true },
            orderBy: {
                _max: {
                    createdAt: 'desc',
                },
            },
        }),
    ]);

    const [activeFiles, draftFiles] = await Promise.all([
        prisma.materialFileDetail.findMany({
            where: {
                OR: activeGroup
                    .filter(g => g._max.createdAt !== null)
                    .map(g => ({
                        material_title: g.material_title,
                        createdAt: g._max.createdAt as Date,
                    })),
            },
            select: {
                id: true,
                material_title: true,
                material_file_url: true,
                batch_id: true,
                createdAt: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
        }),
        prisma.materialFileDetail.findMany({
            where: {
                OR: draftGroup
                    .filter(g => g._max.createdAt !== null)
                    .map(g => ({
                        material_title: g.material_title,
                        createdAt: g._max.createdAt as Date,
                    })),
            },
            select: {
                id: true,
                material_title: true,
                material_file_url: true,
                batch_id: true,
                createdAt: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const allFiles = [...activeFiles, ...draftFiles];

    const resolvedFiles = await Promise.allSettled(
  allFiles.map(async (file) => {
    const { FileSize } = await extractS3BucketAndKeySize({
      fileUrl: file.material_file_url,
    });

    // Fetch all batches for this material title
    const batches = await prisma.materialFileDetail.findMany({
      where: { material_title: file.material_title },
      select: {
        batch_detail_relation: {  // Assuming you have a relation named 'batchDetail' to get batch info
          select: {
            batchName: true,
          },
        },
      },
    });

    // Extract batch names and join with comma
    const batchNames = batches
      .map(b => b.batch_detail_relation?.batchName)
      .filter(Boolean) // remove null/undefined
      .filter((v, i, a) => a.indexOf(v) === i) // unique names
      .join(', ');

    return {
      material_file_id: file.id,
      material_file_name: file.material_title,
      material_file_url: file.material_file_url,
      material_file_size: FileSize,
      batch_id: file.batch_id,
      batch_name: batchNames || 'Unknown',  // multiple batch names comma-separated
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
