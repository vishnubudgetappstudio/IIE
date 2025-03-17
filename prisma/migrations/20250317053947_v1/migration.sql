-- CreateTable
CREATE TABLE `ManagementStaff` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `profile_img_url` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ManagementStaff_id_key`(`id`),
    UNIQUE INDEX `ManagementStaff_email_key`(`email`),
    UNIQUE INDEX `ManagementStaff_employeeId_key`(`employeeId`),
    INDEX `ManagementStaff_id_idx`(`id`),
    INDEX `ManagementStaff_email_idx`(`email`),
    INDEX `ManagementStaff_employeeId_idx`(`employeeId`),
    INDEX `ManagementStaff_emailVerified_idx`(`emailVerified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportTicketDetails` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest', 'student') NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `SupportTicketDetails_management_staff_id_idx`(`management_staff_id`),
    INDEX `SupportTicketDetails_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveManagementStaff` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `leave_type` ENUM('Sick', 'Casual', 'Earned', 'Unpaid', 'Other') NOT NULL,
    `leave_mode` ENUM('Half_Day', 'Full_Day') NOT NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `LeaveManagementStaff_management_staff_id_idx`(`management_staff_id`),
    INDEX `LeaveManagementStaff_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `BatchDetail` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `batchName` VARCHAR(191) NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `slot` ENUM('morning', 'evening') NOT NULL,
    `session_sheet_url` VARCHAR(191) NULL,
    `session_sheet` JSON NULL,
    `mentor_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `BatchDetail_id_key`(`id`),
    UNIQUE INDEX `BatchDetail_batch_number_key`(`batch_number`),
    INDEX `BatchDetail_id_idx`(`id`),
    INDEX `BatchDetail_mentor_id_idx`(`mentor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchWithStudent` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoredOTPDetail` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `StoredOTPDetail_otp_key`(`otp`),
    INDEX `StoredOTPDetail_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `type` ENUM('system', 'alert', 'message', 'event') NOT NULL,
    `category` VARCHAR(191) NULL,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `scheduledAt` BIGINT NULL,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Notification_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `managementStaffId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `receiverRole` ENUM('staff', 'guest', 'student') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('Scheduled', 'Pending', 'Sent', 'Failed') NOT NULL DEFAULT 'Scheduled',
    `sentAt` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationRecipient_notificationId_idx`(`notificationId`),
    INDEX `NotificationRecipient_managementStaffId_idx`(`managementStaffId`),
    INDEX `NotificationRecipient_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicketDetails` ADD CONSTRAINT `SupportTicketDetails_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveManagementStaff` ADD CONSTRAINT `LeaveManagementStaff_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchDetail` ADD CONSTRAINT `BatchDetail_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudent` ADD CONSTRAINT `BatchWithStudent_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `BatchDetail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchWithStudent` ADD CONSTRAINT `BatchWithStudent_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_managementStaffId_fkey` FOREIGN KEY (`managementStaffId`) REFERENCES `ManagementStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
