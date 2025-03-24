/*
  Warnings:

  - You are about to drop the `BatchDetailModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationRecipientModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchDetailModel` DROP FOREIGN KEY `BatchDetailModel_mentor_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchWithStudent` DROP FOREIGN KEY `BatchWithStudent_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientModel` DROP FOREIGN KEY `NotificationRecipientModel_notificationId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientModel` DROP FOREIGN KEY `NotificationRecipient_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientModel` DROP FOREIGN KEY `NotificationRecipient_managementStaffId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipientModel` DROP FOREIGN KEY `NotificationRecipient_studentId_fkey`;

-- DropTable
DROP TABLE `BatchDetailModel`;

-- DropTable
DROP TABLE `NotificationRecipientModel`;

-- CreateTable
CREATE TABLE `BatchDetail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `batchName` VARCHAR(191) NULL,
    `batch_stud_count` VARCHAR(191) NOT NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `slot` ENUM('morning', 'evening') NOT NULL,
    `session_sheet_url` VARCHAR(191) NULL,
    `mentor_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `BatchDetail_id_key`(`id`),
    UNIQUE INDEX `BatchDetail_batch_number_key`(`batch_number`),
    INDEX `BatchDetail_id_idx`(`id`),
    INDEX `BatchDetail_mentor_id_idx`(`mentor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipient` (
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

    INDEX `NotificationRecipient_notificationId_idx`(`notificationId`),
    INDEX `NotificationRecipient_managementStaffId_idx`(`managementStaffId`),
    INDEX `NotificationRecipient_studentId_idx`(`studentId`),
    INDEX `NotificationRecipient_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BatchDetail` ADD CONSTRAINT `BatchDetail_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudent` ADD CONSTRAINT `BatchWithStudent_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `BatchDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `BatchDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
