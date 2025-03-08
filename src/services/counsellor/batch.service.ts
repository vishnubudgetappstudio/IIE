import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

interface CreateNewBatchResponse {
  data: {
    batch_number: string;
    from_date: string;
    to_date: string;
    course: string;
    session_sheet: string;
    slot: string;
    mentor_id: string;
    students_id: string;
  };
}

export const createNewBatchService = async (
  batch_number: string,
  from_date: string,
  to_date: string,
  course: string,
  session_sheet: string,
  slot: "morning" | "evening",
  mentor_id: string,
  students_id: string
): Promise<CreateNewBatchResponse> => {
  // Check if batch number already exists
  const existingBatch = await prisma.createBatch.findUnique({
    where: { batch_number: batch_number },
  });

  if (existingBatch) {
    throw new AppError({ statusCode: 409, data: {}, message: "This Batch Number already registered" });
  }

  const studentIdsArray = students_id.split(",").map((id: string) => id.trim());

  // Check if staff(mentor) already exists
  const existingStaffMentor = await prisma.managementStaff.findUnique({
    where: { id: mentor_id, role: "staff", deletedAt: null },
  });

  if (!existingStaffMentor) {
    throw new AppError({ statusCode: 404, data: {}, message: "This Mentor does not exist" });
  }

  // Create Counsellor in Database
  const newBatch = await prisma.createBatch.create({
    data: {
      batch_number: batch_number,
      course: course,
      from_date: from_date,
      to_date: to_date,
      session_sheet: session_sheet,
      slot: slot,
      mentor: { connect: { id: mentor_id } },
      students: {
        create: studentIdsArray.map((student_id) => ({
          student: { connect: { id: student_id } },
        })),
      },
    },
    include: { students: { include: { student: true } } },
  });

  return {
    data: {
      batch_number: newBatch.batch_number,
      course: newBatch.course,
      from_date: newBatch.from_date,
      to_date: newBatch.to_date,
      slot: newBatch.slot,
      mentor_id: newBatch.mentor_id,
      students_id: newBatch.students
        .map((student) => student.student_id)
        .join(","),
      session_sheet: newBatch.session_sheet as string,
    },
  };
};


export const addStudentsToBatchService = async (batch_id: string, student_ids: string[]) => {
  // Check if the batch exists
  const batchExists = await prisma.createBatch.findUnique({
    where: { id: batch_id, deletedAt: null },
  });

  if (!batchExists) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
  }

  // Find students who are already in the batch
  const existingStudents = await prisma.batchStudent.findMany({
    where: {
      batch_id,
      student_id: { in: student_ids }, // Check if any of the provided students already exist in this batch
    },
    select: { student_id: true },
  });

  // Extract existing student IDs from the query result
  const existingStudentIds = new Set(existingStudents.map((s) => s.student_id));

  // Identify new students (not already in the batch)
  const newStudents = student_ids.filter((id) => !existingStudentIds.has(id));

  // If any student already exists, throw an AppError
  if (existingStudentIds.size > 0) {
    throw new AppError({
      statusCode: 409,
      message: `The following students are already in the batch: ${[...existingStudentIds].join(", ")}`,
      data: {},
    });
  }

  // Insert only new students
  if (newStudents.length > 0) {
    await prisma.batchStudent.createMany({
      data: newStudents.map((student_id) => ({ batch_id, student_id })),
    }).catch((err) => {
      console.error("Error in addStudentsToBatch Service:", err);
      throw new AppError({ statusCode: 500, message: "Internal Server Error", data: {} });
    });
  }

  return {
    addedStudents: newStudents, // Successfully added student IDs
  };
};

export const removeStudentsFromBatchService = async (batch_id: string, student_ids: string[]) => {
  // Check if the batch exists
  const batchExists = await prisma.createBatch.findUnique({
    where: { id: batch_id, deletedAt: null },
  });

  if (!batchExists) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
  }

  // Check if the students exist in the batch and are not already deleted
  const existingStudents = await prisma.batchStudent.findMany({
    where: {
      batch_id,
      student_id: { in: student_ids },
      deletedAt: null, // Ensure we are not updating already deleted records
    },
    select: { student_id: true },
  });

  // Extract the IDs of students who are actually present in the batch
  const existingStudentIds = existingStudents.map((s) => s.student_id);

  // If no students found, throw a 404 error
  if (existingStudentIds.length === 0) {
    throw new AppError({
      statusCode: 404,
      message: "No matching students found in the batch",
      data: {},
    });
  }

  // Update `deletedAt` for the found students (soft delete)
  await prisma.batchStudent.updateMany({
    where: {
      batch_id,
      student_id: { in: existingStudentIds },
    },
    data: { deletedAt: new Date() },
  }).catch((error) => {
    console.error("Error in removeStudentsFromBatch Service:", error);
    throw new AppError({ statusCode: 500, message: "Internal Server Error", data: {} });
  });

  return {
    removedStudents: existingStudentIds, // Successfully removed student IDs
  };
};
