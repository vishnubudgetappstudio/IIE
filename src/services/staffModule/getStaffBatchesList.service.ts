import { prisma } from "../../config/database"; // Adjust based on your setup
import { BatchSlotsType } from "@prisma/client";
import { parse, format } from 'date-fns';

export const getStaffBatchesListService = async ({
    page,
    limit,
    slot,
    search,
    mentorId,
    userId,
    mentorIds,
}: {
    page: number;
    limit: number;
    slot: "all" | BatchSlotsType;
    search: string | null;
    mentorId?: string;
    userId?: string;
    mentorIds?: string[];
}) => {
    const currentPage = page > 0 ? page : 1;
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    const whereCondition: any = {
        deletedAt: null,
        mentor_id: userId,
        ...(mentorIds
            ? { management_staff_id: { in: mentorIds } }
            : mentorId
            ? { management_staff_id: mentorId }
            : {}),
        ...(slot !== "all" && { slot }),
        ...(search && {
            OR: [
                { batch_number: { startsWith: searchTerm } },
                { course: { startsWith: searchTerm } },
                {
                    management_staff_relation: {
                        is: {
                            name: { startsWith: searchTerm },
                        },
                    },
                },
            ],
        }),
    };

    const now = new Date();

    // Update completed batches
    const batchesToUpdate = await prisma.batchDetail.findMany({
        where: {
            deletedAt: null,
            batch_status: { not: "complete" },
            to_date: { lte: now.toISOString().split("T")[0] },
            end_time: { lte: now.toTimeString().split(" ")[0] },
        },
    });

      // ✅ Reset is_marked if updatedAt is not today
    await prisma.batchDetail.updateMany({
        where: {
            is_marked: true,
            NOT: {
                updatedAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // start of today
                },
            },
        },
        data: {
            is_marked: false,
        },
    });

    for (const batch of batchesToUpdate) {
        await prisma.batchDetail.update({
            where: { id: batch.id },
            data: { batch_status: "complete" },
        });
    }

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

    const total = await prisma.batchDetail.count({ where: whereCondition });

    const formattedBatches = batches.map((batch) => {
        const formatDate = (dateStr: string | null) => {
            try {
                if (!dateStr) return null;
                const parsedDate = parse(dateStr, "dd/MM/yyyy", new Date());
                return format(parsedDate, "dd MMM, yyyy");
            } catch {
                return dateStr; // fallback if invalid
            }
        };

        return {
            id: batch.id,
            batch_number: batch.batch_number,
            batchName: batch.batchName,
            from_date: formatDate(batch.from_date),
            to_date: formatDate(batch.to_date),
            start_time: batch.start_time,
            end_time: batch.end_time,
            batch_status: batch.batch_status,
            course: batch.course,
            slot: batch.slot,
            is_marked: batch.is_marked,
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
        };
    });

    return { batches: formattedBatches, total };
};
