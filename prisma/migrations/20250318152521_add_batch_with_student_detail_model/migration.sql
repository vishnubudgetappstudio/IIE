/*
  Warnings:

  - You are about to drop the `BatchWithStudent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchWithStudent` DROP FOREIGN KEY `BatchWithStudent_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchWithStudent` DROP FOREIGN KEY `BatchWithStudent_student_id_fkey`;

-- DropTable
DROP TABLE `BatchWithStudent`;

-- CreateTable
CREATE TABLE `BatchWithStudentDetail` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BatchWithStudentDetail` ADD CONSTRAINT `BatchWithStudentDetail_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `BatchDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudentDetail` ADD CONSTRAINT `BatchWithStudentDetail_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
