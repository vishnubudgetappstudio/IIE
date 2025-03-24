import { prisma } from "../../config/database";
import bcrypt from "bcrypt";
import { sendEmail } from "../../config/nodemailer";
import { AppError } from "../../utils/errorHandler";
import { generateRandomPassword } from "../../utils/randomPasswordGenerate";

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
 * Get batch students with pagination and search query
 * @param page - Current page number
 * @param limit - Number of students per page
 * @param searchQuery - Search keyword (optional)
 * @param batchId - batch_id (optional)
 */
export const getAllStudentsListService = async (
    { page, limit, searchQuery, batchId }: {
        page: number,
        limit: number,
        searchQuery?: string,
        batchId?: string,
    }
) => {
    // Ensure page and limit are valid
    const currentPage = page > 0 ? page : 1;
    const perPage = searchQuery ? undefined : limit > 0 ? limit : 10;
    const skip = searchQuery ? undefined : (currentPage - 1) * perPage!;

    if (batchId) {
        const existingBatch = await prisma.batchDetail.findUnique({
            where: { id: batchId }
        })

        if (!existingBatch) {
            throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
        }
    }

    // Define search conditions
    const searchCondition: any = {};

    if (searchQuery) {
        searchCondition.name = {
            startsWith: searchQuery, // Matches names that start with the search query
        };
    }

    // If batchId is provided, filter students belonging to that batch
    if (batchId) {
        searchCondition.batchWithStudentModel = {
            some: {
                batch_id: batchId,
                deletedAt: null,
            }, // Ensure student is part of the batch
        };
    }

    // Fetch students with pagination & search
    const students = await prisma.student.findMany({
        where: {
            ...searchCondition,
            deletedAt: null,
        },
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
    }).catch(err => {
        console.error("Error fetching batch students:", err);
        throw new AppError({ statusCode: 500, message: "Failed to fetch students", data: [] });
    });

    // Get total count of matching students
    const totalStudents = await prisma.student.count({
        where: searchCondition,
    });

    if (!students.length) {
        throw new AppError({ statusCode: 404, message: "No students found", data: [] });
    }

    // Extract student data
    const studentsData = students?.map((s) => {
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
        totalPages: Math.ceil(totalStudents / perPage!),
        perPage,
        currentPage,
        totalStudents,
    };
};
