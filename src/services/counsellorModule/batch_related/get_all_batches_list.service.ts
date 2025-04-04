import { BatchSlotsType } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { prisma } from "../../../config/database";

export const getAllBatchesListService = async ({
    limit, page, slot, search
}: {
    page: number,
    limit: number,
    slot: "all" | BatchSlotsType,
    search: string | null
}) => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1;
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    // Shared where condition
    const whereCondition = {
        deletedAt: null,
        ...(slot !== "all" && { slot }),
        ...(search && {
            OR: [
                { batch_number: { startsWith: searchTerm } },
                { course: { startsWith: searchTerm } },
                {
                    management_staff_relation: {
                        is: {
                            name: { startsWith: searchTerm },
                        }
                    },
                },
            ],
        }),
    };

    // Fetch batches
    const batches = await prisma.batchDetail.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
        where: whereCondition,
        include: {
            management_staff_relation: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_img_url: true,
                },
            },
            batchWithStudentModel: {
                where: { deletedAt: null },
                include: {
                    student_relation: {
                        select: {
                            profile_img_url: true,
                        },
                    },
                },
            },
        },
    });

    // Count total
    const total = await prisma.batchDetail.count({
        where: whereCondition,
    });

    // Format response
    const formattedBatches = batches.map((batch) => ({
        id: batch.id,
        batch_number: batch.batch_number,
        batchName: batch.batchName,
        from_date: batch.from_date,
        to_date: batch.to_date,
        course: batch.course,
        slot: batch.slot,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        deletedAt: batch.deletedAt,
        students_count: batch.batchWithStudentModel.length,
        student_image: batch.batchWithStudentModel
            .map((s) => s.student_relation?.profile_img_url ?? "null")
            .join(","),
        mentor: {
            ...batch.management_staff_relation,
            progress: null,
        },
    }));

    return { batches: formattedBatches, total };
};
