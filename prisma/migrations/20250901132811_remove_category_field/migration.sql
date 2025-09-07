/*
  Warnings:

  - You are about to drop the column `category` on the `item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `idx_category` ON `item`;

-- AlterTable
ALTER TABLE `item` DROP COLUMN `category`;
