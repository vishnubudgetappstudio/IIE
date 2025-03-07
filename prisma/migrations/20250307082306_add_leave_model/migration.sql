/*
  Warnings:

  - You are about to drop the `LeaveRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `LeaveRequest` DROP FOREIGN KEY `LeaveRequest_management_staff_id_fkey`;

-- DropTable
DROP TABLE `LeaveRequest`;

-- CreateTable
CREATE TABLE `Leave` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Other') NOT NULL,
    `leave_mode` ENUM('Half_Day', 'Full_Day') NOT NULL,
    `from_date` DATETIME(3) NOT NULL,
    `to_date` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Leave_management_staff_id_idx`(`management_staff_id`),
    INDEX `Leave_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
