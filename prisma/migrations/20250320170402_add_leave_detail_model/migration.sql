/*
  Warnings:

  - You are about to drop the column `user_id` on the `LeaveDetail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `LeaveDetail` DROP FOREIGN KEY `Leave_ManagementStaff_fkey`;

-- DropForeignKey
ALTER TABLE `LeaveDetail` DROP FOREIGN KEY `Leave_Student_fkey`;

-- DropIndex
DROP INDEX `LeaveDetail_user_id_idx` ON `LeaveDetail`;

-- AlterTable
ALTER TABLE `LeaveDetail` DROP COLUMN `user_id`,
    ADD COLUMN `staff_id` VARCHAR(191) NULL,
    ADD COLUMN `student_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `LeaveDetail_staff_id_idx` ON `LeaveDetail`(`staff_id`);

-- CreateIndex
CREATE INDEX `LeaveDetail_student_id_idx` ON `LeaveDetail`(`student_id`);

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_Student_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
