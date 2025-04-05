/*
  Warnings:

  - The values [Cancelled] on the enum `leave_detail_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `leave_detail` MODIFY `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Absent', 'Other') NOT NULL,
    MODIFY `status` ENUM('Pending', 'Approved', 'Rejected', 'uninformed') NOT NULL DEFAULT 'Pending';
