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
CREATE TABLE `SupportTicket` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `query` VARCHAR(191) NOT NULL,
    `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    `attachments` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `SupportTicket_management_staff_id_idx`(`management_staff_id`),
    INDEX `SupportTicket_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `management_staff_id` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'counsellor', 'staff', 'guest') NOT NULL,
    `leave_type` ENUM('SICK', 'CASUAL', 'EARNED', 'UNPAID', 'OTHER') NOT NULL,
    `from_date` DATETIME(3) NOT NULL,
    `to_date` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `LeaveRequest_management_staff_id_idx`(`management_staff_id`),
    INDEX `LeaveRequest_status_idx`(`status`),
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
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreateBatch` (
    `id` VARCHAR(191) NOT NULL,
    `batch_number` VARCHAR(191) NOT NULL,
    `batchName` VARCHAR(191) NULL,
    `from_date` VARCHAR(191) NOT NULL,
    `to_date` VARCHAR(191) NOT NULL,
    `course` VARCHAR(191) NOT NULL,
    `slot` VARCHAR(191) NOT NULL,
    `session_sheet` VARCHAR(191) NULL,
    `mentor_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `CreateBatch_id_key`(`id`),
    UNIQUE INDEX `CreateBatch_batch_number_key`(`batch_number`),
    INDEX `CreateBatch_id_idx`(`id`),
    INDEX `CreateBatch_mentor_id_idx`(`mentor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchStudent` (
    `batch_id` VARCHAR(191) NOT NULL,
    `student_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`batch_id`, `student_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SupportTicket` ADD CONSTRAINT `SupportTicket_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_management_staff_id_fkey` FOREIGN KEY (`management_staff_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_counsellor_id_fkey` FOREIGN KEY (`counsellor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreateBatch` ADD CONSTRAINT `CreateBatch_mentor_id_fkey` FOREIGN KEY (`mentor_id`) REFERENCES `ManagementStaff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudent` ADD CONSTRAINT `BatchStudent_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `CreateBatch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchStudent` ADD CONSTRAINT `BatchStudent_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
