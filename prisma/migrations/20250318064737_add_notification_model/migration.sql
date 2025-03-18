/*
  Warnings:

  - You are about to drop the `NotificationDetail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationRecipientDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `NotificationDetail` DROP FOREIGN KEY `NotificationDetail_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientDetail` DROP FOREIGN KEY `NotificationRecipientDetail_notificationId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientDetail` DROP FOREIGN KEY `NotificationRecipient_managementStaffId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientDetail` DROP FOREIGN KEY `NotificationRecipient_studentId_fkey`;

-- DropTable
DROP TABLE `NotificationDetail`;

-- DropTable
DROP TABLE `NotificationRecipientDetail`;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `type` ENUM('system', 'alert', 'message', 'event') NOT NULL,
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

    INDEX `Notification_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `managementStaffId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `receiverRole` ENUM('staff', 'guest', 'student') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `sentAt` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationRecipient_notificationId_idx`(`notificationId`),
    INDEX `NotificationRecipient_managementStaffId_idx`(`managementStaffId`),
    INDEX `NotificationRecipient_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
