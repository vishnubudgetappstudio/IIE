import { CommonUserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";
import { uploadBufferToS3 } from "../s3/uploadFiles.service";

export const uploadXlsFileService = async ({
    file,
    fileName,
    management_staff_id,
    role,
    is_xls_file,
}:
    {
        file: Express.Multer.File,
        fileName: string,
        management_staff_id: string,
        role: CommonUserRole,
        is_xls_file: boolean,
    }) => {
    // ✅ Step 1: Check if management_staff_id exists in the database
    const counsellorExists = await prisma.managementStaff.findUnique({
        where: { id: management_staff_id },
    });

    if (!counsellorExists) {
        throw new AppError({
            statusCode: 400,
            message: "Invalid Counsellor. Counsellor does not exist!",
            data: {}
        });
    }
    // ✅ Step 2: Upload the file to S3
    const { s3url } = await uploadBufferToS3({
        buffer: file.buffer,
        file: file,
        role: role,
        userId: management_staff_id,
        is_xls_file: is_xls_file
    });

    // ✅ Step 3: Store file details in the database
    const responseUploadXlsFile = await prisma.xlsFileDetail.create({
        data: {
            xls_file_name: fileName,
            xls_file_url: s3url,
            management_staff_id: management_staff_id
        },
        select: {
            xls_file_name: true,
            xls_file_url: true,
        }
    }).catch((error) => {
        console.error("Failed to create XLS file entry:", error);
        throw new AppError({
            statusCode: 400,
            data: {},
            message: "Failed to create XLS file entry",
        });
    });

    return { responseUploadXlsFile }

}