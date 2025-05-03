import { BatchSlotsType } from "@prisma/client";
import { prisma } from "../../config/database";

export const getAllBatchesListService = async ({
    limit,
    page,
    slot,
    search,
    mentorId,
}: {
    page: number;
    limit: number;
    slot: "all" | BatchSlotsType;
    search: string | null;
    mentorId?: string | null;
}) => {
    // Validate pagination
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    // Normalize mentorId
    const isValidMentorId = mentorId && mentorId.trim() !== "" && mentorId !== "all" && mentorId !== "null";

    // Build where clause
    const whereCondition: any = {
        deletedAt: null,
    };

    if (isValidMentorId) {
        whereCondition.management_staff_id = mentorId;
    }

    if (slot !== "all") {
        whereCondition.slot = slot;
    }

    if (searchTerm) {
        whereCondition.OR = [
            { batch_number: { startsWith: searchTerm } },
            { course: { startsWith: searchTerm } },
            {
                management_staff_relation: {
                    is: {
                        name: { startsWith: searchTerm },
                    },
                },
            },
        ];
    }

    // Fetch batch data
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

    // Format batches
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
