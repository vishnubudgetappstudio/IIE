/*
  Warnings:

  - You are about to drop the `test_course_or_mock_with_students` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_students` DROP FOREIGN KEY `test_course_or_mock_with_students_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_students` DROP FOREIGN KEY `test_course_or_mock_with_students_courseTestId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_students` DROP FOREIGN KEY `test_course_or_mock_with_students_mockTestId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_students` DROP FOREIGN KEY `test_course_or_mock_with_students_studentId_fkey`;

-- DropTable
DROP TABLE `test_course_or_mock_with_students`;

-- CreateTable
CREATE TABLE `test_course_or_mock_with_student` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseTestId` VARCHAR(191) NULL,
    `mockTestId` VARCHAR(191) NULL,
    `test_type` ENUM('mock_test', 'course_test') NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'DRAFTED', 'COMPLETED', 'EXPIRED') NOT NULL DEFAULT 'NOT_STARTED',
    `submittedAt` DATETIME(3) NULL,
    `timeSpent` VARCHAR(191) NULL,
    `score` VARCHAR(191) NULL,
    `total_questions_count` VARCHAR(191) NULL,
    `correct_answers_count` VARCHAR(191) NULL,
    `incorrect_answers_count` VARCHAR(191) NULL,
    `is_passed` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `test_course_or_mock_with_student_studentId_courseTestId_mock_idx`(`studentId`, `courseTestId`, `mockTestId`, `status`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_courseTestId_fkey` FOREIGN KEY (`courseTestId`) REFERENCES `test_course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_student` ADD CONSTRAINT `test_course_or_mock_with_student_mockTestId_fkey` FOREIGN KEY (`mockTestId`) REFERENCES `test_mock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
