/*
  Warnings:

  - A unique constraint covering the columns `[service_type_code]` on the table `pricing_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `delivery_proofs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `delivery_proofs` ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `providers` ADD COLUMN `is_accepting_orders` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `file_assets` (
    `id` VARCHAR(191) NOT NULL,
    `category` ENUM('order_attachment', 'provider_document', 'delivery_proof', 'invoice_document', 'support_attachment', 'profile_image', 'company_logo') NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `file_assets_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `file_assets_uploaded_by_idx`(`uploaded_by`),
    INDEX `file_assets_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `pricing_settings_service_type_code_key` ON `pricing_settings`(`service_type_code`);

-- AddForeignKey
ALTER TABLE `file_assets` ADD CONSTRAINT `file_assets_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
