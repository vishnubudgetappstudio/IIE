import { prisma } from "../../config/database";
import { z } from "zod";
import { AppError } from "../../utils/errorHandler";



export const addStudentToBatch = async (batchId: string, studentId: string) => {

  // Check if batch exists
  const batch = await prisma.createBatch.findUnique({
    where: { id: batchId, deletedAt: null },
  });

  if (!batch) {
    // throw new Error("Batch not found");
    throw new AppError({ statusCode: 404, data: {}, message: "Batch not found" });
  }

  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId, deletedAt: null },
  });

  if (!student) {
    // throw new Error("Student not found");
    throw new AppError({ statusCode: 404, data: {}, message: "Student not found" });
  }

  // Check if student is already in the batch
  const existingEntry = await prisma.batchStudent.findFirst({
    where: { batch_id: batchId, student_id: studentId },
  });

  if (existingEntry) {
    // throw new Error("Student is already in this batch");
    throw new AppError({ statusCode: 409, data: {}, message: "This Student is already in this Batch" });
  }

  // Add student to batch
  await prisma.batchStudent.create({
    data: { batch_id: batchId, student_id: studentId },
  });

  return { message: "Student added to batch successfully" };
};
