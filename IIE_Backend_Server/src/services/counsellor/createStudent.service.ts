import { prisma } from "../../config/database";

interface CreateNewStudentResponse {
  data: {
    name: string;
    roll_number: string;
    lms_id: string;
    course_id: string;
    phone?: string;
    email: string;
    preferred_batch?: string;
  };
}

export const createNewStudentService = async (
  name: string,
  email: string,
  roll_number: string,
  course_id: string,
  userId: string,
  counsellor_name: string,
  phone?: string,
  preferred_batch?: string
): Promise<CreateNewStudentResponse> => {
  // Check if student email already exists
  const existingStudent = await prisma.student.findUnique({
    where: { email: email },
  });

  if (existingStudent) {
    throw new Error("This Student Email already registered");
  }

  // Create Counsellor in Database
  const newCounsellor = await prisma.student.create({
    data: {
      name: name,
      roll_number: roll_number!,
      lms_id: roll_number!,
      course_id: course_id,
      email: email,
      address: "",
      preferred_batch: "",
      Dob: "",
      counsellor_id: userId,
      counsellor_name: counsellor_name,
    },
  });

  return {
    data: {
      name: newCounsellor.name,
      roll_number: newCounsellor.roll_number,
      course_id: newCounsellor.course_id,
      email: newCounsellor.email,
      phone: phone ?? "",
      preferred_batch: preferred_batch ?? "",
      lms_id: newCounsellor.lms_id,
    },
  };
};
