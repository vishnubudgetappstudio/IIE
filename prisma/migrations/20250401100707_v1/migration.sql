-- CreateTable
CREATE TABLE `management_staff` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `alt_phone` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `profile_img_url` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `fcm_token` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `management_staff_id_key`(`id`),
    UNIQUE INDEX `management_staff_email_key`(`email`),
    UNIQUE INDEX `management_staff_employeeId_key`(`employeeId`),
    INDEX `management_staff_id_idx`(`id`),
    INDEX `management_staff_email_idx`(`email`),
    INDEX `management_staff_employeeId_idx`(`employeeId`),
    INDEX `management_staff_emailVerified_idx`(`emailVerified`),
    INDEX `management_staff_fcm_token_idx`(`fcm_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student` (
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
    `fcm_token` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `student_email_key`(`email`),
    UNIQUE INDEX `student_roll_number_key`(`roll_number`),
    INDEX `student_name_roll_number_email_phone_idx`(`name`, `roll_number`, `email`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_ticket_Detail` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NULL,
    `student_id` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `support_ticket_Detail_management_staff_id_idx`(`management_staff_id`),
    INDEX `support_ticket_Detail_student_id_idx`(`student_id`),
    INDEX `support_ticket_Detail_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_detail` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NULL,
    `student_id` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Other') NOT NULL,
    `leave_mode` ENUM('Half_Day', 'Full_Day') NOT NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `leave_detail_management_staff_id_idx`(`management_staff_id`),
    INDEX `leave_detail_student_id_idx`(`student_id`),
    INDEX `leave_detail_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_detail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `batchName` VARCHAR(191) NULL,
    `batch_stud_count` VARCHAR(191) NOT NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `slot` ENUM('morning', 'evening') NOT NULL,
    `mentor_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `batch_detail_id_key`(`id`),
    UNIQUE INDEX `batch_detail_batch_number_key`(`batch_number`),
    INDEX `batch_detail_id_idx`(`id`),
    INDEX `batch_detail_mentor_id_idx`(`mentor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_with_student` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stored_otp_detail` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `stored_otp_detail_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message', 'material_uploaded', 'session_uploaded', 'session_completed') NOT NULL,
    `category` ENUM('all', 'staffs', 'students') NULL,
    `batch_ids` VARCHAR(191) NOT NULL,
    `student_ids` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `scheduledAt` BIGINT NULL,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `notification_senderId_status_idx`(`senderId`, `status`),
    INDEX `notification_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_recipient` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `managementStaffId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `batchId` VARCHAR(191) NULL,
    `receiverRole` ENUM('staff', 'guest', 'student') NOT NULL,
    `type` ENUM('course_test', 'mock_test', 'leave', 'support_ticket', 'message', 'material_uploaded', 'session_uploaded', 'session_completed') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `sentAt` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_recipient_notificationId_status_idx`(`notificationId`, `status`),
    INDEX `notification_recipient_managementStaffId_idx`(`managementStaffId`),
    INDEX `notification_recipient_studentId_idx`(`studentId`),
    INDEX `notification_recipient_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_sheet_detail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `session_file_name` VARCHAR(191) NOT NULL,
    `session_file_url` VARCHAR(191) NOT NULL,
    `status` ENUM('completed', 'inComplete') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `session_sheet_detail_id_batch_id_session_file_name_status_idx`(`id`, `batch_id`, `session_file_name`, `status`),
    UNIQUE INDEX `session_sheet_detail_id_batch_id_key`(`id`, `batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_sheet_student_report_detail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `session_sheet_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `status` ENUM('completed', 'inComplete') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `session_sheet_student_report_detail_id_key`(`id`),
    INDEX `session_sheet_student_report_detail_id_session_sheet_id_stat_idx`(`id`, `session_sheet_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_file_detail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `material_file_name` VARCHAR(191) NOT NULL,
    `material_file_url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `material_file_detail_id_key`(`id`),
    INDEX `material_file_detail_id_batch_id_material_file_name_idx`(`id`, `batch_id`, `material_file_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_material_access` (
    `id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `material_id` VARCHAR(191) NOT NULL,
    `access_granted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_material_access_id_key`(`id`),
    UNIQUE INDEX `student_material_access_student_id_material_id_key`(`student_id`, `material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xls_file_detail` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `xls_file_name` VARCHAR(191) NOT NULL,
    `xls_file_url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `xls_file_detail_id_key`(`id`),
    INDEX `xls_file_detail_id_management_staff_id_xls_file_name_idx`(`id`, `management_staff_id`, `xls_file_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `attendance_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_present` BOOLEAN NOT NULL,
    `status` ENUM('present', 'absent') NOT NULL DEFAULT 'present',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `student_attendance_id_batch_id_idx`(`id`, `batch_id`),
    UNIQUE INDEX `student_attendance_batch_id_attendance_date_key`(`batch_id`, `attendance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student` ADD CONSTRAINT `student_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_Detail` ADD CONSTRAINT `SupportTicket_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_Detail` ADD CONSTRAINT `SupportTicket_Student_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_detail` ADD CONSTRAINT `Leave_ManagementStaff_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_detail` ADD CONSTRAINT `Leave_Student_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_detail` ADD CONSTRAINT `batch_detail_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_with_student` ADD CONSTRAINT `batch_with_student_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_with_student` ADD CONSTRAINT `batch_with_student_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipient` ADD CONSTRAINT `notification_recipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipient` ADD CONSTRAINT `notification_recipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipient` ADD CONSTRAINT `notification_recipient_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_recipient` ADD CONSTRAINT `notification_recipient_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_sheet_detail` ADD CONSTRAINT `session_sheet_detail_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_sheet_student_report_detail` ADD CONSTRAINT `session_sheet_student_report_detail_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_sheet_student_report_detail` ADD CONSTRAINT `session_sheet_student_report_detail_session_sheet_id_fkey` FOREIGN KEY (`session_sheet_id`) REFERENCES `session_sheet_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `material_file_detail` ADD CONSTRAINT `material_file_detail_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_material_access` ADD CONSTRAINT `student_material_access_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_material_access` ADD CONSTRAINT `student_material_access_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `material_file_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xls_file_detail` ADD CONSTRAINT `xls_file_detail_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `management_staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch_detail`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_attendance` ADD CONSTRAINT `student_attendance_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
