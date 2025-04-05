/*
  Warnings:

  - The values [uninformed] on the enum `leave_detail_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `leave_detail` MODIFY `status` ENUM('Pending', 'Approved', 'Rejected', 'Not_informed') NOT NULL DEFAULT 'Pending';
