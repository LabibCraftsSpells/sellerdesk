-- ============================================================
-- SellerDesk Multi-Tenant Seed Data
-- MariaDB / MySQL | utf8mb4 | InnoDB
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE `courier_settlements`;
TRUNCATE TABLE `stock_movements`;
TRUNCATE TABLE `order_status_history`;
TRUNCATE TABLE `order_items`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `product_variants`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `settings`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `sellers`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. sellers (Tenants)
-- ------------------------------------------------------------
INSERT INTO `sellers` (`id`, `name`, `slug`, `email`, `phone`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Fashion House BD', 'fashion-house', 'admin@demo.com', '01700000001', 1, NOW(), NOW()),
(2, 'Gadget Planet', 'gadget-planet', 'seller2@demo.com', '01800000002', 1, NOW(), NOW());

-- ------------------------------------------------------------
-- 2. users (Admin & Staff per Seller)
-- Passwords:
-- admin@demo.com   -> Admin@123
-- staff@demo.com   -> Staff@123
-- seller2@demo.com -> Seller2@123
-- staff2@demo.com  -> Staff2@123
-- ------------------------------------------------------------
INSERT INTO `users` (`id`, `seller_id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Demo Admin', 'admin@demo.com', '$2a$12$kYlUZWzo8cqb/modMZdDr.iD4B.KIIcqJhqc.HZlAvS4OC7kF5h3e', 'admin', 1, NOW(), NOW()),
(2, 1, 'Demo Staff', 'staff@demo.com', '$2a$12$QjxKpqco..fQgEHzGu5kB.f0BsrEhVxar07KrCszOmk36UJZicqk.', 'staff', 1, NOW(), NOW()),
(3, 2, 'Seller 2 Admin', 'seller2@demo.com', '$2a$12$2cOB4aMf4X0Zrz6INv2UvuonxwdaWJEa1.ohlX.q3eR6yWvP7Vvdi', 'admin', 1, NOW(), NOW()),
(4, 2, 'Seller 2 Staff', 'staff2@demo.com', '$2a$12$CYnPcYeMslwaY3W6Kcg6luv8ejTujB7lJmSXK/dk4DSQYfycY0use', 'staff', 1, NOW(), NOW());

-- ------------------------------------------------------------
-- 3. settings
-- ------------------------------------------------------------
INSERT INTO `settings` (`seller_id`, `key`, `value`, `updated_at`) VALUES
(1, 'business_name', 'Fashion House BD', NOW()),
(1, 'business_phone', '01700000001', NOW()),
(1, 'default_delivery_charge', '60', NOW()),
(1, 'low_stock_threshold', '5', NOW()),
(1, 'language', 'en', NOW()),
(1, 'currency', 'BDT', NOW()),
(1, 'timezone', 'Asia/Dhaka', NOW()),
(2, 'business_name', 'Gadget Planet', NOW()),
(2, 'business_phone', '01800000002', NOW()),
(2, 'default_delivery_charge', '80', NOW()),
(2, 'low_stock_threshold', '10', NOW()),
(2, 'language', 'en', NOW()),
(2, 'currency', 'BDT', NOW()),
(2, 'timezone', 'Asia/Dhaka', NOW());

-- ------------------------------------------------------------
-- 4. products (Seller 1 Fashion & Cosmetics, Seller 2 Gadgets)
-- ------------------------------------------------------------
INSERT INTO `products` (`id`, `seller_id`, `name`, `sku`, `category`, `buying_cost`, `cost_price`, `selling_price`, `sale_price`, `stock_quantity`, `low_stock_threshold`, `unit`, `is_active`, `created_at`, `updated_at`) VALUES
-- Seller 1
(1, 1, 'Cotton Panjabi (Blue)', 'PNJ-CTN-BLU', 'Fashion', 320.00, 320.00, 650.00, 650.00, 45, 5, 'pcs', 1, NOW(), NOW()),
(2, 1, 'Cotton Panjabi (White)', 'PNJ-CTN-WHT', 'Fashion', 320.00, 320.00, 650.00, 650.00, 3, 5, 'pcs', 1, NOW(), NOW()),
(3, 1, 'Kurti Printed (Floral)', 'KRT-PRN-FLR', 'Fashion', 280.00, 280.00, 580.00, 580.00, 60, 5, 'pcs', 1, NOW(), NOW()),
(4, 1, 'Kurti Printed (Geometric)', 'KRT-PRN-GEO', 'Fashion', 290.00, 290.00, 599.00, 599.00, 4, 5, 'pcs', 1, NOW(), NOW()),
(5, 1, 'Half Sleeve T-Shirt (Black)', 'TSH-HLF-BLK', 'Fashion', 150.00, 150.00, 320.00, 320.00, 110, 10, 'pcs', 1, NOW(), NOW()),
(6, 1, 'Denim Jeans (Slim Fit)', 'JNS-DNM-SLM', 'Fashion', 480.00, 480.00, 950.00, 950.00, 30, 5, 'pcs', 1, NOW(), NOW()),
(7, 1, 'Lipstick Set - 6 Colors', 'CSM-LPS-6PC', 'Cosmetics', 180.00, 180.00, 399.00, 399.00, 70, 10, 'pcs', 1, NOW(), NOW()),
(8, 1, 'Face Wash Tube (Neem)', 'CSM-FWS-NEM', 'Cosmetics', 95.00, 95.00, 220.00, 220.00, 100, 15, 'pcs', 1, NOW(), NOW()),
(9, 1, 'Whitening Night Cream 50g', 'CSM-NCR-WNT', 'Cosmetics', 140.00, 140.00, 350.00, 350.00, 55, 10, 'pcs', 1, NOW(), NOW()),
(10, 1, 'Aloe Vera Gel 200ml', 'CSM-AVG-200', 'Cosmetics', 85.00, 85.00, 199.00, 199.00, 2, 5, 'pcs', 1, NOW(), NOW()),
-- Seller 2
(11, 2, 'RGB Mechanical Keyboard', 'GAD-KEY-RGB', 'Gadgets', 1200.00, 1200.00, 2400.00, 2400.00, 25, 5, 'pcs', 1, NOW(), NOW()),
(12, 2, 'Wireless Gaming Mouse', 'GAD-MOU-WLS', 'Gadgets', 450.00, 450.00, 950.00, 950.00, 40, 8, 'pcs', 1, NOW(), NOW()),
(13, 2, 'USB-C Multiport Hub (7-in-1)', 'GAD-HUB-7IN1', 'Gadgets', 850.00, 850.00, 1650.00, 1650.00, 30, 5, 'pcs', 1, NOW(), NOW()),
(14, 2, 'Aluminum Laptop Stand', 'GAD-STD-ALU', 'Gadgets', 520.00, 520.00, 1150.00, 1150.00, 35, 5, 'pcs', 1, NOW(), NOW()),
(15, 2, 'Noise-Cancelling TWS Earbuds', 'GAD-TWS-PRO', 'Gadgets', 650.00, 650.00, 1350.00, 1350.00, 3, 5, 'pcs', 1, NOW(), NOW());

-- ------------------------------------------------------------
-- 5. customers
-- ------------------------------------------------------------
INSERT INTO `customers` (`id`, `seller_id`, `name`, `phone`, `district`, `area`, `full_address`, `address`, `total_orders`, `total_spent`, `return_count`, `is_risky`, `created_at`, `updated_at`) VALUES
-- Seller 1 Customers
(1, 1, 'Md. Rafiqul Islam', '01711234561', 'Dhaka', 'Mirpur', 'Mirpur, Dhaka', 'Mirpur, Dhaka', 3, 2150.00, 0, 0, NOW(), NOW()),
(2, 1, 'Fatema Akter', '01812345672', 'Chittagong', 'Agrabad', 'Agrabad, Chittagong', 'Agrabad, Chittagong', 2, 1640.00, 0, 0, NOW(), NOW()),
(3, 1, 'Shahinur Rahman', '01913456783', 'Sylhet', 'Zindabazar', 'Zindabazar, Sylhet', 'Zindabazar, Sylhet', 1, 650.00, 0, 0, NOW(), NOW()),
(4, 1, 'Rakibul Hasan', '01913460783', 'Jessore', 'Khajura', 'Khajura, Jessore', 'Khajura, Jessore', 5, 0.00, 4, 1, NOW(), NOW()),
-- Seller 2 Customers
(5, 2, 'Tanvir Hossain', '01720000001', 'Dhaka', 'Uttara', 'Uttara Sector 7, Dhaka', 'Uttara Sector 7, Dhaka', 2, 4880.00, 0, 0, NOW(), NOW()),
(6, 2, 'Sadia Chowdhury', '01820000002', 'Chittagong', 'Nasirabad', 'Nasirabad, Chittagong', 'Nasirabad, Chittagong', 1, 1030.00, 0, 0, NOW(), NOW());

-- ------------------------------------------------------------
-- 6. orders
-- ------------------------------------------------------------
INSERT INTO `orders` (`id`, `seller_id`, `order_number`, `customer_id`, `status`, `courier`, `tracking_id`, `subtotal`, `delivery_charge`, `discount`, `total`, `payment_method`, `advance_amount`, `source`, `note`, `cod_amount`, `cod_collected`, `cod_settled`, `cod_settled_at`, `cod_received`, `created_by`, `created_at`, `updated_at`) VALUES
-- Seller 1 Orders
(1, 1, 'SD-00001', 1, 'delivered', 'Pathao', 'PAT123456', 650.00, 60.00, 0.00, 710.00, 'cod', 0.00, 'facebook', 'Please deliver fast', 710.00, 710.00, 1, '2026-11-10 10:00:00', 710.00, 1, NOW(), NOW()),
(2, 1, 'SD-00002', 2, 'delivered', 'Steadfast', 'STD654321', 580.00, 60.00, 0.00, 640.00, 'cod', 0.00, 'facebook', NULL, 640.00, 640.00, 0, NULL, 0.00, 2, NOW(), NOW()),
(3, 1, 'SD-00003', 3, 'shipped', 'RedX', 'RED987654', 320.00, 60.00, 0.00, 380.00, 'cod', 0.00, 'whatsapp', NULL, 380.00, 0.00, 0, NULL, 0.00, 2, NOW(), NOW()),
(4, 1, 'SD-00004', 1, 'new', 'Pathao', NULL, 950.00, 60.00, 50.00, 960.00, 'bkash', 0.00, 'instagram', NULL, 0.00, 0.00, 0, NULL, 0.00, 1, NOW(), NOW()),
(5, 1, 'SD-00005', 4, 'returned', 'Paperfly', 'PAP555111', 399.00, 60.00, 0.00, 459.00, 'cod', 0.00, 'facebook', 'Customer cancelled at door', 459.00, 0.00, 0, NULL, 0.00, 2, NOW(), NOW()),
-- Seller 2 Orders
(6, 2, 'GP-00001', 5, 'delivered', 'Steadfast', 'STD888111', 2400.00, 80.00, 0.00, 2480.00, 'cod', 0.00, 'facebook', 'Keyboard delivery', 2480.00, 2480.00, 0, NULL, 0.00, 3, NOW(), NOW()),
(7, 2, 'GP-00002', 6, 'shipped', 'Pathao', 'PAT999222', 950.00, 80.00, 0.00, 1030.00, 'cod', 0.00, 'facebook', 'Gaming mouse', 1030.00, 0.00, 0, NULL, 0.00, 4, NOW(), NOW());

-- ------------------------------------------------------------
-- 7. order_items
-- ------------------------------------------------------------
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `buying_cost`, `cost_price`) VALUES
(1, 1, 1, 'Cotton Panjabi (Blue)', 1, 650.00, 320.00, 320.00),
(2, 2, 3, 'Kurti Printed (Floral)', 1, 580.00, 280.00, 280.00),
(3, 3, 5, 'Half Sleeve T-Shirt (Black)', 1, 320.00, 150.00, 150.00),
(4, 4, 6, 'Denim Jeans (Slim Fit)', 1, 950.00, 480.00, 480.00),
(5, 5, 7, 'Lipstick Set - 6 Colors', 1, 399.00, 180.00, 180.00),
(6, 6, 11, 'RGB Mechanical Keyboard', 1, 2400.00, 1200.00, 1200.00),
(7, 7, 12, 'Wireless Gaming Mouse', 1, 950.00, 450.00, 450.00);

-- ------------------------------------------------------------
-- 8. order_status_history
-- ------------------------------------------------------------
INSERT INTO `order_status_history` (`id`, `order_id`, `status`, `changed_by`, `note`, `created_at`) VALUES
(1, 1, 'new', 1, 'Order created', NOW()),
(2, 1, 'confirmed', 1, 'Order verified', NOW()),
(3, 1, 'shipped', 1, 'Dispatched to Pathao', NOW()),
(4, 1, 'delivered', 1, 'Customer received parcel', NOW()),
(5, 2, 'new', 2, 'Order created', NOW()),
(6, 2, 'delivered', 2, 'Delivered by Steadfast', NOW()),
(7, 3, 'new', 2, 'Order created', NOW()),
(8, 3, 'shipped', 2, 'Dispatched to RedX', NOW()),
(9, 4, 'new', 1, 'Order created via bKash', NOW()),
(10, 5, 'new', 2, 'Order created', NOW()),
(11, 5, 'returned', 2, 'Customer refused delivery', NOW()),
(12, 6, 'new', 3, 'Order created', NOW()),
(13, 6, 'delivered', 3, 'Delivered', NOW()),
(14, 7, 'new', 4, 'Order created', NOW()),
(15, 7, 'shipped', 4, 'Shipped with Pathao', NOW());

-- ------------------------------------------------------------
-- 9. stock_movements
-- ------------------------------------------------------------
INSERT INTO `stock_movements` (`id`, `seller_id`, `product_id`, `type`, `quantity`, `reason`, `order_id`, `created_by`, `created_at`) VALUES
(1, 1, 1, 'deducted', 1, 'Order SD-00001 confirmed', 1, 1, NOW()),
(2, 1, 3, 'deducted', 1, 'Order SD-00002 confirmed', 2, 2, NOW()),
(3, 1, 5, 'deducted', 1, 'Order SD-00003 confirmed', 3, 2, NOW()),
(4, 1, 7, 'deducted', 1, 'Order SD-00005 confirmed', 5, 2, NOW()),
(5, 1, 7, 'returned', 1, 'Returned from order SD-00005', 5, 2, NOW()),
(6, 2, 11, 'deducted', 1, 'Order GP-00001 confirmed', 6, 3, NOW()),
(7, 2, 12, 'deducted', 1, 'Order GP-00002 confirmed', 7, 4, NOW());

-- ------------------------------------------------------------
-- 10. courier_settlements
-- ------------------------------------------------------------
INSERT INTO `courier_settlements` (`id`, `seller_id`, `courier`, `settled_orders`, `total_amount`, `settled_at`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 'Pathao', '["SD-00001"]', 710.00, '2026-11-10', 'First batch settlement for delivered orders', 1, NOW());
