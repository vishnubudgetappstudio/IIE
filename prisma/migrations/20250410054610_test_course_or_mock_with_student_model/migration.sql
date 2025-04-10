/*
  Warnings:

  - You are about to alter the column `score_status` on the `test_course_or_mock_with_student` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(21))`.

*/
-- AlterTable
ALTER TABLE `test_course_or_mock_with_student` MODIFY `score_status` ENUM('poor', 'average', 'good') NULL;
