import { prisma } from "../../config/database";


export const getStaff_Student_BatchService = async (search: string) => {
  switch (search.toLowerCase()) {
    case "staff":
      return prisma.managementStaff.findMany({
        where: { deletedAt: null }, // Exclude soft deleted records
        select: { id: true, name: true },
      });

    case "student":
      return prisma.student.findMany({
        where: { deletedAt: null }, // Exclude soft deleted records
        select: { id: true, name: true },
      });

    case "batch":
      return prisma.createBatch.findMany({
        where: { deletedAt: null }, // Exclude soft deleted records
        select: { id: true, batch_number: true, batchName: true },
      });

    default:
      throw new Error(
        "Invalid search parameter. Use 'staff', 'student', or 'batch'"
      );
  }
};
