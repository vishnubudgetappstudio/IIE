/*
  Warnings:

  - You are about to drop the `LeaveManagementStaff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupportTicketDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `LeaveManagementStaff` DROP FOREIGN KEY `LeaveManagementStaff_management_staff_id_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicketDetails` DROP FOREIGN KEY `SupportTicketDetails_management_staff_id_fkey`;

-- DropTable
DROP TABLE `LeaveManagementStaff`;

-- DropTable
DROP TABLE `SupportTicketDetails`;

-- CreateTable
CREATE TABLE `SupportTicketDetail` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `SupportTicketDetail_user_id_idx`(`user_id`),
    INDEX `SupportTicketDetail_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveDetail` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Other') NOT NULL,
    `leave_mode` ENUM('Half_Day', 'Full_Day') NOT NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `LeaveDetail_user_id_idx`(`user_id`),
    INDEX `LeaveDetail_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicketDetail` ADD CONSTRAINT `SupportTicket_ManagementStaff_fkey` FOREIGN KEY (`user_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketDetail` ADD CONSTRAINT `SupportTicket_Student_fkey` FOREIGN KEY (`user_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`user_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_Student_fkey` FOREIGN KEY (`user_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
