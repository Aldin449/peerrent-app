-- AlterTable
ALTER TABLE `item` ADD COLUMN `category` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `idx_category` ON `Item`(`category`);
