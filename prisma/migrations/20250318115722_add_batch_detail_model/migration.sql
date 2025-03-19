/*
  Warnings:

  - You are about to drop the `Batch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BatchWithStudentDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Batch` DROP FOREIGN KEY `Batch_mentor_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchWithStudentDetail` DROP FOREIGN KEY `BatchWithStudentDetail_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchWithStudentDetail` DROP FOREIGN KEY `BatchWithStudentDetail_student_id_fkey`;

-- DropForeignKey
ALTER TABLE `NotificationRecipient` DROP FOREIGN KEY `NotificationRecipient_batchId_fkey`;

-- AlterTable
ALTER TABLE `ManagementStaff` ADD COLUMN `fcm_token` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Batch`;

-- DropTable
DROP TABLE `BatchWithStudentDetail`;

-- CreateTable
CREATE TABLE `BatchDetail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `batchName` VARCHAR(191) NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `slot` ENUM('morning', 'evening') NOT NULL,
    `session_sheet_url` VARCHAR(191) NULL,
    `mentor_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `BatchDetail_id_key`(`id`),
    UNIQUE INDEX `BatchDetail_batch_number_key`(`batch_number`),
    INDEX `BatchDetail_id_idx`(`id`),
    INDEX `BatchDetail_mentor_id_idx`(`mentor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchWithStudent` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `BatchWithStudent_batch_id_key`(`batch_id`),
    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ManagementStaff_fcm_token_idx` ON `ManagementStaff`(`fcm_token`);

-- AddForeignKey
ALTER TABLE `BatchDetail` ADD CONSTRAINT `BatchDetail_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudent` ADD CONSTRAINT `BatchWithStudent_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `BatchDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudent` ADD CONSTRAINT `BatchWithStudent_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `BatchDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
