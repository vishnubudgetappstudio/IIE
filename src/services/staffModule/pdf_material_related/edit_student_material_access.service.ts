import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";

interface EditStudentMaterialAccessRequestData {
    material_id: string;
    batchId?: string | null;
    studentIds?: string[] | [];
    material_title?: string;
    material_file_url?: string | null;
}

interface EditStudentMaterialAccessResponseData {
    material_title: string;
    batchId: string | null;
    studentIds: string[] | [];
    material_file_url: string;
}

/**
 * ✅ Edit Student Material File Access Service (No S3 logic)
 */
export const EditStudentMaterialFileAccessService = async ({
    material_id,
    batchId,
    studentIds,
    material_title,
    material_file_url,
}: EditStudentMaterialAccessRequestData): Promise<EditStudentMaterialAccessResponseData> => {

    // ✅ Step 1: Fetch Existing Material
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

    if (!existMaterial) {
        throw new AppError({ statusCode: 404, message: "Material file not found!" });
    }

    // ✅ Step 2: Handle draft update (title and/or file URL) if batch not provided
    // if (existMaterial.status === "draft" && !batchId) {
        const updatedMaterial = await prisma.materialFileDetail.update({
            where: { id: existMaterial.id },
            data: {
                material_title: material_title ?? existMaterial.material_title,
                material_file_url: material_file_url ?? existMaterial.material_file_url,
                updatedAt: new Date(),
            },
            select: {
                material_title: true,
                material_file_url: true,
            },
        });
    // }

    // ✅ Step 3: Validate batch and students
    if (batchId && (!studentIds || studentIds.length === 0)) {
        throw new AppError({ statusCode: 400, message: "At least one student must be selected." });
    }

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

    // ✅ Step 4: Assign students & update material
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
                material_title: material_title ?? existMaterial.material_title,
                batch_id: batchId,
                status: "published",
                material_file_url: material_file_url ?? existMaterial.material_file_url,
                updatedAt: new Date(),
            },
        }),
    ]);

    return {
        material_title: material_title ?? existMaterial.material_title,
        batchId: batchId as string,
        studentIds: validStudents.map(({ student_id }) => student_id),
        material_file_url: material_file_url ?? existMaterial.material_file_url,
    };
};
