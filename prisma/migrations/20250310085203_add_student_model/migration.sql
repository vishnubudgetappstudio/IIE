/*
  Warnings:

  - You are about to drop the `BatchStudents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Students` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchStudents` DROP FOREIGN KEY `BatchStudents_batch_id_fkey`;

-- DropForeignKey
ALTER TABLE `BatchStudents` DROP FOREIGN KEY `BatchStudents_student_id_fkey`;

-- DropForeignKey
ALTER TABLE `Students` DROP FOREIGN KEY `Students_counsellor_id_fkey`;

-- DropTable
DROP TABLE `BatchStudents`;

-- DropTable
DROP TABLE `Students`;

-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `lms_id` VARCHAR(20) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `alt_phone` VARCHAR(191) NULL,
    `Dob` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `profile_img_url` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `roll_number` VARCHAR(191) NOT NULL,
    `Qualification` VARCHAR(30) NULL,
    `Yop` VARCHAR(191) NULL,
    `Profession` VARCHAR(20) NULL,
    `C_Name` VARCHAR(100) NULL,
    `address` VARCHAR(191) NULL,
    `City` VARCHAR(20) NULL,
    `Pincode` VARCHAR(191) NULL,
    `Global_Certification` VARCHAR(20) NULL,
    `Course` VARCHAR(50) NULL,
    `Fees` INTEGER NULL,
    `Batch_time` VARCHAR(20) NULL,
    `Demo` VARCHAR(20) NULL,
    `Joining_Date` DATE NULL,
    `Know_about_iie` VARCHAR(20) NULL,
    `Frd_Name` VARCHAR(100) NULL,
    `Branch` VARCHAR(20) NULL,
    `Follow_up` DATE NULL,
    `Status` VARCHAR(20) NULL,
    `Remarks` VARCHAR(100) NULL,
    `counsellor_id` VARCHAR(191) NOT NULL,
    `counsellor_name` VARCHAR(191) NOT NULL,
    `Walkin_By` VARCHAR(20) NULL,
    `Walkin_Date` DATE NULL,
    `DateTime` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `preferred_batch` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Student_email_key`(`email`),
    UNIQUE INDEX `Student_roll_number_key`(`roll_number`),
    INDEX `Student_name_roll_number_email_phone_idx`(`name`, `roll_number`, `email`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchStudent` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudent` ADD CONSTRAINT `BatchStudent_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `CreateBatch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudent` ADD CONSTRAINT `BatchStudent_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
