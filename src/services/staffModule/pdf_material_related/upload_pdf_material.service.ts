import { CommonUserRole } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { uploadBufferToS3, uploadFileToS3 } from "../../s3/uploadFiles.service";

interface MaterialUploadRequestData {
    material_title: string;
    batchId?: string | null;
    studentIds: string[];
    material_file: Express.Multer.File;
    role: CommonUserRole;
    userId: string;
}

interface MaterialUploadResponseData {
    material_title: string;
    batchId?: string | null;
    studentIds: string[];
    material_file_url: string;
}

/**
 * ✅ Upload a Material File and Assign to Students
 */
export const uploadPDFMaterialFileService = async ({
    material_title,
    batchId,
    studentIds,
    material_file,
    role,
    userId,
}: MaterialUploadRequestData): Promise<MaterialUploadResponseData> => {

    // ✅ Step 1: Validate if Material Title already exists
    var studentIds = studentIds.flatMap(idString =>
    idString
        .replace(/[\[\]\s]/g, '')  // remove brackets and spaces
        .split(',')                // handle comma-separated values
        .filter(id => id)          // remove any empty entries
    );

    const existingMaterial = await prisma.materialFileDetail.findFirst({
        where: { material_title, deletedAt: null },
        select: { id: true },
    });

    if (existingMaterial) {
        throw new AppError({ statusCode: 400, message: "Material title already exists!" });
    }

    // ✅ Step 2: Determine Storage Path (Draft vs Published)
    let fileUrl: string;

    if (!batchId && studentIds.length === 0) {
        // Draft Material Upload
        ({ s3url: fileUrl } = await uploadBufferToS3({
            buffer: material_file.buffer,
            file: material_file,
            role,
            userId
        }));
    } else {
        // Validate Students in Batch
        const validStudents = await prisma.batchWithStudent.findMany({
            where: { batch_id: batchId!},
            select: { student_id: true },
        });

        if (validStudents.length === 0) {
            throw new AppError({ statusCode: 400, message: "No valid students found in the batch!" });
        }

        // Upload File to Batch Folder
        ({ fileUrl } = await uploadFileToS3({
            file: material_file,
            batchId: batchId!,
            role,
            userId
        }));
    }
    // ✅ Step 3: Save Material File in Database
    const material = await prisma.materialFileDetail.create({
        data: {
            material_title,
            batch_id: batchId || null,
            material_file_url: fileUrl,
            status: batchId ? "published" : "draft",
            staff_id: userId,
        },
    });
    // ✅ Step 4: Assign Material to Students (If Batch Exists)
    if (batchId) {
        const normalizedStudentIds = studentIds.flatMap(id => id.split(',').map(s => s.trim()));
    
        console.log("Normalized student IDs:", normalizedStudentIds);
    
        const validStudents = await prisma.student.findMany({
            where: { id: { in: normalizedStudentIds } },
            select: { id: true },
        });
    
        const validStudentIds = validStudents.map(s => s.id);
    
        console.log("Valid student IDs:", validStudentIds);
    
        if (validStudentIds.length > 0) {
            await prisma.studentMaterialAccess.createMany({
                data: validStudentIds.map(student_id => ({
                    student_id,
                    material_id: material.id,
                    access_granted: true,
                })),
                skipDuplicates: true,
            });
        } else {
            console.log("No valid student IDs found. Skipping insert.");
        }
    }
    
    

    // ✅ Step 5: Return Response
    return {
        material_title: material.material_title,
        batchId: material.batch_id,
        studentIds: batchId ? studentIds : [],
        material_file_url: material.material_file_url,
    };
};

