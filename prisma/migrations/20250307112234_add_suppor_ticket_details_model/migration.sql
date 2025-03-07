/*
  Warnings:

  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `SupportTicket` DROP FOREIGN KEY `SupportTicket_management_staff_id_fkey`;

-- DropTable
DROP TABLE `SupportTicket`;

-- CreateTable
CREATE TABLE `SupportTicketDetails` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `SupportTicketDetails_management_staff_id_idx`(`management_staff_id`),
    INDEX `SupportTicketDetails_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicketDetails` ADD CONSTRAINT `SupportTicketDetails_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
