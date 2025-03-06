import { prisma } from "../../config/database";

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
    throw new Error("This Batch Number already registered");
  }

  const studentIdsArray = students_id.split(",").map((id: string) => id.trim());

  // Check if staff(mentor) already exists
  const existingStaffMentor = await prisma.managementStaff.findUnique({
    where: { id: mentor_id, role: "staff", deletedAt: null },
  });

  if (!existingStaffMentor) {
    throw new Error("This Mentor does not exist");
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
