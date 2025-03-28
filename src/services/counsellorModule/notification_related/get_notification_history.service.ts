import { prisma } from "../../../config/database";

export const getNotificationHistoryService = async ({ senderId }: { senderId: string }) => {

    const history = await prisma.notification.findMany({
        where: { senderId },
        orderBy: { date: "desc" }, // Order by latest notification
        select: {
            id: true,
            title: true,
            description: true,
            image: true,
            date: true,
            type: true,
            category: true,
            time: true,
            batch_ids: true,
            student_ids: true,
            senderId: true,
            createdAt: true,
        },
    });

    const historyList = history.map((history) => (
        {
            id: history.id,
            title: history.title,
            message: history.description,
            image: history.image,
            category: history.category,
            date: history.date,
            time: history.time,
            batch_ids: history.batch_ids,
            student_ids: history.student_ids,
        }

    ));
    return { historyList };
};