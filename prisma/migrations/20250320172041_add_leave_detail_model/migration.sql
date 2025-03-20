/*
  Warnings:

  - You are about to drop the column `staff_id` on the `LeaveDetail` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `SupportTicketDetail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `LeaveDetail` DROP FOREIGN KEY `Leave_ManagementStaff_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicketDetail` DROP FOREIGN KEY `SupportTicket_ManagementStaff_fkey`;

-- DropForeignKey
ALTER TABLE `SupportTicketDetail` DROP FOREIGN KEY `SupportTicket_Student_fkey`;

-- DropIndex
DROP INDEX `LeaveDetail_staff_id_idx` ON `LeaveDetail`;

-- DropIndex
DROP INDEX `SupportTicketDetail_user_id_idx` ON `SupportTicketDetail`;

-- AlterTable
ALTER TABLE `LeaveDetail` DROP COLUMN `staff_id`,
    ADD COLUMN `management_staff_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SupportTicketDetail` DROP COLUMN `user_id`,
    ADD COLUMN `management_staff_id` VARCHAR(191) NULL,
    ADD COLUMN `student_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `LeaveDetail_management_staff_id_idx` ON `LeaveDetail`(`management_staff_id`);

-- CreateIndex
CREATE INDEX `SupportTicketDetail_management_staff_id_idx` ON `SupportTicketDetail`(`management_staff_id`);

-- CreateIndex
CREATE INDEX `SupportTicketDetail_student_id_idx` ON `SupportTicketDetail`(`student_id`);

-- AddForeignKey
ALTER TABLE `SupportTicketDetail` ADD CONSTRAINT `SupportTicket_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketDetail` ADD CONSTRAINT `SupportTicket_Student_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveDetail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
