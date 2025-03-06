import { prisma } from "../../config/database";

export const getBatchStudents = async (
  batchId: string,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  // Fetch batch with students
  const batch = await prisma.createBatch.findUnique({
    where: { id: batchId, deletedAt: null },
    select: {
      students: {
        skip,
        take: limit,
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
  });

  // Throw error if batch not found
  if (!batch) throw new Error("Batch not found");

  // Extract students from relation
  const students = batch.students.map((s) => s.student);

  // Get total count of students in the batch
  const totalStudents = await prisma.batchStudent.count({
    where: { batch_id: batchId },
  });

  return {
    students,
    currentPage: page,
    totalPages: Math.ceil(totalStudents / limit),
    totalStudents,
  };
};
