import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { moveFileInS3 } from "../../../utils/s3"; // Utility functions

interface EditStudentMaterialAccessRequestData {
    material_id: string;
    batchId?: string | null;
    studentIds?: string[] | [];
    material_title?: string;
}

interface EditStudentMaterialAccessResponseData {
    material_title: string;
    batchId: string | null;
    studentIds: string[] | [];
    material_file_url: string;
}

/**
 * ✅ Edit Student Material File Access Service (Moves file when published)
 */
export const EditStudentMaterialFileAccessService = async ({
    material_id,
    batchId,
    studentIds,
    material_title,
}: EditStudentMaterialAccessRequestData): Promise<EditStudentMaterialAccessResponseData> => {

    // ✅ Step 1: Fetch Existing Material Details
    const existMaterial = await prisma.materialFileDetail.findFirst({
        where: { id: material_id, deletedAt: null },
        select: {
            id: true,
            batch_id: true,
            material_title: true,
            material_file_url: true,
            status: true,
        },
    });
   // console.log("existMaterial ===>", existMaterial);
    

    if (!existMaterial) throw new AppError({ statusCode: 404, message: "Material file not found!" });

    // ✅ Step 2: Handle Material Title Update Without Batch ID Change
    if (existMaterial.status === "draft" && !batchId && material_title) {
        const updatedMaterial = await prisma.materialFileDetail.update({
            where: { id: existMaterial.id },
            data: { material_title },
            select: {
                material_title: true,
                material_file_url: true,
            },
        });

        return {
            material_title: updatedMaterial.material_title,
            material_file_url: updatedMaterial.material_file_url,
            batchId: null,
            studentIds: [],
        };
    }

   // ✅ Step 3: Validate Batch & Students
if (batchId && !studentIds?.length) {
    throw new AppError({ statusCode: 400, message: "At least one student must be selected." });
}

// ✅ Normalize studentIds (handles comma-separated string)
const normalizedStudentIds = (studentIds ?? []).flatMap(id => id.split(',').map(s => s.trim()));

const validStudents = await prisma.batchWithStudent.findMany({
    where: {
        batch_id: batchId!,
        student_id: { in: normalizedStudentIds },
        deletedAt: null,
    },
    select: { student_id: true },
});

if (!validStudents.length) {
    throw new AppError({ statusCode: 404, message: "No valid students found in this batch." });
}


    // ✅ Step 4: Move File in S3 (If Batch ID Changes or Moving from Draft)
    let newS3Url = existMaterial.material_file_url;
  //  console.log("existMaterial.batch_id ===>", existMaterial, batchId);
    if (batchId !== existMaterial.batch_id || existMaterial.status === "draft") {
      //  console.log("Moving file in S3...");

        const oldS3Url = existMaterial.material_file_url;
        const fileKey = oldS3Url.split(".amazonaws.com/")[1]; // Extract S3 file path

        const newS3Key = fileKey.includes("material-draft")
            ? fileKey.replace(/material-draft\/[^/]+/, `material-published/batch-${batchId}`)
            : fileKey.replace(`material-published/batch-${existMaterial.batch_id}`, `material-published/batch-${batchId}`);

        newS3Url = await moveFileInS3(fileKey, newS3Key);
    }
    //console.log("newS3Url ===>", newS3Url);

    // ✅ Step 5: Assign Students & Update Material in Transaction
    const assignedStudents = validStudents.map(({ student_id }) => ({
        student_id,
        material_id: existMaterial.id,
        access_granted: true,
    }));

    await prisma.$transaction([
        prisma.studentMaterialAccess.createMany({ data: assignedStudents, skipDuplicates: true }),
        prisma.materialFileDetail.update({
            where: { id: material_id },
            data: {
                material_title: material_title ? material_title : existMaterial.material_title,
                batch_id: batchId,
                status: "published",
                material_file_url: newS3Url,
                updatedAt: new Date(),
            },
        }),
    ]);

    return {
        material_title: material_title ? material_title : existMaterial.material_title,
        batchId: batchId as string,
        studentIds: validStudents.map(({ student_id }) => student_id),
        material_file_url: newS3Url,
    };
};
