/*
  Warnings:

  - Added the required column `end_time` to the `batch_detail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `batch_detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `batch_detail` ADD COLUMN `end_time` VARCHAR(191) NOT NULL,
    ADD COLUMN `start_time` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `batch_ids` VARCHAR(191) NULL,
    MODIFY `student_ids` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `session_sheet_student_report_detail` ADD CONSTRAINT `session_sheet_student_report_detail_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
