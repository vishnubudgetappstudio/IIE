import { prisma } from "../../config/database";
import { formatDateTime } from "../../utils/commonUtils";
import { AppError } from "../../utils/errorHandler";
import { extractS3BucketAndKeySize } from "../../utils/s3";
import { formatDistanceToNow } from 'date-fns';

// ✅ Define Type for Request Parameters
interface GetStudentStudyMaterialsParams {
    student_id: string;
    search?: string;
    page?: number;
    limit?: number;
}

// ✅ Define Type for Material File Response
interface MaterialFile {
    material_file_title: string;
    material_file_size: string;
    createdAt: string;
}

// ✅ Define Type for Service Response
interface GetStudentStudyMaterialsResponse {
    material_files: MaterialFile[];
    material_files_count: number;
    totalPages: number;
    perPage: number;
    currentPage: number;
}

export const getStudentStudyMaterialsService = async ({
    student_id,
    search,
    page,
    limit,
}: GetStudentStudyMaterialsParams): Promise<GetStudentStudyMaterialsResponse> => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    if (!student_id) throw new AppError({
        statusCode: 400,
        message: "Student ID is required",
        data: [],
    });

    const existingStudent = await prisma.student.findUnique({
        where: { id: student_id, deletedAt: null },
        select: { id: true },
    });

    if (!existingStudent) throw new AppError({
        statusCode: 404,
        message: "Student not found",
        data: [],
    });

    // ✅ Common where condition
    const whereCondition = {
        studentMaterialAccessModel: {
            some: {
                student_id,
                access_granted: true,
                student_relation: { id: student_id, deletedAt: null },
            }
        },
        batch_detail_relation: {
            batchWithStudentModel: {
                some: { student_id, deletedAt: null }
            },
            deletedAt: null,
        },
        deletedAt: null,
        ...(search && { material_title: { startsWith: searchTerm } }) // ✅ Conditionally add search
    };

    // ✅ Fetch paginated material files
    console.log({ student_id })
    const responseList = await prisma.materialFileDetail.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" }, // Sort by latest uploads
        skip,
        take: perPage, // Pagination logic
    });

    // ✅ Fetch S3 file sizes in parallel (error-safe with `Promise.allSettled`)
    const pdfFiles = await Promise.all(
        responseList.map(async (pdfFile) => {
            const { FileSize } = await extractS3BucketAndKeySize({ fileUrl: pdfFile.material_file_url });

            return {
                material_file_title: pdfFile.material_title,
                material_file_url: pdfFile.material_file_url,
                material_file_size: FileSize,
                createdAt: formatDateTime(pdfFile.createdAt),
                distanceToNow: `${formatDistanceToNow(pdfFile.createdAt)} ago`,
            };
        })
    );

    // ✅ Get total count for pagination
    const material_files_count: number = await prisma.materialFileDetail.count({ where: whereCondition });

    if (material_files_count === 0) {
        throw new AppError({
            statusCode: 404,
            message: "study material files not found!",
            data: [],
        });
    }

    // ✅ Compute total pages
    const totalPages = Math.ceil(material_files_count / perPage);

    return {
        material_files: pdfFiles,
        material_files_count,
        totalPages,
        currentPage,
        perPage,
    };
};
