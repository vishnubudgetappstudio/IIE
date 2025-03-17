import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

/**
 * Get batch students with pagination and search query
 * @param page - Current page number
 * @param limit - Number of students per page
 * @param searchQuery - Search keyword (optional)
 */
export const getAllStudentsList = async (
    page: number,
    limit: number,
    searchQuery?: string
) => {
    // Ensure page and limit are valid
    const currentPage = page > 0 ? page : 1;
    const perPage = searchQuery ? undefined : limit > 0 ? limit : 10;
    const skip = searchQuery ? undefined : (currentPage - 1) * perPage!;

    try {
        // Define search conditions
        const searchCondition = searchQuery
            ? {
                name: {
                    startsWith: searchQuery, // Matches names that start with the search query
                },
            }
            : {};

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
        });

        // Get total count of matching students
        const totalStudents = await prisma.student.count({
            where: searchCondition,
        });

        if (!students.length) {
            throw new AppError({ statusCode: 404, message: "No students found", data: {} });
        }

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
            totalPages: Math.ceil(totalStudents / perPage!),
            perPage,
            currentPage,
            totalStudents,
        };
    } catch (error) {
        console.error("Error fetching batch students:", error);
        throw new AppError({ statusCode: 500, message: "Failed to fetch students", data: {} });
    }
};
