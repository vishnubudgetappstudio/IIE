/*
  Warnings:

  - You are about to drop the `test_course_or_mock_with_student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_student` DROP FOREIGN KEY `test_course_or_mock_with_student_batchId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_student` DROP FOREIGN KEY `test_course_or_mock_with_student_courseTestId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_student` DROP FOREIGN KEY `test_course_or_mock_with_student_mockTestId_fkey`;

-- DropForeignKey
ALTER TABLE `test_course_or_mock_with_student` DROP FOREIGN KEY `test_course_or_mock_with_student_studentId_fkey`;

-- DropTable
DROP TABLE `test_course_or_mock_with_student`;

-- CreateTable
CREATE TABLE `test_course_or_mock_with_students` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseTestId` VARCHAR(191) NULL,
    `mockTestId` VARCHAR(191) NULL,
    `test_type` ENUM('mock_test', 'course_test') NOT NULL,
    `status` ENUM('yet_to_start', 'drafted', 'completed') NOT NULL DEFAULT 'yet_to_start',
    `submittedAt` DATETIME(3) NULL,
    `score` VARCHAR(191) NULL,
    `total_questions_count` VARCHAR(191) NULL,
    `correct_answers_count` VARCHAR(191) NULL,
    `incorrect_answers_count` VARCHAR(191) NULL,
    `score_status` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `test_course_or_mock_with_students_studentId_courseTestId_moc_idx`(`studentId`, `courseTestId`, `mockTestId`, `status`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_students` ADD CONSTRAINT `test_course_or_mock_with_students_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_students` ADD CONSTRAINT `test_course_or_mock_with_students_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_students` ADD CONSTRAINT `test_course_or_mock_with_students_courseTestId_fkey` FOREIGN KEY (`courseTestId`) REFERENCES `test_course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_course_or_mock_with_students` ADD CONSTRAINT `test_course_or_mock_with_students_mockTestId_fkey` FOREIGN KEY (`mockTestId`) REFERENCES `test_mock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
