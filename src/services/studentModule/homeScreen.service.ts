import { prisma } from "../../config/database";
import { calculateAttendancePercentage, formatDateOnly, getCourseDuration, parseDDMMYYYYToDate } from "../../utils/commonUtils";
import fetch from "node-fetch";
import csv from "csv-parser";
import { Readable } from "stream";

export const studentHomeScreenService = async ({ student_id }: { student_id: string }) => {
    // 1. Fetch student along with batch, mentor, and course details
    const student = await prisma.student.findUnique({
        where: { id: student_id, deletedAt: null },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roll_number: true,
            alt_phone: true,
            batchWithStudentModel: {
                where: { student_id, deletedAt: null },
                select: {
                    batch_id: true,
                    batch_detail_relation: {
                        select: {
                            id: true,
                            batch_number: true,
                            slot: true,
                            from_date: true,
                            to_date: true,
                            createdAt: true,
                            management_staff_relation: {
                                select: {
                                    name: true,
                                    profile_img_url: true,
                                },
                            },
                            SessionSheetDetailModel: {
                                select: {
                                    session_file_url: true,
                                }
                            }
                        },
                    },
                    student_relation: {
                        select: {
                            Course: true,
                        },
                    },
                },
            },
        },
    });

    const extractStatusesFromCSV = async (url: string): Promise<string[]> => {
        const res = await fetch(url);
        if (!res.ok) return [];
    
        const buffer = await res.buffer();
        const stream = Readable.from(buffer.toString());
    
        return new Promise((resolve, reject) => {
            const statuses: string[] = [];
            stream
            .pipe(csv())
            .on("data", (row) => {
                if (row.Status) {
                statuses.push(row.Status.trim().toLowerCase());
                }
            })
            .on("end", () => resolve(statuses))
            .on("error", reject);
        });
        };

    // 2. Extract required details with null safety
    const batch = student?.batchWithStudentModel?.[0];
    const course = batch?.student_relation?.Course || null;
    const batchDetails = batch?.batch_detail_relation;
    const mentor = batchDetails?.management_staff_relation;
    const sessionSheet = batchDetails?.SessionSheetDetailModel?.[0];

    let total = 0;
        let completed = 0;

    if (sessionSheet) {
        const statuses = await extractStatusesFromCSV(sessionSheet.session_file_url);
        total += statuses.length;
        completed += statuses.filter((s) => s === "completed").length;
    }

    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    // 3. Handle date formatting and duration safely
    const startDate = batchDetails?.from_date ? parseDDMMYYYYToDate(batchDetails.from_date) : null;
    const endDate = batchDetails?.to_date ? parseDDMMYYYYToDate(batchDetails.to_date) : null;

    const course_start = startDate ? formatDateOnly(startDate) : null;
    const course_end = endDate ? formatDateOnly(endDate) : null;
    const duration = startDate && endDate ? getCourseDuration(startDate, endDate) : null;

    const joiningDate = batchDetails?.createdAt;

    const [stats] = await prisma.$queryRaw<
        Array<{ all_present: bigint; all_total: bigint }>
    >`SELECT 
        SUM(CASE WHEN is_present = true THEN 1 ELSE 0 END) AS all_present,
        COUNT(*) AS all_total
        FROM student_attendance
        WHERE batch_id = ${batchDetails?.id}
            AND student_id = ${student_id}
            AND attendance_date >= ${joiningDate}
            AND WEEKDAY(attendance_date) < 6;
        `;

    // 4. Build structured response object
    return {
        name: student?.name || null,
        roll_number: student?.roll_number || null,
        attendance_percentage: calculateAttendancePercentage({ present: stats.all_present, total: stats.all_total }).presentPercentage,
        courseEnrolled: {
            course,
            batch_number: batchDetails?.batch_number || null,
            mentor: mentor?.name || null,
            mentor_image: mentor?.profile_img_url || null,
            course_start,
            course_end,
            duration,
            batcj_id: batchDetails?.id || null,
            progress: progress, // TODO: Calculate actual progress
        },
        updates: [
            {
                title: "Test 1",
                image: "email@gmail.com",
                sub_title: "Intro",
                from_time: "12.00 am",
                to_time: "12.00 am",
                type: "test",
            },
        ],

        follow_us_on: {
            insta_url: "https://instagram.com/iie_indra_institute",
            facebook_url: "https://facebook.com/IndraInstitute",
        },
    };
};
