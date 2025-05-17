/*
  Warnings:

  - Added the required column `staff_id` to the `material_file_detail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `notification_recipient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notification_recipient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `batch_detail` ADD COLUMN `batch_status` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `material_file_detail` ADD COLUMN `staff_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `notification_recipient` ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `test_course` MODIFY `batch_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `test_mock` MODIFY `batch_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Guest` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `otpCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Guest_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
