import { BatchSlotsType } from "@prisma/client";
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
  session_sheet_url: string,
  session_sheet: object,
  slot: "morning" | "evening",
  mentor_id: string,
  students_id: string
): Promise<CreateNewBatchResponse> => {
  // Check if batch number already exists
  const existingBatch = await prisma.batchDetail.findUnique({
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
  const newBatch = await prisma.batchDetail.create({
    data: {
      batch_number: batch_number,
      course: course,
      from_date: from_date,
      to_date: to_date,
      session_sheet_url: session_sheet_url,
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
  const batchExists = await prisma.batchDetail.findUnique({
    where: { id: batch_id, deletedAt: null },
  });

  if (!batchExists) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
  }

  // Find students who are already in the batch
  const existingStudents = await prisma.batchWithStudent.findMany({
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
    await prisma.batchWithStudent.createMany({
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
  const batchExists = await prisma.batchDetail.findUnique({
    where: { id: batch_id, deletedAt: null },
  });

  if (!batchExists) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
  }

  // Check if the students exist in the batch and are not already deleted
  const existingStudents = await prisma.batchWithStudent.findMany({
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
  await prisma.batchWithStudent.updateMany({
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


export const getAllBatchesService = async (page: number, limit: number, slot: "all" | BatchSlotsType) => {

  if (page < 1 || limit < 1) {
    throw new AppError({
      statusCode: 400, // Bad Request
      message: "Page and limit must be greater than zero.",
      data: {},
    });
  }

  const skip = (page - 1) * limit;

  // Fetch batches with pagination
  const batches = await prisma.batchDetail.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" }, // Order by latest created
    where: slot === "all" ? { deletedAt: null } : { slot: slot as BatchSlotsType, deletedAt: null }, // Filters slot only if not "all" and Exclude soft deleted records
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
    console.log({ err });

    throw new AppError({
      statusCode: 500, // Internal Server Error
      data: [],
      message: "Failed to retrieve batches",
    });
  });

  // Get total count
  const total = await prisma.batchDetail.count({
    where: slot === "all" ? { deletedAt: null } : { slot: slot as BatchSlotsType, deletedAt: null }, // Filters slot only if not "all" and Exclude soft deleted records
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
    session_sheet_url: batch.session_sheet_url,
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

export const getBatchStudentsService = async (
  batchId: string,
  page: number,
  limit: number,
  searchQuery?: string
) => {
  // Apply default values if page or limit is undefined
  const currentPage = page && page > 0 ? page : 1;
  const perPage = limit && limit > 0 ? limit : 10;
  const skip = (currentPage - 1) * perPage;

  // Use Prisma transaction to execute both queries in parallel
  const [batch, totalStudents] = await prisma.$transaction([
    prisma.batchDetail.findUnique({
      where: { id: batchId, deletedAt: null },
      select: {
        students: {
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
          where: searchQuery
            ? {
              student: {
                name: {
                  startsWith: searchQuery, // Removed mode, it defaults to case-sensitive
                },
              },
            }
            : undefined, // If no search, keep it undefined
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                alt_phone: true,
                roll_number: true,
                course_id: true,
                Course: true,
                profile_img_url: true
              },
            },
          },
        },
      },
    }),

    prisma.batchWithStudent.count({
      where: {
        batch_id: batchId,
        student: searchQuery
          ? {
            name: {
              startsWith: searchQuery, // Removed mode to match Prisma's strict typing
            },
          }
          : undefined,
      },
    }),
  ]);

  // If batch is not found, throw an error
  if (!batch) {
    throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
  }

  // Extract student data
  const students = batch.students.map((s) => s.student);

  // Extract student data
  const studentsData = students.map((s) => {
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      mobile: s.phone,
      alternate_mobile: s.alt_phone,
      roll_number: s.roll_number,
      course_id: s.course_id,
      course: s.Course,
      image: s.profile_img_url,
      monthly_present: "78%",
      monthly_absent: "22%",
      weekly_present: "98%",
      weekly_absent: "2%",
      course_test: "14",
      mock_test: "2",

    };
  });

  return {
    students: studentsData,
    currentPage,
    perPage,
    totalPages: Math.ceil(totalStudents / perPage),
    totalStudents,
  };
};