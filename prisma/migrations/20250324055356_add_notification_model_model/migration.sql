/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `NotificationRecipient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_notificationId_fkey`;

-- AlterTable
ALTER TABLE `NotificationRecipient` ADD COLUMN `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message') NOT NULL;

-- DropTable
DROP TABLE `Notification`;

-- CreateTable
CREATE TABLE `NotificationModel` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message') NOT NULL,
    `category` ENUM('all', 'staffs', 'students') NULL,
    `batch_ids` VARCHAR(191) NOT NULL,
    `student_ids` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `scheduledAt` BIGINT NULL,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `NotificationModel_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationModel` ADD CONSTRAINT `NotificationModel_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `NotificationModel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
