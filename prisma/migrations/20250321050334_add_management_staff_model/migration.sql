/*
  Warnings:

  - You are about to drop the `ManagementStaffModel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchDetail` DROP FOREIGN KEY `BatchDetail_mentor_id_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveDetail` DROP FOREIGN KEY `Leave_ManagementStaff_fkey`;

-- DropForeignKey
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_managementStaffId_fkey`;

-- DropForeignKey
ALTER TABLE `Student` DROP FOREIGN KEY `Student_counsellor_id_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicketDetail` DROP FOREIGN KEY `SupportTicket_ManagementStaff_fkey`;

-- DropIndex
DROP INDEX `Student_counsellor_id_fkey` ON `Student`;

-- DropTable
DROP TABLE `ManagementStaffModel`;

-- CreateTable
CREATE TABLE `ManagementStaff` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `alt_phone` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `profile_img_url` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `fcm_token` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ManagementStaff_id_key`(`id`),
    UNIQUE INDEX `ManagementStaff_email_key`(`email`),
    UNIQUE INDEX `ManagementStaff_employeeId_key`(`employeeId`),
    INDEX `ManagementStaff_id_idx`(`id`),
    INDEX `ManagementStaff_email_idx`(`email`),
    INDEX `ManagementStaff_employeeId_idx`(`employeeId`),
    INDEX `ManagementStaff_emailVerified_idx`(`emailVerified`),
    INDEX `ManagementStaff_fcm_token_idx`(`fcm_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicketDetail` ADD CONSTRAINT `SupportTicket_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchDetail` ADD CONSTRAINT `BatchDetail_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
