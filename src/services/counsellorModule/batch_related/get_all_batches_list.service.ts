import { BatchSlotsType } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { prisma } from "../../../config/database";

export const getAllBatchesListService = async (page: number, limit: number, slot: "all" | BatchSlotsType) => {

    if (page < 1 || limit < 1) {
        throw new AppError({
            statusCode: 400, // Bad Request
            message: "Page and limit must be greater than zero.",
            data: {},
        });
    }

    const skip = (page - 1) * limit;

    // Fetch batches with pagination
    const batches = await prisma.batchDetail.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // Order by latest created
        where: slot === "all"
            ? {
                deletedAt: null,
            }
            : {
                slot: slot as BatchSlotsType,
                deletedAt: null
            }, // Filters slot only if not "all" and Exclude soft deleted records
        include: {
            management_staff_relation: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_img_url: true, // Assuming this field exists
                },
            },
            batchWithStudentModel: {
                include: {
                    student_relation: {
                        select: {
                            profile_img_url: true,
                        },
                    },
                },
            },
        },
    }).catch(err => {
        console.error({ err });
        throw new AppError({
            statusCode: 400,
            data: [],
            message: "Failed to retrieve batches",
        });
    });

    // Get total count
    const total = await prisma.batchDetail.count({
        where: slot === "all" ? { deletedAt: null } : { slot: slot as BatchSlotsType, deletedAt: null }, // Filters slot only if not "all" and Exclude soft deleted records
    });

    // Transform response to match required format
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
        // ✅ Count only students where deletedAt is null
        students_count: batch.batchWithStudentModel.filter(s => s.deletedAt === null).length,
        student_image: batch.batchWithStudentModel
            .filter(s => s.deletedAt === null) // ✅ Include only active students
            .map((s) =>
                s.student_relation?.profile_img_url ? s.student_relation.profile_img_url : "null"
            )
            .join(","), // Extract profile_img_url only
        mentor: { ...batch.management_staff_relation, progress: null }, // Mentor stays the same
    }));

    return { batches: formattedBatches, total };
};