import { prisma } from "../../config/database";
import { AppError } from "../../utils/errorHandler";


export const updateXlsFileNameService = async ({
    newFileName, xls_file_id, management_staff_id }:
    {
        newFileName: string,
        xls_file_id: string,
        management_staff_id: string
    }) => {

    const responseUpdateXlsFileName = await prisma.xlsFileDetail.update({
        where: {
            id: xls_file_id,
            management_staff_id: management_staff_id,
            deletedAt: null
        },
        data: {
            xls_file_name: newFileName,
            updatedAt: new Date(),
        },
        select: {
            xls_file_name: true,
            xls_file_url: true,
        }
    }).catch((error) => {
        throw new AppError({
            statusCode: 400,
            data: {},
            message: "Failed to update xls file name",
        });
    });
    return { responseUpdateXlsFileName }
}