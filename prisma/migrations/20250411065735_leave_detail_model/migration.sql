/*
  Warnings:

  - You are about to drop the `leave_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `leave_details` DROP FOREIGN KEY `Leave_ManagementStaff_fkey`;

-- DropForeignKey
ALTER TABLE `leave_details` DROP FOREIGN KEY `Leave_Student_fkey`;

-- DropTable
DROP TABLE `leave_details`;

-- CreateTable
CREATE TABLE `leave_detail` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NULL,
    `student_id` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Absent', 'Other') NOT NULL,
    `leave_mode` ENUM('Half_Day', 'Full_Day') NULL,
    `from_date` DATETIME(3) NOT NULL,
    `to_date` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Not_informed') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `leave_detail_management_staff_id_idx`(`management_staff_id`),
    INDEX `leave_detail_student_id_idx`(`student_id`),
    INDEX `leave_detail_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_detail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_detail` ADD CONSTRAINT `Leave_Student_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
