-- AlterTable
ALTER TABLE `booking` ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'DECLINED') NOT NULL DEFAULT 'PENDING';

-- RenameIndex
ALTER TABLE `booking` RENAME INDEX `Booking_itemId_fkey` TO `Booking_itemId_idx`;

-- RenameIndex
ALTER TABLE `booking` RENAME INDEX `Booking_userId_fkey` TO `Booking_userId_idx`;
