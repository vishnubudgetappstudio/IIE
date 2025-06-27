import { BatchSlotsType } from "@prisma/client";
import { AppError } from "../../../utils/errorHandler";
import { prisma } from "../../../config/database";
import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";

export const getAllBatchesListService = async ({
    limit, page, slot, search, userId, branch
}: {
    page: number,
    limit: number,
    slot: "all" | BatchSlotsType,
    search: string | null,
    userId?: string, // Optional userId for future use
    branch?: string, // Optional branch for future use
}) => {
    // Apply default values if page or limit is undefined
    const currentPage = page && page > 0 ? page : 1; 
    const perPage = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;
    const searchTerm = search?.trim();

    const staffIds = await prisma.managementStaff.findMany({
        where: {
            branch: branch || undefined, // Use branch if provided
            deletedAt: null,
            role: "staff", // Assuming you want to filter by mentor role
        },
        select: {
            id: true,
        },
    });

    const staffIdList = staffIds.map((staff) => staff.id);

    // Shared where condition
    const whereCondition = {
        deletedAt: null,
        mentor_id: userId,
        OR: [
            { management_staff_relation: { id: { in: staffIdList } } },
        ],
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
    // const formattedBatches = batches.map((batch) => ({
    //     id: batch.id,
    //     batch_number: batch.batch_number,
    //     batchName: batch.batchName,
    //     from_date: batch.from_date,
    //     to_date: batch.to_date,
    //     course: batch.course,
    //     slot: batch.slot,
    //     createdAt: batch.createdAt,
    //     updatedAt: batch.updatedAt,
    //     deletedAt: batch.deletedAt,
    //     students_count: batch.batchWithStudentModel.length,
    //     student_image: batch.batchWithStudentModel
    //         .map((s) => s.student_relation?.profile_img_url ?? "null")
    //         .join(","),
    //     mentor: {
    //         ...batch.management_staff_relation,
    //         progress: null,
    //     },
    // }));

    const extractStatusesFromCSV = async (url: string): Promise<string[]> => {
    const res = await fetch(url);
    if (!res.ok) return [];

    const buffer = await res.buffer();
    const stream = Readable.from(buffer.toString());

    return new Promise((resolve, reject) => {
        const statuses: string[] = [];
        stream
        .pipe(csv())
        .on("data", (row) => {
            if (row.Status) {
            statuses.push(row.Status.trim().toLowerCase());
            }
        })
        .on("end", () => resolve(statuses))
        .on("error", reject);
    });
    };

    const formattedBatches = await Promise.all(
    batches.map(async (batch) => {
        const sessionDetails = await prisma.sessionSheetDetail.findMany({
        where: { batch_id: batch.id },
        select: { session_file_url: true },
        });

        let total = 0;
        let completed = 0;

        for (const session of sessionDetails) {
        if (session.session_file_url) {
            const statuses = await extractStatusesFromCSV(session.session_file_url);
            total += statuses.length;
            completed += statuses.filter((s) => s === "completed").length;
        }
        }

        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
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
            progress: progress, // ✅ based on CSV Status column
        },
        };
    })
    );

    return { batches: formattedBatches, total };
};
