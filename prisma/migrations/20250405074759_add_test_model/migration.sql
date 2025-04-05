-- CreateTable
CREATE TABLE `course_test_csv_file` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `test_title` VARCHAR(191) NOT NULL,
    `test_url` TEXT NULL,
    `test_type` ENUM('mock_test', 'course_test') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `timer` VARCHAR(191) NOT NULL,
    `questions` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `course_test_csv_file_batchId_test_title_test_type_idx`(`batchId`, `test_title`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_course_test` (
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

    INDEX `student_course_test_studentId_courseTestId_status_test_type_idx`(`studentId`, `courseTestId`, `status`, `test_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `course_test_csv_file` ADD CONSTRAINT `course_test_csv_file_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_test` ADD CONSTRAINT `student_course_test_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_test` ADD CONSTRAINT `student_course_test_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_test` ADD CONSTRAINT `student_course_test_courseTestId_fkey` FOREIGN KEY (`courseTestId`) REFERENCES `course_test_csv_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
