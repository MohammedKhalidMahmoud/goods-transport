/*
  Warnings:

  - You are about to drop the column `branch_id` on the `company_users` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `Enum(EnumId(2))`.
  - You are about to drop the `areas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `company_branches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_addresses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `file_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `individual_customers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provider_service_areas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `zones` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_type` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `areas` DROP FOREIGN KEY `areas_city_id_fkey`;

-- DropForeignKey
ALTER TABLE `areas` DROP FOREIGN KEY `areas_zone_id_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `branches` DROP FOREIGN KEY `branches_provider_id_fkey`;

-- DropForeignKey
ALTER TABLE `company_branches` DROP FOREIGN KEY `company_branches_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `company_users` DROP FOREIGN KEY `company_users_branch_id_fkey`;

-- DropForeignKey
ALTER TABLE `customer_addresses` DROP FOREIGN KEY `customer_addresses_individual_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `customer_reviews` DROP FOREIGN KEY `customer_reviews_individual_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `customer_reviews` DROP FOREIGN KEY `customer_reviews_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `customer_reviews` DROP FOREIGN KEY `customer_reviews_provider_id_fkey`;

-- DropForeignKey
ALTER TABLE `file_assets` DROP FOREIGN KEY `file_assets_uploaded_by_fkey`;

-- DropForeignKey
ALTER TABLE `individual_customers` DROP FOREIGN KEY `individual_customers_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `provider_service_areas` DROP FOREIGN KEY `provider_service_areas_area_id_fkey`;

-- DropForeignKey
ALTER TABLE `provider_service_areas` DROP FOREIGN KEY `provider_service_areas_provider_id_fkey`;

-- DropIndex
DROP INDEX `company_users_branch_id_fkey` ON `company_users`;

-- AlterTable
ALTER TABLE `company_users` DROP COLUMN `branch_id`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `app_role` ENUM('CUSTOMER', 'PROVIDER') NULL,
    ADD COLUMN `avatar_url` VARCHAR(191) NULL,
    ADD COLUMN `first_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    ADD COLUMN `last_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `user_type` ENUM('APP', 'DASHBOARD') NOT NULL,
    MODIFY `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') NOT NULL DEFAULT 'PENDING_VERIFICATION';

-- DropTable
DROP TABLE `areas`;

-- DropTable
DROP TABLE `audit_logs`;

-- DropTable
DROP TABLE `branches`;

-- DropTable
DROP TABLE `company_branches`;

-- DropTable
DROP TABLE `customer_addresses`;

-- DropTable
DROP TABLE `customer_reviews`;

-- DropTable
DROP TABLE `file_assets`;

-- DropTable
DROP TABLE `individual_customers`;

-- DropTable
DROP TABLE `profiles`;

-- DropTable
DROP TABLE `provider_service_areas`;

-- DropTable
DROP TABLE `zones`;

-- CreateTable
CREATE TABLE `dashboard_user_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `my_admin` BOOLEAN NOT NULL DEFAULT false,
    `job_title` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dashboard_user_profiles_user_id_key`(`user_id`),
    INDEX `dashboard_user_profiles_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provider_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `business_name` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `address` TEXT NULL,
    `tax_number` VARCHAR(191) NULL,
    `license_number` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `provider_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_user_type_idx` ON `users`(`user_type`);

-- CreateIndex
CREATE INDEX `users_app_role_idx` ON `users`(`app_role`);

-- AddForeignKey
ALTER TABLE `dashboard_user_profiles` ADD CONSTRAINT `dashboard_user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dashboard_user_profiles` ADD CONSTRAINT `dashboard_user_profiles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_profiles` ADD CONSTRAINT `provider_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
