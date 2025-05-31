import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { uploadFileToS3 } from "../../s3/uploadFiles.service";
import { CommonUserRole } from "@prisma/client";
import * as admin from "firebase-admin";

interface EditStudentMaterialAccessRequestData {
    material_id: string;
    batchId?: string | null;
    studentIds?: string[] | [];
    material_title?: string;
    file?: Express.Multer.File;
    // userId: string;
    role?: CommonUserRole;
}

interface EditStudentMaterialAccessResponseData {
    material_title: string;
    batchId: string | null;
    studentIds: string[] | [];
    material_file_url: string;
}

export const EditStudentMaterialFileAccessService = async ({
    material_id,
    batchId,
    studentIds,
    material_title,
    file,
    // userId,
    role = "staff",
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

    if (!existMaterial) {
        throw new AppError({ statusCode: 404, message: "Material file not found!" });
    }

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
    const normalizedStudentIds = (studentIds ?? []).flatMap(id => id.split(',').map(s => s.trim()));

// Normalize batch IDs
const batchIdArray = batchId?.split(",").map(id => id.trim()).filter(Boolean);

console.log("Normalized batchId array:", batchIdArray);

const validStudents = await prisma.batchWithStudent.findMany({
    where: {
        batch_id: { in: batchIdArray },
        deletedAt: null,
    },
    select: { student_id: true },
});

console.log("Valid Students:", validStudents);

if (!validStudents.length) {
    throw new AppError({ statusCode: 404, message: "No valid students found in this batch." });
}


    // ✅ Step 4: Upload New File If Provided
    let fileUrl = existMaterial.material_file_url;

    if (file) {
        console.log("Uploading new file to S3...", file);
        const userId = "";

        const uploadResult = await uploadFileToS3({
            file: file,
            batchId: batchId!,
            role,
            userId
        });

        fileUrl = uploadResult.fileUrl;
    }

    // ✅ Step 5: Assign Students & Update Material in Transaction
    const assignedStudents = validStudents.map(({ student_id }) => ({
        student_id,
        material_id: existMaterial.id,
        access_granted: true,
    }));

    const batchIdString = Array.isArray(batchId)
    ? batchId.join(",")
    : batchId || null;

await prisma.$transaction([
    prisma.studentMaterialAccess.createMany({
        data: assignedStudents,
        skipDuplicates: true,
    }),
    prisma.materialFileDetail.update({
        where: { id: material_id },
        data: {
            material_title: material_title ?? existMaterial.material_title,
            batch_id: batchIdString,
            status: "published",
            material_file_url: fileUrl,
            updatedAt: new Date(),
        },
    }),
]);

    // ✅ Step 6: Send notifications
    try {
        const fcmTokens = await prisma.student.findMany({
            where: { id: { in: validStudents.map(({ student_id }) => student_id) } },
            select: { id: true, fcm_token: true },
        });

        const sendPromises = fcmTokens
            .filter(s => s.fcm_token)
            .map(async s => {
                const message = {
                    notification: {
                        title: "New Material Uploaded",
                        body: `${material_title ? material_title : existMaterial.material_title} has been uploaded.`,
                    },
                    token: s.fcm_token!,
                };

                await admin.messaging().send(message);

                await prisma.notificationRecipient.create({
                    data: {
                        title: message.notification.title,
                        description: message.notification.body,
                        receiverRole: 'student',
                        type: 'material_uploaded',
                        isRead: false,
                        status: 'Sent',
                        studentId: s.id,
                        material_id: existMaterial.id,
                    },
                });
            });

        await Promise.all(sendPromises);
    } catch (err) {
        console.error("❌ Notification sending failed:", err);
    }

    return {
        material_title: material_title ? material_title : existMaterial.material_title,
        batchId: batchId as string,
        studentIds: validStudents.map(({ student_id }) => student_id),
        material_file_url: fileUrl,
    };
};
