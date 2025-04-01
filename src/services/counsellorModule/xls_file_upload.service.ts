import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";

export const uploadXlsFileService = async ({
    fileUrl, fileName, management_staff_id }:
    {
        fileUrl: string,
        fileName: string,
        management_staff_id: string
    }) => {

    const responseUploadXlsFile = await prisma.xlsFileDetail.create({
        data: {
            xls_file_name: fileName,
            xls_file_url: fileUrl,
            management_staff_id: management_staff_id
        },
        select: {
            xls_file_name: true,
            xls_file_url: true,
        }
    }).catch((error) => {
        throw new AppError({
            statusCode: 400,
            data: {},
            message: "Failed to upload xls file",
        });
    });
    return { responseUploadXlsFile }
}