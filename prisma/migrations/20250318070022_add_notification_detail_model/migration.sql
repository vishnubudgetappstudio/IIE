/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationRecipient` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_managementStaffId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_notificationId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_studentId_fkey`;

-- DropTable
DROP TABLE `Notification`;

-- DropTable
DROP TABLE `NotificationRecipient`;

-- CreateTable
CREATE TABLE `NotificationDetail` (
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

    INDEX `NotificationDetail_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipientDetail` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `managementStaffId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `batchId` VARCHAR(191) NULL,
    `receiverRole` ENUM('staff', 'guest', 'student') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `sentAt` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationRecipientDetail_notificationId_idx`(`notificationId`),
    INDEX `NotificationRecipientDetail_managementStaffId_idx`(`managementStaffId`),
    INDEX `NotificationRecipientDetail_studentId_idx`(`studentId`),
    INDEX `NotificationRecipientDetail_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationDetail` ADD CONSTRAINT `NotificationDetail_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipientDetail` ADD CONSTRAINT `NotificationRecipientDetail_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `NotificationDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipientDetail` ADD CONSTRAINT `NotificationRecipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipientDetail` ADD CONSTRAINT `NotificationRecipient_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipientDetail` ADD CONSTRAINT `NotificationRecipient_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `BatchDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
