import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const getAllBatches = async (page: number, limit: number) => {

  if (page < 1 || limit < 1) {
    throw new AppError({
      statusCode: 400, // Bad Request
      message: "Page and limit must be greater than zero.",
      data: {},
    });
  }

  const skip = (page - 1) * limit;

  // Fetch batches with pagination
  const batches = await prisma.createBatch.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" }, // Order by latest created
    where: { deletedAt: null }, // Exclude soft deleted records
    include: {
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_img_url: true, // Assuming this field exists
        },
      },
      students: {
        include: {
          student: {
            select: {
              profile_img_url: true,
            },
          },
        },
      },
    },
  }).catch(err => {
    throw new AppError({
      statusCode: 500, // Internal Server Error
      data: [],
      message: "Failed to retrieve batches",
    });
  });

  // Get total count
  const total = await prisma.createBatch.count({
    where: { deletedAt: null },
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
    session_sheet: batch.session_sheet,
    mentor_id: batch.mentor_id,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    deletedAt: batch.deletedAt,
    student_image: batch.students
      .map((s) =>
        s.student.profile_img_url ? s.student.profile_img_url : "null"
      )
      .join(","), // Extract profile_img_url only
    mentor: { ...batch.mentor, progress: null }, // Mentor stays the same
  }));

  return { batches: formattedBatches, total };
};
