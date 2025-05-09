import { prisma } from "../config/database";

export const getFCMTokensByBatchId = async (batchId: string): Promise<string[]> => {
    const students = await prisma.student.findMany({
        where: { preferred_batch: batchId },
        select: { fcm_token: true },
    });

    return students
        .map(student => student.fcm_token)
        .filter((token): token is string => !!token); // filter out null/undefined
};