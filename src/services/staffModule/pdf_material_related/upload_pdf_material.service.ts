import { CommonUserRole } from "@prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../utils/errorHandler";
import { uploadBufferToS3, uploadFileToS3 } from "../../s3/uploadFiles.service";
import admin from '../../../config/firebase';

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
// export const uploadPDFMaterialFileService_old= async ({
//     material_title,
//     batchId,
//     studentIds,
//     material_file,
//     role,
//     userId,
// }: MaterialUploadRequestData): Promise<MaterialUploadResponseData> => {

//     // ✅ Step 1: Validate if Material Title already exists
//     var studentIds = studentIds.flatMap(idString =>
//     idString
//         .replace(/[\[\]\s]/g, '')  // remove brackets and spaces
//         .split(',')                // handle comma-separated values
//         .filter(id => id)          // remove any empty entries
//     );

//     const existingMaterial = await prisma.materialFileDetail.findFirst({
//         where: { material_title, deletedAt: null },
//         select: { id: true },
//     });

//     if (existingMaterial) {
//         throw new AppError({ statusCode: 400, message: "Material title already exists!" });
//     }

//     // ✅ Step 2: Determine Storage Path (Draft vs Published)
//     let fileUrl: string;

//     if (!batchId && studentIds.length === 0) {
//         // Draft Material Upload
//         ({ s3url: fileUrl } = await uploadBufferToS3({
//             buffer: material_file.buffer,
//             file: material_file,
//             role,
//             userId
//         }));
//     } else {
//         // Validate Students in Batch
//         const validStudents = await prisma.batchWithStudent.findMany({
//             where: { batch_id: batchId!},
//             select: { student_id: true },
//         });

//         if (validStudents.length === 0) {
//             throw new AppError({ statusCode: 400, message: "No valid students found in the batch!" });
//         }

//         // Upload File to Batch Folder
//         ({ fileUrl } = await uploadFileToS3({
//             file: material_file,
//             batchId: batchId!,
//             role,
//             userId
//         }));
//     }
//     // ✅ Step 3: Save Material File in Database
//     const material = await prisma.materialFileDetail.create({
//         data: {
//             material_title,
//             batch_id: batchId || null,
//             material_file_url: fileUrl,
//             status: batchId ? "published" : "draft",
//             staff_id: userId,
//         },
//     });
//     // ✅ Step 4: Assign Material to Students (If Batch Exists)
//     if (batchId) {
//         const normalizedStudentIds = studentIds.flatMap(id => id.split(',').map(s => s.trim()));
    
//         console.log("Normalized student IDs:", normalizedStudentIds);
    
//         const validStudents = await prisma.student.findMany({
//             where: { id: { in: normalizedStudentIds } },
//             select: { id: true },
//         });
    
//         const validStudentIds = validStudents.map(s => s.id);
    
//         console.log("Valid student IDs:", validStudentIds);
    
//         if (validStudentIds.length > 0) {
//             await prisma.studentMaterialAccess.createMany({
//                 data: validStudentIds.map(student_id => ({
//                     student_id,
//                     material_id: material.id,
//                     access_granted: true,
//                 })),
//                 skipDuplicates: true,
//             });
//         } else {
//             console.log("No valid student IDs found. Skipping insert.");
//         }

//         try {
//             const fcmTokens = await prisma.student.findMany({
//                 where: { id: { in: studentIds } },
//                 select: { fcm_token: true, id: true }
//             });

//             const validTokens = fcmTokens
//                 .filter(student => student.fcm_token)
//                 .map(student => ({
//                     token: student.fcm_token!,
//                     studentId: student.id
//                 }));

//             const sendPromises = validTokens.map(async ({ token, studentId }) => {
//                 const message = {
//                     notification: {
//                         title: "New Material Uploaded",
//                         body: `${material.material_title} has been uploaded.`,
//                     },
//                     token,
//                 };

//                 await admin.messaging().send(message);

//                 // Optional: Save notification
//                 await prisma.notificationRecipient.create({
//                     data: {
//                         title: message.notification.title,
//                         description: message.notification.body,
//                         receiverRole: 'student',
//                         type: 'material_uploaded',
//                         isRead: false,
//                         status: 'Sent',
//                         studentId: studentId,
//                         material_id: material.id, // or use the actual material ID if available
//                     },
//                 });
//             });

//             await Promise.all(sendPromises);

//         } catch (notificationErr) {
//             console.error("❌ Error sending notification to students:", notificationErr);
//         }
//     }
    
    

//     // ✅ Step 5: Return Response
//     return {
//         material_title: material.material_title,
//         batchId: material.batch_id,
//         studentIds: batchId ? studentIds : [],
//         material_file_url: material.material_file_url,
//     };
// };


// export const uploadPDFMaterialFileService_old_1 = async ({
//     material_title,
//     batchId,
//     studentIds,
//     material_file,
//     role,
//     userId,
// }: MaterialUploadRequestData): Promise<MaterialUploadResponseData> => {

//     // ✅ Normalize studentIds
//    studentIds = (studentIds ?? []).flatMap(idString =>
//     idString
//         .replace(/[\[\]\s]/g, '')  // remove brackets and spaces
//         .split(',')                // handle comma-separated values
//         .filter(Boolean)           // remove empty entries
//     );


//     // ✅ Check for duplicate material title
//     const existingMaterial = await prisma.materialFileDetail.findFirst({
//         where: { material_title, deletedAt: null },
//         select: { id: true },
//     });

//     if (existingMaterial) {
//         throw new AppError({ statusCode: 400, message: "Material title already exists!" });
//     }

//     // ✅ Determine status based on both batch and student_ids
//     const hasBatch = !!batchId;
//     const hasStudents = studentIds.length > 0;
//     const materialStatus: 'draft' | 'published' = hasBatch && hasStudents ? 'published' : 'draft';

//     // ✅ Upload file to correct S3 path
//     let fileUrl: string;

//     if (materialStatus === 'published') {
//         ({ fileUrl } = await uploadFileToS3({
//             file: material_file,
//             batchId: batchId!,
//             role,
//             userId,
//         }));
//     } else {
//         ({ s3url: fileUrl } = await uploadBufferToS3({
//             buffer: material_file.buffer,
//             file: material_file,
//             role,
//             userId,
//         }));
//     }

//     // ✅ Save material file record
//     const material = await prisma.materialFileDetail.create({
//         data: {
//             material_title,
//             batch_id: batchId || null,
//             material_file_url: fileUrl,
//             status: materialStatus,
//             staff_id: userId,
//         },
//     });

//     // ✅ Proceed only if status is published
//     let allValidStudentIds: string[] = [];

//     if (materialStatus === 'published') {
//         // ✅ Get students from batch
//         const batchStudents = await prisma.batchWithStudent.findMany({
//             where: { batch_id: batchId! },
//             select: { student_id: true },
//         });

//         const batchStudentIds = batchStudents.map(s => s.student_id);

//         // ✅ Validate student_ids
//         const extraStudents = await prisma.student.findMany({
//             where: { id: { in: studentIds } },
//             select: { id: true },
//         });

//         const validStudentIds = extraStudents.map(s => s.id);
        

//         // ✅ Combine and de-duplicate
//         allValidStudentIds = [...new Set([...batchStudentIds, ...validStudentIds])];
//         console.log("All valid student IDs:", allValidStudentIds.length);

//         // ✅ Assign material access
//         if (allValidStudentIds.length > 0) {
//             await prisma.studentMaterialAccess.createMany({
//                 data: allValidStudentIds.map(student_id => ({
//                     student_id,
//                     material_id: material.id,
//                     access_granted: true,
//                 })),
//                 skipDuplicates: false, // See if error is thrown
//                 });

//         }

//        // ✅ Send FCM notification
//         try {
//             const fcmTokens = await prisma.student.findMany({
//                 where: { id: { in: allValidStudentIds } },
//                 select: { id: true, fcm_token: true },
//             });

//             const sendPromises = fcmTokens
//                 .filter(s => s.fcm_token)
//                 .map(async s => {
//                     const message = {
//                         notification: {
//                             title: "New Material Uploaded",
//                             body: `${material.material_title} has been uploaded.`,
//                         },
//                         token: s.fcm_token!,
//                     };

//                     await admin.messaging().send(message);

//                     await prisma.notificationRecipient.create({
//                         data: {
//                             title: message.notification.title,
//                             description: message.notification.body,
//                             receiverRole: 'student',
//                             type: 'material_uploaded',
//                             isRead: false,
//                             status: 'Sent',
//                             studentId: s.id,
//                             material_id: material.id,
//                         },
//                     });
//                 });

//             await Promise.all(sendPromises);
//         } catch (err) {
//             console.error("❌ Notification sending failed:", err);
//         }
//     }

//     // ✅ Return final response
//     return {
//         material_title: material.material_title,
//         batchId: material.batch_id,
//         studentIds: allValidStudentIds,
//         material_file_url: material.material_file_url,
//     };
// };

export const uploadPDFMaterialFileService = async ({
    material_title,
    batchId,
    studentIds,
    material_file,
    role,
    userId,
}: MaterialUploadRequestData): Promise<MaterialUploadResponseData> => {
    // ✅ Normalize studentIds (remove brackets, split commas, trim)
    studentIds = (studentIds ?? []).flatMap(idString =>
        idString
            .replace(/[\[\]\s]/g, '')
            .split(',')
            .filter(Boolean)
    );

    // ✅ Check for duplicate material title
    const existingMaterial = await prisma.materialFileDetail.findFirst({
        where: { material_title, deletedAt: null },
        select: { id: true },
    });

    if (existingMaterial) {
        throw new AppError({ statusCode: 400, message: "Material title already exists!" });
    }

    const hasBatch = !!batchId;

    // ✅ Set status: 'published' if batchId is provided, else 'draft'
    const materialStatus: 'draft' | 'published' = hasBatch ? 'published' : 'draft';

    // ✅ Upload to S3
    let fileUrl: string;

    if (materialStatus === 'published') {
        ({ fileUrl } = await uploadFileToS3({
            file: material_file,
            batchId: batchId!,
            role,
            userId,
        }));
    } else {
        ({ s3url: fileUrl } = await uploadBufferToS3({
            buffer: material_file.buffer,
            file: material_file,
            role,
            userId,
        }));
    }

    // ✅ Save Material Record
    const material = await prisma.materialFileDetail.create({
        data: {
            material_title,
            batch_id: batchId || null,
            material_file_url: fileUrl,
            status: materialStatus,
            staff_id: userId,
        },
    });

    // ✅ Proceed if published
    let allValidStudentIds: string[] = [];

    if (materialStatus === 'published') {
        // ✅ Get students from batch
        const batchStudents = await prisma.batchWithStudent.findMany({
            where: { batch_id: batchId! },
            select: { student_id: true },
        });

        const batchStudentIds = batchStudents.map(s => s.student_id);

        // ✅ Validate direct studentIds
        const extraStudents = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: { id: true },
        });

        const validStudentIds = extraStudents.map(s => s.id);

        // ✅ Merge and deduplicate
        allValidStudentIds = [...new Set([...batchStudentIds, ...validStudentIds])];
        console.log("✅ All valid student IDs:", allValidStudentIds);

        // ✅ Validate and re-filter only existing students again before insert
        const finalValidStudents = await prisma.student.findMany({
            where: { id: { in: allValidStudentIds } },
            select: { id: true },
        });

        allValidStudentIds = finalValidStudents.map(s => s.id);

        // ✅ Insert into studentMaterialAccess
        if (allValidStudentIds.length > 0) {
            const insertData = allValidStudentIds.map(student_id => ({
                student_id,
                material_id: material.id,
                access_granted: true,
            }));

            console.log("📝 Inserting into studentMaterialAccess:", insertData);

            await prisma.studentMaterialAccess.createMany({
                data: insertData,
                skipDuplicates: false, // Set to false to debug
            });
        }
    }

     //✅ Send FCM notification
        try {
            const fcmTokens = await prisma.student.findMany({
                where: { id: { in: allValidStudentIds } },
                select: { id: true, fcm_token: true },
            });

            const sendPromises = fcmTokens
                .filter(s => s.fcm_token)
                .map(async s => {
                    const message = {
                        notification: {
                            title: "New Material Uploaded",
                            body: `${material.material_title} has been uploaded.`,
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
                            material_id: material.id,
                        },
                    });
                });

            await Promise.all(sendPromises);
        } catch (err) {
            console.error("❌ Notification sending failed:", err);
        }

    // ✅ Final response
    return {
        material_title: material.material_title,
        batchId: material.batch_id,
        studentIds: allValidStudentIds,
        material_file_url: material.material_file_url,
    };
};



