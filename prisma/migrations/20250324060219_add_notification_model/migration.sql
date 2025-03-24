-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message', 'material_uploaded', 'session_uploaded', 'session_completed') NOT NULL;

-- AlterTable
ALTER TABLE `NotificationRecipient` MODIFY `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message', 'material_uploaded', 'session_uploaded', 'session_completed') NOT NULL;
