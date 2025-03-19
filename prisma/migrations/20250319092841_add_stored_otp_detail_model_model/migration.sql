/*
  Warnings:

  - You are about to drop the `StoredOTPDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `StoredOTPDetail`;

-- CreateTable
CREATE TABLE `StoredOTPDetailModel` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `StoredOTPDetailModel_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
