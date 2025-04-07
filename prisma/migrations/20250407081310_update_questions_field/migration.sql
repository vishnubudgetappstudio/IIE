/*
  Warnings:

  - You are about to drop the `course_test_csv_file` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_course_test` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `course_test_csv_file` DROP FOREIGN KEY `course_test_csv_file_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `student_course_test` DROP FOREIGN KEY `student_course_test_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `student_course_test` DROP FOREIGN KEY `student_course_test_courseTestId_fkey`;

-- DropForeignKey
ALTER TABLE `student_course_test` DROP FOREIGN KEY `student_course_test_studentId_fkey`;

-- DropTable
DROP TABLE `course_test_csv_file`;

-- DropTable
DROP TABLE `student_course_test`;

-- CreateTable
CREATE TABLE `test_course_or_mock` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `batch_name` VARCHAR(191) NOT NULL,
    `test_title` VARCHAR(191) NOT NULL,
    `test_description` TEXT NOT NULL,
    `test_url` TEXT NULL,
    `test_type` ENUM('mock_test', 'course_test') NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `timer` VARCHAR(191) NOT NULL,
    `questions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `test_course_or_mock_batch_id_test_title_test_type_idx`(`batch_id`, `test_title`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_course_or_mock_with_student` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseTestId` VARCHAR(191) NOT NULL,
    `test_type` ENUM('mock_test', 'course_test') NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'DRAFTED', 'COMPLETED', 'EXPIRED') NOT NULL DEFAULT 'NOT_STARTED',
    `submittedAt` DATETIME(3) NULL,
    `timeSpent` VARCHAR(191) NULL,
    `feedback` VARCHAR(191) NULL,
    `score` VARCHAR(191) NULL,
    `total_questions_count` VARCHAR(191) NULL,
    `correct_answers_count` VARCHAR(191) NULL,
    `incorrect_answers_count` VARCHAR(191) NULL,
    `is_passed` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    INDEX `test_course_or_mock_with_student_studentId_courseTestId_stat_idx`(`studentId`, `courseTestId`, `status`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_course_or_mock` ADD CONSTRAINT `test_course_or_mock_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_courseTestId_fkey` FOREIGN KEY (`courseTestId`) REFERENCES `test_course_or_mock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
