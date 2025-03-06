/*
  Warnings:

  - You are about to drop the `StoredOTP` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `StoredOTP`;

-- CreateTable
CREATE TABLE `StoredOTPDetail` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `StoredOTPDetail_otp_key`(`otp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
