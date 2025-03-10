/*
  Warnings:

  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `BatchStudent` DROP FOREIGN KEY `BatchStudent_student_id_fkey`;

-- DropForeignKey
ALTER TABLE `Student` DROP FOREIGN KEY `Student_counsellor_id_fkey`;

-- DropIndex
DROP INDEX `BatchStudent_student_id_fkey` ON `BatchStudent`;

-- DropTable
DROP TABLE `Student`;

-- CreateTable
CREATE TABLE `Students` (
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

    UNIQUE INDEX `Students_email_key`(`email`),
    UNIQUE INDEX `Students_roll_number_key`(`roll_number`),
    INDEX `Students_name_roll_number_email_phone_idx`(`name`, `roll_number`, `email`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Students` ADD CONSTRAINT `Students_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudent` ADD CONSTRAINT `BatchStudent_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
