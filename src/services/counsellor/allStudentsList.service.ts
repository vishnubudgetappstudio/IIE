import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

/**
 * Get batch students with pagination and search query
 * @param page - Current page number
 * @param limit - Number of students per page
 * @param searchQuery - Search keyword (optional)
 * @param batchId - batch_id (optional)
 */
export const getAllStudentsList = async (
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

    const existingBatch = await prisma.batchDetail.findUnique({
        where: { id: batchId }
    })
    
    if (!existingBatch) {
        throw new AppError({ statusCode: 404, message: "Batch not found", data: [] });
    }

    // Define search conditions
    const searchCondition = searchQuery || batchId
        ? {
            OR: [
                {
                    name: { startsWith: searchQuery, },
                    batches: {
                        some: {
                            batch_id: batchId as string,
                        },
                    }
                },
            ],
        }
        : {}; // No search filter if searchQuery is empty

    // Fetch students with pagination & search
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
