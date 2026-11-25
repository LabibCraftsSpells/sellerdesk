-- ============================================================
-- SellerDesk Database Schema
-- MariaDB / MySQL  |  utf8mb4  |  InnoDB (Multi-Tenant Architecture)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- sellers (Tenants)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sellers` (
  `id`            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(120)      NOT NULL,
  `slug`          VARCHAR(120)      NOT NULL,
  `email`         VARCHAR(191)      DEFAULT NULL,
  `phone`         VARCHAR(50)       DEFAULT NULL,
  `is_active`     TINYINT(1)        NOT NULL DEFAULT 1,
  `created_at`    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sellers_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  `seller_id`     INT UNSIGNED      NOT NULL,
  `name`          VARCHAR(120)      NOT NULL,
  `email`         VARCHAR(191)      NOT NULL,
  `password_hash` VARCHAR(255)      NOT NULL,
  `role`          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  `is_active`     TINYINT(1)        NOT NULL DEFAULT 1,
  `created_at`    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_seller` (`seller_id`),
  CONSTRAINT `fk_users_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- settings (Key-value store per seller)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id`  INT UNSIGNED NOT NULL,
  `key`        VARCHAR(100) NOT NULL,
  `value`      TEXT,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settings_seller_key` (`seller_id`, `key`),
  KEY `idx_settings_seller` (`seller_id`),
  CONSTRAINT `fk_settings_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id`                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  `seller_id`           INT UNSIGNED      NOT NULL,
  `name`                VARCHAR(255)      NOT NULL,
  `sku`                 VARCHAR(100)      NOT NULL,
  `category`            VARCHAR(100)      DEFAULT NULL,
  `photo_url`           VARCHAR(512)      DEFAULT NULL,
  `image_url`           VARCHAR(512)      DEFAULT NULL,
  `description`         TEXT              DEFAULT NULL,
  `unit`                VARCHAR(50)       DEFAULT 'pcs',
  `buying_cost`         DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  `cost_price`          DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  `selling_price`       DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  `sale_price`          DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  `stock_quantity`      INT               NOT NULL DEFAULT 0,
  `low_stock_threshold` INT               NOT NULL DEFAULT 5,
  `is_active`           TINYINT(1)        NOT NULL DEFAULT 1,
  `deleted_at`          DATETIME          DEFAULT NULL,
  `created_at`          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_seller_sku` (`seller_id`, `sku`),
  KEY `idx_products_seller` (`seller_id`),
  KEY `idx_products_sku` (`sku`),
  CONSTRAINT `fk_products_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- product_variants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `product_id`     INT UNSIGNED  NOT NULL,
  `name`           VARCHAR(100)  NOT NULL,
  `sku`            VARCHAR(100)  DEFAULT NULL,
  `sku_suffix`     VARCHAR(50)   DEFAULT NULL,
  `sale_price`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cost_price`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `extra_cost`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_pv_product_id` (`product_id`),
  CONSTRAINT `fk_pv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `seller_id`    INT UNSIGNED  NOT NULL,
  `name`         VARCHAR(120)  NOT NULL,
  `phone`        VARCHAR(20)   NOT NULL,
  `district`     VARCHAR(100)  DEFAULT NULL,
  `area`         VARCHAR(100)  DEFAULT NULL,
  `full_address` TEXT          DEFAULT NULL,
  `address`      TEXT          DEFAULT NULL,
  `notes`        TEXT          DEFAULT NULL,
  `total_orders` INT UNSIGNED  NOT NULL DEFAULT 0,
  `total_spent`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `return_count` INT UNSIGNED  NOT NULL DEFAULT 0,
  `is_risky`     TINYINT(1)    NOT NULL DEFAULT 0,
  `deleted_at`   DATETIME      DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customers_seller_phone` (`seller_id`, `phone`),
  KEY `idx_customers_seller` (`seller_id`),
  KEY `idx_customers_phone` (`phone`),
  CONSTRAINT `fk_customers_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `seller_id`       INT UNSIGNED  NOT NULL,
  `order_number`    VARCHAR(50)   NOT NULL,
  `customer_id`     INT UNSIGNED  NOT NULL,
  `status`          ENUM('new','confirmed','shipped','delivered','returned','cancelled') NOT NULL DEFAULT 'new',
  `courier`         VARCHAR(100)  DEFAULT NULL,
  `tracking_id`     VARCHAR(100)  DEFAULT NULL,
  `subtotal`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping_cost`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount`        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method`  ENUM('cod','bkash','nagad','bank','advance') NOT NULL DEFAULT 'cod',
  `advance_amount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `advance_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `source`          ENUM('facebook','instagram','whatsapp','other') NOT NULL DEFAULT 'facebook',
  `note`            TEXT          DEFAULT NULL,
  `cod_amount`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cod_collected`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cod_settled`     TINYINT(1)    NOT NULL DEFAULT 0,
  `cod_settled_at`  DATETIME      DEFAULT NULL,
  `cod_received`    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `created_by`      INT UNSIGNED  NOT NULL,
  `deleted_at`      DATETIME      DEFAULT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_seller_order_number` (`seller_id`, `order_number`),
  KEY `idx_orders_seller` (`seller_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_customer_id` (`customer_id`),
  CONSTRAINT `fk_orders_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- order_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `order_id`     INT UNSIGNED  NOT NULL,
  `product_id`   INT UNSIGNED  NOT NULL,
  `variant_id`   INT UNSIGNED  DEFAULT NULL,
  `product_name` VARCHAR(255)  NOT NULL,
  `variant_name` VARCHAR(100)  DEFAULT NULL,
  `quantity`     INT UNSIGNED  NOT NULL DEFAULT 1,
  `unit_price`   DECIMAL(10,2) NOT NULL,
  `buying_cost`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cost_price`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order_id` (`order_id`),
  KEY `idx_oi_product_id` (`product_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_oi_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- order_status_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   INT UNSIGNED NOT NULL,
  `status`     VARCHAR(50)  NOT NULL,
  `changed_by` INT UNSIGNED DEFAULT NULL,
  `note`       TEXT         DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_osh_order_id` (`order_id`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- stock_movements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seller_id`  INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `variant_id` INT UNSIGNED DEFAULT NULL,
  `type`       ENUM('restock','deducted','returned','damaged','correction') NOT NULL,
  `quantity`   INT          NOT NULL,
  `reason`     VARCHAR(255) DEFAULT NULL,
  `order_id`   INT UNSIGNED DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sm_seller` (`seller_id`),
  KEY `idx_sm_product_id` (`product_id`),
  CONSTRAINT `fk_sm_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sm_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_sm_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sm_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sm_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- courier_settlements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courier_settlements` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `seller_id`      INT UNSIGNED  NOT NULL,
  `courier`        VARCHAR(100)  NOT NULL,
  `settled_orders` TEXT          DEFAULT NULL,
  `total_amount`   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `settled_at`     DATETIME      NOT NULL,
  `notes`          TEXT          DEFAULT NULL,
  `created_by`     INT UNSIGNED  NOT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cs_seller` (`seller_id`),
  KEY `idx_cs_courier` (`courier`),
  CONSTRAINT `fk_cs_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cs_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
