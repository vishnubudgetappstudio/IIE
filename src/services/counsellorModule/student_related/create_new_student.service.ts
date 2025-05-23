import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import bcrypt from "bcrypt";
// Update the import path below if your nodemailer config is in a different location
import { sendEmail } from "../../../config/nodemailer";

interface CreateNewStudentResponse {
    data: {
        name: string;
        roll_number: string;
        course_name: string;
        course_id: string;
        phone?: string;
        alt_phone?: string;
        email: string;
        preferred_batch?: string;
    };
}

export const createNewStudentService = async (
    {
        name,
        email,
        roll_number,
        course_name,
        course_id,
        phone,
        alt_phone,
        preferred_batch,
        counsellor_name,
        counsellor_id,
    }: {
        name: string,
        email: string,
        roll_number: string,
        course_name: string,
        course_id: string,
        phone?: string,
        alt_phone?: string,
        preferred_batch?: string,
        counsellor_name: string,
        counsellor_id: string,
    }
): Promise<CreateNewStudentResponse> => {

    const existingCounsellor = await prisma.managementStaff.findUnique({
        where: { id: counsellor_id, role: "counsellor", deletedAt: null },
    })

    if (!existingCounsellor) throw new AppError({ statusCode: 404, message: "Counsellor not found", data: {} });

    // Check if student email already exists
    const existingStudentEmail = await prisma.student.findUnique({
        where: { email: email },
    });

    if (existingStudentEmail) {
        throw new AppError({ statusCode: 409, data: {}, message: "This Student Email already registered" });
    }

    // Check if student roll number already exists
    const existingStudentRollNumber = await prisma.student.findUnique({
        where: { roll_number: roll_number },
    });

    if (existingStudentRollNumber) {
        throw new AppError({ statusCode: 409, data: {}, message: "This Student Roll Number already registered" });

    }

    // Check if the preferred batch exists (if provided)
    if (preferred_batch) {
        const batchExists = await prisma.batchDetail.findUnique({
            where: { id: preferred_batch, deletedAt: null },
        });

        if (!batchExists) {
            throw new AppError({ statusCode: 404, message: "Batch not found", data: {} });
        }
    }

    //const randomPassword = 'BudgetApp@123'
    const randomPassword = generateRandomPassword();

    // Hash Password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Send email
    await sendEmail({
        to: email,
        text: `Your IIE Login Password - ${randomPassword}.`,
        html: `<h2>Your IIE Login Password is ${randomPassword}.</h2>`,
        subject: 'IIE - Login Password',
    });

    // Create Counsellor in Database
    const newStudent = await prisma.student.create({
        data: {
            name: name,
            roll_number: roll_number!,
            password: hashedPassword,
            lms_id: roll_number!,
            course_id: course_id,
            // Course: course_name,
            Course: course_id,
            phone: phone ? phone : "",
            alt_phone: alt_phone ? alt_phone : "",
            email: email,
            address: "",
            preferred_batch: preferred_batch ? preferred_batch : "",
            Dob: "",
            counsellor_id: counsellor_id,
            counsellor_name: counsellor_name,
        },
    });


    // If preferred_batch exists, add the student to batchWithStudentModel
    if (preferred_batch) {
        await prisma.batchWithStudent.create({
            data: {
                student_id: newStudent.id,
                batch_id: preferred_batch,
            }
        }).catch((err) => {
            console.error("Error adding student to batchWithStudentModel:", err);
            throw new AppError({ statusCode: 400, message: "Failed to add student to batch", data: {} });
        });

        // console.log("Student added to batch successfully ✅");
    }

    return {
        data: {
            name: newStudent.name,
            roll_number: newStudent.roll_number,
            course_name: newStudent.Course as string,
            course_id: newStudent.course_id,
            email: newStudent.email,
            phone: phone ?? "",
            preferred_batch: preferred_batch ?? "",
        },
    };
};
function generateRandomPassword(length: number = 10): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

