import { prisma } from "../../config/database";
import bcrypt from "bcrypt";
import { sendEmail } from "../../config/nodemailer";
import { AppError } from "../../utils/errorHandler";
import { generateRandomPassword } from "../../utils/randomPasswordGenerate";
import { getAttendancePercentageController } from "../../controllers/staffModule/attendance.controller";
import { getStudentAttendanceStats } from "../staffModule/attendance.service";

interface CreateNewStudentResponse {
    data: {
        name: string;
        roll_number: string;
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
        course_id: string,
        phone?: string,
        alt_phone?: string,
        preferred_batch?: string,
        counsellor_name: string,
        counsellor_id: string,
    }
): Promise<CreateNewStudentResponse> => {
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

    const randomPassword = 'BudgetApp@123'
    // const randomPassword = generateRandomPassword();

    // Hash Password
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Send email
    // await sendEmail({
    //     to: email,
    //     text: `Your IIE Login Password - ${randomPassword}.`,
    //     html: `<h2>Your IIE Login Password is ${randomPassword}.</h2>`,
    //     subject: 'IIE - Login Password',
    // });

    // Create Counsellor in Database
    const newStudent = await prisma.student.create({
        data: {
            name: name,
            roll_number: roll_number!,
            password: hashedPassword,
            lms_id: roll_number!,
            course_id: course_id,
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
            course_id: newStudent.course_id,
            email: newStudent.email,
            phone: phone ?? "",
            preferred_batch: preferred_batch ?? "",
        },
    };
};


/**
 * ✅ Fetch batch students with pagination and search query
 * @param {number} page - Current page number
 * @param {number} limit - Number of students per page
 * @param {string} [searchQuery] - Optional search keyword
 * @param {string} [batchId] - Optional batch ID to filter students
 * @returns {Promise<object>} - List of students with pagination details
 */
export const getAllStudentsListService = async ({
    page,
    limit,
    searchQuery,
    batchId
}: {
    page: number;
    limit: number;
    searchQuery?: string;
    batchId?: string;
}) => {
    // 🏆 Ensure page and limit values are valid
    const currentPage = Math.max(1, page); // Ensure page starts from 1
    const perPage = limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * perPage;

    // 🔎 Validate batch existence if batchId is provided
    if (batchId) {
        const batchExists = await prisma.batchDetail.findUnique({
            where: { id: batchId }
        });

        if (!batchExists) {
            throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
        }
    }

    // 🔍 Define search conditions
    const searchCondition: any = {
        deletedAt: null,
        ...(searchQuery && { name: { startsWith: searchQuery } }), // Search by name
        ...(batchId && {
            batchWithStudentModel: {
                some: { batch_id: batchId, deletedAt: null } // Filter by batch ID
            }
        })
    };

    // 🎯 Fetch students with pagination & search
    const students = await prisma.student.findMany({
        where: searchCondition,
        skip,
        take: perPage,
        orderBy: { createdAt: "desc" },
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
        }
    });

    // 📊 Get total count of matching students
    const totalStudents = await prisma.student.count({ where: searchCondition });

    if (!students.length) {
        throw new AppError({ statusCode: 404, message: "No students found", data: [] });
    }

    // 🏆 Fetch attendance stats concurrently for all students
    const studentsData = await Promise.all(
        students.map(async (student) => {
            const attendanceStats = await getStudentAttendanceStats({
                batchId: batchId as string,
                studentId: student.id as string,
            });

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                mobile: student.phone,
                alternate_mobile: student.alt_phone,
                roll_number: student.roll_number,
                course_id: student.course_id,
                course: student.Course,
                image: student.profile_img_url,
                over_all_present: attendanceStats.overAll.presentPercentage,
                over_all_absent: attendanceStats.overAll.absentPercentage,
                weekly_present: attendanceStats.weekly.presentPercentage,
                weekly_absent: attendanceStats.weekly.absentPercentage,
                this_monthly_present: attendanceStats.thisMonth.presentPercentage,
                this_monthly_absent: attendanceStats.thisMonth.absentPercentage,
                last_monthly_present: attendanceStats.lastMonth.presentPercentage,
                last_monthly_absent: attendanceStats.lastMonth.absentPercentage,
                course_test: "14",
                mock_test: "2"
            };
        })
    );

    // 📌 Return final paginated student data
    return {
        students: studentsData,
        totalPages: Math.ceil(totalStudents / perPage),
        perPage,
        currentPage,
        totalStudents
    };
};

