import { prisma } from "../../config/database";
import { z } from "zod";

const removeStudentToBatchSchema = z.object({
  batchId: z.string().uuid("Invalid Batch ID format"),
  studentId: z.string().uuid("Invalid Student ID format"),
});

export const addStudentToBatch = async (batchId: string, studentId: string) => {
  // Validate the input
  removeStudentToBatchSchema.parse({ batchId, studentId });

  // Check if batch exists
  const batch = await prisma.createBatch.findUnique({
    where: { id: batchId, deletedAt: null },
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId, deletedAt: null },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Check if student is already in the batch
  const existingEntry = await prisma.batchStudent.findFirst({
    where: { batch_id: batchId, student_id: studentId },
  });

  if (existingEntry) {
    throw new Error("Student is already in this batch");
  }

  // Add student to batch
  await prisma.batchStudent.create({
    data: { batch_id: batchId, student_id: studentId },
  });

  return { message: "Student added to batch successfully" };
};
