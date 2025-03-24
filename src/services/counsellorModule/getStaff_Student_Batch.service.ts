import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";


export const getStaff_Student_BatchService = async (search: string) => {
  switch (search.toLowerCase()) {
    case "staff":
      return prisma.managementStaff.findMany({
        orderBy: { createdAt: "desc" },
        where: { role: "staff", deletedAt: null }, // Exclude soft deleted records
        select: { id: true, name: true, profile_img_url: true },
      });

    case "student":
      return prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null }, // Exclude soft deleted records
        select: { id: true, name: true },
      });

    case "batch":
      return prisma.batchDetail.findMany({
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null }, // Exclude soft deleted records
        select: { id: true, batch_number: true, batchName: true },
      });

    default:
      throw new AppError({
        statusCode: 400,
        data: [], // Always send an empty object
        message: "Invalid search parameter. Use 'staff', 'student', or 'batch'",
      });
  }
};
