/*
  Warnings:

  - You are about to drop the column `company_id` on the `invoices` table. All the data in the column will be lost.
  - The values [pending_approval,approved,rejected] on the enum `order_status_history_to_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending_approval,approved,rejected] on the enum `order_status_history_to_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `company_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `service_type_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `source_type` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `vehicle_type_id` on the `orders` table. All the data in the column will be lost.
  - The values [pending_approval,approved,rejected] on the enum `order_status_history_to_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `service_type_code` on the `pricing_settings` table. All the data in the column will be lost.
  - You are about to drop the `approval_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `company_billing_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `company_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provider_vehicles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_types` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[service_code]` on the table `pricing_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `service_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_code` to the `pricing_settings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `approval_history` DROP FOREIGN KEY `approval_history_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `approval_rules` DROP FOREIGN KEY `approval_rules_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `company_billing_profiles` DROP FOREIGN KEY `company_billing_profiles_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `company_users` DROP FOREIGN KEY `company_users_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `company_users` DROP FOREIGN KEY `company_users_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_service_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_vehicle_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `provider_vehicles` DROP FOREIGN KEY `provider_vehicles_provider_id_fkey`;

-- DropForeignKey
ALTER TABLE `provider_vehicles` DROP FOREIGN KEY `provider_vehicles_vehicle_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `service_types` DROP FOREIGN KEY `service_types_service_category_id_fkey`;

-- DropIndex
DROP INDEX `invoices_company_id_status_idx` ON `invoices`;

-- DropIndex
DROP INDEX `orders_company_id_status_idx` ON `orders`;

-- DropIndex
DROP INDEX `orders_service_type_id_fkey` ON `orders`;

-- DropIndex
DROP INDEX `orders_vehicle_type_id_fkey` ON `orders`;

-- DropIndex
DROP INDEX `pricing_settings_service_type_code_key` ON `pricing_settings`;

-- AlterTable
ALTER TABLE `invoices` DROP COLUMN `company_id`;

-- AlterTable
ALTER TABLE `order_status_history` MODIFY `from_status` ENUM('draft', 'submitted', 'published_for_offers', 'offer_received', 'offer_accepted', 'assigned', 'en_route_to_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered', 'completed', 'canceled') NULL,
    MODIFY `to_status` ENUM('draft', 'submitted', 'published_for_offers', 'offer_received', 'offer_accepted', 'assigned', 'en_route_to_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered', 'completed', 'canceled') NOT NULL;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `company_id`,
    DROP COLUMN `service_type_id`,
    DROP COLUMN `source_type`,
    DROP COLUMN `vehicle_type_id`,
    ADD COLUMN `service_id` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('draft', 'submitted', 'published_for_offers', 'offer_received', 'offer_accepted', 'assigned', 'en_route_to_pickup', 'arrived_pickup', 'picked_up', 'in_transit', 'arrived_dropoff', 'delivered', 'completed', 'canceled') NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE `pricing_settings` DROP COLUMN `service_type_code`,
    ADD COLUMN `service_code` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `approval_history`;

-- DropTable
DROP TABLE `approval_rules`;

-- DropTable
DROP TABLE `companies`;

-- DropTable
DROP TABLE `company_billing_profiles`;

-- DropTable
DROP TABLE `company_users`;

-- DropTable
DROP TABLE `provider_vehicles`;

-- DropTable
DROP TABLE `service_categories`;

-- DropTable
DROP TABLE `service_types`;

-- DropTable
DROP TABLE `vehicle_types`;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `pricing_settings_service_code_key` ON `pricing_settings`(`service_code`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
