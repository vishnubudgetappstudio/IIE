import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const getBatchStudents = async (
  batchId: string,
  page: number,
  limit: number,
  searchQuery?: string
) => {
  // Apply default values if page or limit is undefined
  const currentPage = page && page > 0 ? page : 1;
  const perPage = limit && limit > 0 ? limit : 10;
  const skip = (currentPage - 1) * perPage;

  // Use Prisma transaction to execute both queries in parallel
  const [batch, totalStudents] = await prisma.$transaction([
    prisma.createBatch.findUnique({
      where: { id: batchId, deletedAt: null },
      select: {
        students: {
          skip,
          take: perPage,
          where: searchQuery
            ? {
              student: {
                name: {
                  contains: searchQuery, // Removed mode, it defaults to case-sensitive
                },
              },
            }
            : undefined, // If no search, keep it undefined
          select: {
            student: {
              select: {
                id: true,
                name: true,
                roll_number: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    }),

    prisma.batchStudent.count({
      where: {
        batch_id: batchId,
        student: searchQuery
          ? {
            name: {
              contains: searchQuery, // Removed mode to match Prisma's strict typing
            },
          }
          : undefined,
      },
    }),
  ]);

  // If batch is not found, throw an error
  if (!batch) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
  }

  // Extract student data
  const students = batch.students.map((s) => s.student);

  return {
    students,
    currentPage: page,
    totalPages: Math.ceil(totalStudents / limit),
    totalStudents,
  };
};