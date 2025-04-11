import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const getStaff_Student_BatchService = async (search: string) => {
  const keyword = search.toLowerCase();

  switch (keyword) {
    case "staff":
      return await prisma.managementStaff.findMany({
        orderBy: { createdAt: "desc" },
        where: { role: "staff", deletedAt: null },
        select: {
          id: true,
          name: true,
          profile_img_url: true,
        },
      });

    case "student": {
      const assignedStudents = await prisma.batchWithStudent.findMany({
        where: { deletedAt: null },
        select: { student_id: true },
      });

      const assignedIds = assignedStudents.map((s) => s.student_id);

      const unassignedStudents = await prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        where: {
          deletedAt: null,
          id: { notIn: assignedIds },
        },
        select: {
          id: true,
          name: true,
          // profile_img_url: true, // 👉 include more fields if needed
        },
      });

      return unassignedStudents;
    }

    case "batch":
      return await prisma.batchDetail.findMany({
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
        select: {
          id: true,
          batch_number: true,
          batchName: true,
        },
      });

    default:
      throw new AppError({
        statusCode: 400,
        message: "Invalid search parameter. Use 'staff', 'student', or 'batch'.",
        data: [],
      });
  }
};
