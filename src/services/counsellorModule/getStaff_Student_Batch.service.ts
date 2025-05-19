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
      // return prisma.student.findMany({
      //   orderBy: { createdAt: "desc" },
      //   where: { deletedAt: null }, // Exclude soft deleted records
      //   select: { id: true, name: true },
      // });
      const students = await prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          batchWithStudentModel: {
            where: { deletedAt: null }, // Exclude soft deleted records
            select: { student_id: true }, // Just check existence (replace with a valid field)
          },
        },
      });

      // Add is_batch flag
      return students.map((student) => ({
        id: student.id,
        name: student.name,
        is_batch: student.batchWithStudentModel.length > 0,
      }));

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
