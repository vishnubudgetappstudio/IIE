/*
  Warnings:

  - You are about to drop the `BatchStudent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchStudent` DROP FOREIGN KEY `BatchStudent_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchStudent` DROP FOREIGN KEY `BatchStudent_student_id_fkey`;

-- DropTable
DROP TABLE `BatchStudent`;

-- CreateTable
CREATE TABLE `BatchStudents` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `StoredOTPDetail_email_idx` ON `StoredOTPDetail`(`email`);

-- AddForeignKey
ALTER TABLE `BatchStudents` ADD CONSTRAINT `BatchStudents_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `CreateBatch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudents` ADD CONSTRAINT `BatchStudents_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
