import { Readable } from "stream";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { parseSessionSheet_CSV_Stream, parseDDMMYYYYToDate } from "../../../utils/commonUtils";
import { uploadFileToS3 } from "../../s3/uploadFiles.service";
import { CommonUserRole } from "@prisma/client";

// ✅ Define batch creation request type
interface CreateBatchRequest {
    batch_number: string;
    from_date: string;
    to_date: string;
    start_time: string;
    end_time: string;
    course: string;
    sessionSheetFile?: Express.Multer.File;
    slot: "morning" | "evening";
    mentor_id: string;
    students_id: string;
    role: CommonUserRole;
    userId: string;
}

// ✅ Define response type
interface CreateNewBatchResponse {
    data: {
        batch_number: string;
        course: string;
        from_date: string;
        to_date: string;
        start_time: string;
        end_time: string;
        slot: string;
        mentor_id: string;
        students_id: string;
        session_sheet_url: string;
    };
}

// ✅ Create New Batch Service
export const createNewBatchService = async ({
    batch_number,
    from_date,
    to_date,
    start_time,
    end_time,
    course,
    sessionSheetFile,
    slot,
    mentor_id,
    students_id,
    role,
    userId
}: CreateBatchRequest): Promise<CreateNewBatchResponse> => {
    let sessionFileUrl: string = "";

    // 🚀 Step 1: Check if batch number already exists
    const existingBatch = await prisma.batchDetail.findUnique({
        where: { batch_number, deletedAt: null },
    });

    if (existingBatch) {
        throw new AppError({
            statusCode: 409,
            message: "This Batch Number is already registered",
            data: {},
        });
    }

    const batchStartDate = parseDDMMYYYYToDate(from_date);
    const batchEndDate = parseDDMMYYYYToDate(to_date);
    const today = new Date();

    // 📌 Rule 1: from_date should not be in the past
    if (batchStartDate < new Date(today.setHours(0, 0, 0, 0))) {
        throw new AppError({
            statusCode: 400,
            message: `Batch start date (${from_date}) cannot be in the past`,
        });
    }

    // 📌 Rule 2: to_date must be after from_date
    if (batchEndDate <= batchStartDate) {
        throw new AppError({
            statusCode: 400,
            message: `Batch end date (${to_date}) must be after the start date (${from_date})`,
        });
    }

    // 🚀 Step 2: Validate and parse student IDs
    const studentIdsArray = students_id ? students_id.split(",").map((id) => id.trim()) : [];

    if (studentIdsArray.length === 0) {
        throw new AppError({
            statusCode: 400,
            message: "At least one student ID is required",
            data: {},
        });
    }

    // 🚀 Step 3: Check if the mentor exists and has the correct role
    const existingStaffMentor = await prisma.managementStaff.findFirst({
        where: { id: mentor_id, role: "staff", deletedAt: null },
    });

    if (!existingStaffMentor) {
        throw new AppError({
            statusCode: 404,
            message: "The specified mentor does not exist",
            data: {},
        });
    }

    // 🚀 Step 4: Validate CSV File (if provided)
    if (sessionSheetFile) {
        try {
            // ✅ Read file as Buffer (Node.js way)
            const fileStream = Readable.from(sessionSheetFile.buffer); // Convert Buffer to Stream

            // ✅ Read and validate CSV file
            const parsedData = await parseSessionSheet_CSV_Stream(fileStream);

            // console.log("✅ CSV Validation Passed: ", parsedData.length, "rows");
        } catch (error) {
            console.error("❌ CSV Validation Failed:", error);
            throw new AppError({
                statusCode: 400,
                message: "Invalid CSV file data format. Please upload a valid CSV data.",
                data: {},
            });
        }
    }

    // 🚀 Step 5: Check if students are already assigned to a batch in the same slot
    const conflictingStudents = await prisma.batchWithStudent.findMany({
        where: {
            student_id: { in: studentIdsArray },
            deletedAt: null,
            // batch_detail_relation: { slot },
        },
        select: { student_id: true },
    });

    if (conflictingStudents.length > 0) {
        throw new AppError({
            statusCode: 400,
            message: `Some students are already assigned to a batch in the ${slot} slot.`,
            data: {},
        });
    }

    // 🚀 Step 6: Create new batch with student associations
    const newBatch = await prisma.batchDetail.create({
        data: {
            batch_number,
            batchName: batch_number,
            course,
            from_date,
            to_date,
            start_time,
            end_time,
            slot,
            batch_status: "progress",
            management_staff_relation: { connect: { id: mentor_id } },
            batch_stud_count: studentIdsArray.length.toString(),
            batchWithStudentModel: {
                create: studentIdsArray.map((studentId) => ({
                    student_relation: { connect: { id: studentId } },
                })),
            },
        },
        include: {
            batchWithStudentModel: { include: { student_relation: true } },
        },
    }).catch((error) => {
        console.error("Batch creation error:", error);
        throw new AppError({
            statusCode: 500,
            message: "Failed to create a new batch",
            data: {},
        });
    });

    // 🚀 Step 7: Upload session sheet (if provided)
    if (sessionSheetFile) {
        try {
            const { fileUrl, fileName } = await uploadFileToS3({
                file: sessionSheetFile,
                batchId: newBatch.id, // Attach batch ID for organized storage
                role: role,
                userId: userId,
            });

            sessionFileUrl = fileUrl;

            // ✅ Save session sheet details in the database
            await prisma.sessionSheetDetail.create({
                data: {
                    batch_id: newBatch.id,
                    session_file_url: fileUrl,
                    session_file_name: fileName,
                    status: "inComplete",
                },
            }).catch((error) => {
                console.error("Error to create session sheet details:", error);
                throw new AppError({
                    statusCode: 400,
                    message: "Error to create session sheet details",
                    data: {},
                });
            });
        } catch (error) {
            console.error("Session sheet upload error:", error);
            throw new AppError({
                statusCode: 400,
                message: "Failed to upload session sheet",
                data: {},
            });
        }
    }

    // 🚀 Step 8: Return the response
    return {
        data: {
            batch_number: newBatch.batch_number,
            course: newBatch.course,
            from_date: newBatch.from_date,
            to_date: newBatch.to_date,
            start_time: newBatch.start_time, // ✅ add this
            end_time: newBatch.end_time,     // ✅ add this
            slot: newBatch.slot,
            mentor_id: newBatch.mentor_id,
            students_id: newBatch.batchWithStudentModel.map((student) => student.student_id).join(","),
            session_sheet_url: sessionFileUrl,
        },
    };
};