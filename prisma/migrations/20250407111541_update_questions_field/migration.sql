/*
  Warnings:

  - You are about to drop the `test_course_or_mock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `test_course_or_mock` DROP FOREIGN KEY `test_course_or_mock_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_student` DROP FOREIGN KEY `test_course_or_mock_with_student_courseTestId_fkey`;

-- DropIndex
DROP INDEX `test_course_or_mock_with_student_courseTestId_fkey` ON `test_course_or_mock_with_student`;

-- AlterTable
ALTER TABLE `test_course_or_mock_with_student` ADD COLUMN `test_MockId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `test_course_or_mock`;

-- CreateTable
CREATE TABLE `test_course` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `batch_name` VARCHAR(191) NOT NULL,
    `test_title` VARCHAR(191) NOT NULL,
    `test_description` TEXT NOT NULL,
    `test_url` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `timer` VARCHAR(191) NOT NULL,
    `questions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `test_course_batch_id_test_title_idx`(`batch_id`, `test_title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_mock` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `batch_name` VARCHAR(191) NOT NULL,
    `test_url` TEXT NULL,
    `test_mode` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
    `questions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `test_mock_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_course` ADD CONSTRAINT `test_course_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_mock` ADD CONSTRAINT `test_mock_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_courseTestId_fkey` FOREIGN KEY (`courseTestId`) REFERENCES `test_course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_test_MockId_fkey` FOREIGN KEY (`test_MockId`) REFERENCES `test_mock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
