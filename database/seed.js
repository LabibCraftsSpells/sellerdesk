'use strict';

/**
 * seed.js — SellerDesk multi-tenant demo data seeder
 *
 * Reads DB config from .env, truncates all demo tables (FK-safe),
 * then inserts realistic multi-seller Bangladeshi demo data.
 *
 * Usage:  node database/seed.js
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Load .env from multiple potential locations
const envPaths = [
  process.env.ENV_FILE,
  path.resolve(__dirname, '../Node Express API/.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../.env'),
].filter(Boolean);

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();

const rawDbClient = (process.env.DB_CLIENT || '').toLowerCase();
const isMysql =
  rawDbClient === 'mysql' ||
  (!rawDbClient && (Boolean(process.env.MYSQLHOST) || Boolean(process.env.MYSQL_URL)));

const DB_CLIENT = isMysql ? 'mysql' : 'sqlite';

const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
const DB_USER = process.env.DB_USER || process.env.MYSQLUSER;
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sellerdesk';

if (DB_CLIENT === 'mysql' && !DB_USER && !process.env.MYSQL_URL) {
  console.error('[seed] ❌  DB_USER or MYSQLUSER must be set in .env when DB_CLIENT=mysql');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function dt(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function orderNumber(prefix, n) {
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

function dec(n) {
  return Math.round(n * 100) / 100;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'Paperfly'];
const PAYMENT_METHODS = ['cod', 'bkash', 'nagad', 'bank', 'advance'];
const SOURCES = ['facebook', 'instagram', 'whatsapp', 'other'];

const DISTRICTS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
  'Barishal', 'Comilla', 'Mymensingh', 'Narayanganj', 'Gazipur',
  'Bogura', 'Rangpur', 'Jessore', 'Tangail', 'Noakhali',
];

const AREAS = {
  Dhaka: ['Mirpur', 'Uttara', 'Dhanmondi', 'Mohammadpur', 'Gulshan', 'Badda', 'Rayer Bazar'],
  Chittagong: ['Agrabad', 'Nasirabad', 'Halishahar', 'Patenga', 'Sholoshahar'],
  Sylhet: ['Zindabazar', 'Ambarkhana', 'Shahjalal Upashahar', 'Subidbazar'],
  Rajshahi: ['Boalia', 'Motihar', 'Shah Makhdum', 'Rajpara'],
  Khulna: ['Khalishpur', 'Sonadanga', 'Daulatpur', 'Khan Jahan Ali'],
  Barishal: ['Kawnia', 'Kotwali', 'Barishal City', 'Rupatali'],
  Comilla: ['Kotbari', 'Kandirpar', 'Tomsom Bridge', 'Chaukbazar'],
  Mymensingh: ['Ganginarpar', 'Chorpara', 'Mashkanda', 'Town Hall'],
  Narayanganj: ['Fatullah', 'Siddhirganj', 'Rupganj', 'Araihazar'],
  Gazipur: ['Tongi', 'Joydebpur', 'Kaliakair', 'Kapasia'],
  Bogura: ['Chelopara', 'Sutrapur', 'Jhauthala', 'Maldah'],
  Rangpur: ['Mahiganj', 'Dhap', 'Jahajbari', 'Shapla Chattar'],
  Jessore: ['Khajura', 'Town Hall', 'Rail Road', 'Chanchra'],
  Tangail: ['Santosh', 'Pukurpara', 'Victoria Road', 'Kalibari'],
  Noakhali: ['Maijdee', 'Chowmuhani', 'Companiganj', 'Begumganj'],
};

// ─── Products for Seller 1 (Fashion House BD) ─────────────────────────────────

const SELLER1_PRODUCTS = [
  { name: 'Cotton Panjabi (Blue)', sku: 'PNJ-CTN-BLU', buying_cost: 320, selling_price: 650, stock_quantity: 45, low_stock_threshold: 5 },
  { name: 'Cotton Panjabi (White)', sku: 'PNJ-CTN-WHT', buying_cost: 320, selling_price: 650, stock_quantity: 3, low_stock_threshold: 5 },
  { name: 'Kurti Printed (Floral)', sku: 'KRT-PRN-FLR', buying_cost: 280, selling_price: 580, stock_quantity: 60, low_stock_threshold: 5 },
  { name: 'Kurti Printed (Geometric)', sku: 'KRT-PRN-GEO', buying_cost: 290, selling_price: 599, stock_quantity: 4, low_stock_threshold: 5 },
  { name: 'Half Sleeve T-Shirt (Black)', sku: 'TSH-HLF-BLK', buying_cost: 150, selling_price: 320, stock_quantity: 110, low_stock_threshold: 10 },
  { name: 'Half Sleeve T-Shirt (White)', sku: 'TSH-HLF-WHT', buying_cost: 150, selling_price: 320, stock_quantity: 85, low_stock_threshold: 10 },
  { name: 'Denim Jeans (Slim Fit)', sku: 'JNS-DNM-SLM', buying_cost: 480, selling_price: 950, stock_quantity: 30, low_stock_threshold: 5 },
  { name: 'Ladies Georgette Saree', sku: 'SRE-GRG-MIX', buying_cost: 550, selling_price: 1100, stock_quantity: 20, low_stock_threshold: 5 },
  { name: 'Kids Frock (Embroidered)', sku: 'KDS-FRK-EMB', buying_cost: 220, selling_price: 480, stock_quantity: 35, low_stock_threshold: 5 },
  { name: 'Lipstick Set - 6 Colors', sku: 'CSM-LPS-6PC', buying_cost: 180, selling_price: 399, stock_quantity: 70, low_stock_threshold: 10 },
  { name: 'Face Wash Tube (Neem)', sku: 'CSM-FWS-NEM', buying_cost: 95, selling_price: 220, stock_quantity: 100, low_stock_threshold: 15 },
  { name: 'Whitening Night Cream 50g', sku: 'CSM-NCR-WNT', buying_cost: 140, selling_price: 350, stock_quantity: 55, low_stock_threshold: 10 },
  { name: 'Aloe Vera Gel 200ml', sku: 'CSM-AVG-200', buying_cost: 85, selling_price: 199, stock_quantity: 2, low_stock_threshold: 5 },
  { name: 'Hair Oil (Coconut) 100ml', sku: 'CSM-HOL-COC', buying_cost: 70, selling_price: 160, stock_quantity: 90, low_stock_threshold: 10 },
  { name: 'Kajal Pencil Pack (3 pcs)', sku: 'CSM-KJL-3PC', buying_cost: 60, selling_price: 149, stock_quantity: 150, low_stock_threshold: 15 },
  { name: 'Casual Polo Shirt (Navy)', sku: 'POL-NAV-001', buying_cost: 250, selling_price: 520, stock_quantity: 40, low_stock_threshold: 5 },
  { name: 'Linen Casual Trouser', sku: 'TRS-LIN-BEI', buying_cost: 380, selling_price: 750, stock_quantity: 25, low_stock_threshold: 5 },
  { name: 'Printed Silk Dupatta', sku: 'DUP-SLK-PRN', buying_cost: 190, selling_price: 420, stock_quantity: 50, low_stock_threshold: 5 },
  { name: 'Casual Leather Belt', sku: 'BLT-LTH-BRN', buying_cost: 160, selling_price: 390, stock_quantity: 45, low_stock_threshold: 5 },
  { name: 'Velvet Shawl (Maroon)', sku: 'SHW-VLV-MRN', buying_cost: 450, selling_price: 990, stock_quantity: 18, low_stock_threshold: 5 },
];

// ─── Products for Seller 2 (Gadget Planet) ───────────────────────────────────

const SELLER2_PRODUCTS = [
  { name: 'RGB Mechanical Keyboard', sku: 'GAD-KEY-RGB', buying_cost: 1200, selling_price: 2400, stock_quantity: 25, low_stock_threshold: 5 },
  { name: 'Wireless Gaming Mouse', sku: 'GAD-MOU-WLS', buying_cost: 450, selling_price: 950, stock_quantity: 40, low_stock_threshold: 8 },
  { name: 'USB-C Multiport Hub (7-in-1)', sku: 'GAD-HUB-7IN1', buying_cost: 850, selling_price: 1650, stock_quantity: 30, low_stock_threshold: 5 },
  { name: 'Aluminum Laptop Stand', sku: 'GAD-STD-ALU', buying_cost: 520, selling_price: 1150, stock_quantity: 35, low_stock_threshold: 5 },
  { name: 'Noise-Cancelling TWS Earbuds', sku: 'GAD-TWS-PRO', buying_cost: 650, selling_price: 1350, stock_quantity: 3, low_stock_threshold: 5 },
];

// ─── Customers for Seller 1 ───────────────────────────────────────────────────

const SELLER1_CUSTOMERS = [
  { name: 'Md. Rafiqul Islam', phone: '01711234561', district: 'Dhaka', risky: false },
  { name: 'Fatema Akter', phone: '01812345672', district: 'Chittagong', risky: false },
  { name: 'Shahinur Rahman', phone: '01913456783', district: 'Sylhet', risky: false },
  { name: 'Nasrin Sultana', phone: '01614567894', district: 'Rajshahi', risky: false },
  { name: 'Jahangir Alam', phone: '01715678905', district: 'Khulna', risky: false },
  { name: 'Rubina Begum', phone: '01516789016', district: 'Barishal', risky: false },
  { name: 'Tariqul Hasan', phone: '01717890127', district: 'Comilla', risky: false },
  { name: 'Monira Khatun', phone: '01818901238', district: 'Mymensingh', risky: false },
  { name: 'Abul Kashem', phone: '01919012349', district: 'Narayanganj', risky: false },
  { name: 'Sultana Parvin', phone: '01610123450', district: 'Gazipur', risky: false },
  { name: 'Kawsar Ahmed', phone: '01711230561', district: 'Bogura', risky: false },
  { name: 'Shimu Akter', phone: '01812340672', district: 'Rangpur', risky: false },
  { name: 'Rakibul Hasan', phone: '01913460783', district: 'Jessore', risky: true },
  { name: 'Nusrat Jahan', phone: '01614570894', district: 'Tangail', risky: true },
  { name: 'Farhan Hossain', phone: '01715680905', district: 'Noakhali', risky: true },
];

// ─── Customers for Seller 2 ───────────────────────────────────────────────────

const SELLER2_CUSTOMERS = [
  { name: 'Tanvir Hossain', phone: '01720000001', district: 'Dhaka', risky: false },
  { name: 'Sadia Chowdhury', phone: '01820000002', district: 'Chittagong', risky: false },
  { name: 'Imran Nazir', phone: '01920000003', district: 'Sylhet', risky: false },
  { name: 'Mehedi Hasan', phone: '01620000004', district: 'Khulna', risky: false },
  { name: 'Ayesha Siddiqua', phone: '01520000005', district: 'Rajshahi', risky: true },
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────

async function run() {
  let connection;
  let closeDb;

  if (DB_CLIENT === 'mysql') {
    const mysql = require('mysql2/promise');
    console.log('[seed:MySQL] Connecting to MySQL …');
    const connConfig = process.env.MYSQL_URL
      ? { uri: process.env.MYSQL_URL, charset: 'utf8mb4' }
      : {
          host: DB_HOST,
          port: parseInt(DB_PORT, 10),
          user: DB_USER,
          password: DB_PASSWORD || '',
          database: DB_NAME,
          charset: 'utf8mb4',
        };
    connection = await mysql.createConnection(connConfig);
    closeDb = () => connection.end();
  } else {
    const Database = require('better-sqlite3');
    const projectRoot = path.resolve(__dirname, '..');
    const rawFile = process.env.SQLITE_FILE || './database/sellerdesk.sqlite';
    const dbFile = path.isAbsolute(rawFile) ? rawFile : path.resolve(projectRoot, rawFile);
    console.log(`[seed:SQLite] Connecting to SQLite: ${dbFile}`);
    const sqlite = new Database(dbFile);
    try {
      sqlite.pragma('journal_mode = WAL');
    } catch (err) {
      console.warn(`[seed:SQLite] WAL mode not supported (${err.message}); falling back to DELETE mode.`);
      try {
        sqlite.pragma('journal_mode = DELETE');
      } catch (_) {}
    }
    sqlite.pragma('busy_timeout = 5000');

    connection = {
      query: async (sql, params = []) => {
        const query = sql.trim();
        if (/^SET FOREIGN_KEY_CHECKS\s*=\s*0/i.test(query)) {
          sqlite.pragma('foreign_keys = OFF');
          return [[]];
        }
        if (/^SET FOREIGN_KEY_CHECKS\s*=\s*1/i.test(query)) {
          sqlite.pragma('foreign_keys = ON');
          return [[]];
        }
        const truncMatch = query.match(/^TRUNCATE TABLE [`"']?(\w+)[`"']?/i);
        if (truncMatch) {
          const table = truncMatch[1];
          sqlite.prepare(`DELETE FROM "${table}"`).run();
          try {
            sqlite.prepare(`DELETE FROM sqlite_sequence WHERE name=?`).run(table);
          } catch (_) {}
          return [[]];
        }

        const isSelect = /^(SELECT|PRAGMA)/i.test(query);
        const bound = (params || []).map((v) =>
          typeof v === 'boolean' ? (v ? 1 : 0) : v === undefined ? null : v
        );
        const stmt = sqlite.prepare(query);
        if (isSelect) {
          const rows = stmt.all(...bound);
          return [rows];
        } else {
          const info = stmt.run(...bound);
          return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }];
        }
      },
    };
    closeDb = () => sqlite.close();
  }

  try {
    // ── 1. Clear existing demo data ──────────────────────────────────────────
    console.log('[seed] Disabling FK checks and truncating tables …');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'courier_settlements',
      'stock_movements',
      'order_status_history',
      'order_items',
      'orders',
      'customers',
      'product_variants',
      'products',
      'settings',
      'users',
      'sellers',
    ];
    for (const t of tables) {
      await connection.query(`TRUNCATE TABLE \`${t}\``);
      console.log(`[seed]   truncated ${t}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── 2. Create Tenants (Sellers) ──────────────────────────────────────────
    console.log('[seed] Inserting Sellers (Tenants) …');
    const [seller1Res] = await connection.query(
      `INSERT INTO sellers (name, slug, email, phone, is_active) VALUES (?, ?, ?, ?, 1)`,
      ['Fashion House BD', 'fashion-house', 'admin@demo.com', '01700000001']
    );
    const seller1Id = seller1Res.insertId;

    const [seller2Res] = await connection.query(
      `INSERT INTO sellers (name, slug, email, phone, is_active) VALUES (?, ?, ?, ?, 1)`,
      ['Gadget Planet', 'gadget-planet', 'seller2@demo.com', '01800000002']
    );
    const seller2Id = seller2Res.insertId;

    console.log(`[seed]   Seller 1: Fashion House BD (id=${seller1Id})`);
    console.log(`[seed]   Seller 2: Gadget Planet (id=${seller2Id})`);

    // ── 3. Users for Seller 1 and Seller 2 ───────────────────────────────────
    console.log('[seed] Inserting users …');
    const admin1Hash = await bcrypt.hash('Admin@123', 12);
    const staff1Hash = await bcrypt.hash('Staff@123', 12);
    const admin2Hash = await bcrypt.hash('Seller2@123', 12);
    const staff2Hash = await bcrypt.hash('Staff2@123', 12);

    const [u1] = await connection.query(
      `INSERT INTO users (seller_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'admin', 1)`,
      [seller1Id, 'Demo Admin', 'admin@demo.com', admin1Hash]
    );
    const [u2] = await connection.query(
      `INSERT INTO users (seller_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'staff', 1)`,
      [seller1Id, 'Demo Staff', 'staff@demo.com', staff1Hash]
    );

    const [u3] = await connection.query(
      `INSERT INTO users (seller_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'admin', 1)`,
      [seller2Id, 'Seller 2 Admin', 'seller2@demo.com', admin2Hash]
    );
    const [u4] = await connection.query(
      `INSERT INTO users (seller_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'staff', 1)`,
      [seller2Id, 'Seller 2 Staff', 'staff2@demo.com', staff2Hash]
    );

    const admin1Id = u1.insertId;
    const staff1Id = u2.insertId;
    const admin2Id = u3.insertId;
    const staff2Id = u4.insertId;

    console.log(`[seed]   Seller 1 Users: admin@demo.com (id=${admin1Id}), staff@demo.com (id=${staff1Id})`);
    console.log(`[seed]   Seller 2 Users: seller2@demo.com (id=${admin2Id}), staff2@demo.com (id=${staff2Id})`);

    // ── 4. Settings ──────────────────────────────────────────────────────────
    console.log('[seed] Inserting settings for Seller 1 & 2 …');
    const s1Settings = [
      ['business_name', 'Fashion House BD'],
      ['business_phone', '01700000001'],
      ['default_delivery_charge', '60'],
      ['low_stock_threshold', '5'],
      ['language', 'en'],
      ['currency', 'BDT'],
      ['timezone', 'Asia/Dhaka'],
    ];
    for (const [key, value] of s1Settings) {
      await connection.query('INSERT INTO settings (seller_id, `key`, `value`) VALUES (?, ?, ?)', [
        seller1Id,
        key,
        value,
      ]);
    }

    const s2Settings = [
      ['business_name', 'Gadget Planet'],
      ['business_phone', '01800000002'],
      ['default_delivery_charge', '80'],
      ['low_stock_threshold', '10'],
      ['language', 'en'],
      ['currency', 'BDT'],
      ['timezone', 'Asia/Dhaka'],
    ];
    for (const [key, value] of s2Settings) {
      await connection.query('INSERT INTO settings (seller_id, `key`, `value`) VALUES (?, ?, ?)', [
        seller2Id,
        key,
        value,
      ]);
    }

    // ── 5. Seed Seller 1 Products, Customers & Orders ────────────────────────
    console.log('[seed] Seeding Seller 1 Products …');
    const s1ProductIds = [];
    for (const p of SELLER1_PRODUCTS) {
      const category = p.sku.startsWith('CSM') ? 'Cosmetics' : p.sku.startsWith('GAD') ? 'Gadgets' : 'Fashion';
      const [res] = await connection.query(
        `INSERT INTO products (seller_id, name, sku, category, buying_cost, cost_price, selling_price, sale_price, stock_quantity, low_stock_threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [seller1Id, p.name, p.sku, category, p.buying_cost, p.buying_cost, p.selling_price, p.selling_price, p.stock_quantity, p.low_stock_threshold]
      );
      s1ProductIds.push(res.insertId);
    }

    console.log('[seed] Seeding Seller 1 Customers …');
    const s1CustomerIds = [];
    for (const c of SELLER1_CUSTOMERS) {
      const area = pick(AREAS[c.district]);
      const fullAddress = `${area}, ${c.district}`;
      const returnCount = c.risky ? rand(4, 8) : 0;

      const [res] = await connection.query(
        `INSERT INTO customers (seller_id, name, phone, district, area, full_address, address, return_count, is_risky)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [seller1Id, c.name, c.phone, c.district, area, fullAddress, fullAddress, returnCount, c.risky ? 1 : 0]
      );
      s1CustomerIds.push(res.insertId);
    }

    console.log('[seed] Seeding Seller 1 Orders (60 orders) …');
    const s1StatusDistribution = [
      ...Array(10).fill('new'),
      ...Array(10).fill('confirmed'),
      ...Array(10).fill('shipped'),
      ...Array(15).fill('delivered'),
      ...Array(8).fill('returned'),
      ...Array(7).fill('cancelled'),
    ];

    const s1CustomerTotals = {};
    s1CustomerIds.forEach((id) => {
      s1CustomerTotals[id] = { total_orders: 0, total_spent: 0, return_count: 0 };
    });

    let s1OrderSeq = 1;
    for (let i = 0; i < 60; i++) {
      const status = s1StatusDistribution[i];
      const customerId = pick(s1CustomerIds);
      const courier = pick(COURIERS);
      const paymentMethod = pick(PAYMENT_METHODS);
      const source = pick(SOURCES);
      const createdBy = i % 3 === 0 ? staff1Id : admin1Id;
      const daysBack = rand(1, 30);
      const createdAt = daysAgo(daysBack);
      const deliveryCharge = pick([60, 70, 80, 100, 120]);
      const discount = pick([0, 0, 0, 20, 30, 50]);
      const advanceAmount = paymentMethod === 'advance' ? pick([100, 200, 300]) : 0;
      const trackingId = ['shipped', 'delivered'].includes(status)
        ? `${courier.toUpperCase().slice(0, 3)}${rand(100000, 999999)}`
        : null;
      const note = pick([null, null, null, 'Please deliver fast', 'Handle with care', 'Call before delivery']);

      const itemCount = rand(1, 3);
      const orderItems = [];
      let itemsSubtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const pIdx = rand(0, s1ProductIds.length - 1);
        const product = SELLER1_PRODUCTS[pIdx];
        const qty = rand(1, 3);
        const unitPrice = product.selling_price;
        const buyingCost = product.buying_cost;
        itemsSubtotal += unitPrice * qty;
        orderItems.push({
          product_id: s1ProductIds[pIdx],
          product_name: product.name,
          quantity: qty,
          unit_price: unitPrice,
          buying_cost: buyingCost,
        });
      }

      const total = dec(itemsSubtotal + deliveryCharge - discount);
      const codAmount = dec(Math.max(0, itemsSubtotal + deliveryCharge - discount - advanceAmount));
      const codCollected = status === 'delivered' ? codAmount : 0;
      const codSettled = status === 'delivered' && rand(0, 1) === 1 ? 1 : 0;
      const codSettledAt = codSettled ? dt(daysAgo(rand(0, daysBack - 1))) : null;
      const codReceived = codSettled ? codAmount : 0;

      const orderNum = orderNumber('SD', s1OrderSeq++);
      const [orderRes] = await connection.query(
        `INSERT INTO orders
         (seller_id, order_number, customer_id, status, courier, tracking_id,
          subtotal, delivery_charge, discount, total, payment_method, advance_amount,
          source, note, cod_amount, cod_collected, cod_settled,
          cod_settled_at, cod_received, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          seller1Id,
          orderNum,
          customerId,
          status,
          courier,
          trackingId,
          dec(itemsSubtotal),
          deliveryCharge,
          discount,
          total,
          paymentMethod,
          advanceAmount,
          source,
          note,
          codAmount,
          codCollected,
          codSettled,
          codSettledAt,
          codReceived,
          createdBy,
          dt(createdAt),
          dt(createdAt),
        ]
      );
      const orderId = orderRes.insertId;

      for (const item of orderItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, buying_cost, cost_price)
           VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.buying_cost, item.buying_cost]
        );
      }

      const historySteps = buildHistorySteps(status, createdAt);
      for (const step of historySteps) {
        await connection.query(
          `INSERT INTO order_status_history (order_id, status, changed_by, note, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, step.status, createdBy, step.note, dt(step.at)]
        );
      }

      if (['confirmed', 'shipped', 'delivered'].includes(status)) {
        for (const item of orderItems) {
          await connection.query(
            `INSERT INTO stock_movements (seller_id, product_id, variant_id, type, quantity, reason, order_id, created_by, created_at)
             VALUES (?, ?, NULL, 'deducted', ?, ?, ?, ?, ?)`,
            [seller1Id, item.product_id, item.quantity, `Order ${orderNum} confirmed`, orderId, createdBy, dt(createdAt)]
          );
        }
      }
      if (status === 'returned') {
        for (const item of orderItems) {
          await connection.query(
            `INSERT INTO stock_movements (seller_id, product_id, variant_id, type, quantity, reason, order_id, created_by, created_at)
             VALUES (?, ?, NULL, 'returned', ?, ?, ?, ?, ?)`,
            [seller1Id, item.product_id, item.quantity, `Returned from order ${orderNum}`, orderId, createdBy, dt(createdAt)]
          );
        }
      }

      const ct = s1CustomerTotals[customerId];
      ct.total_orders += 1;
      if (['delivered'].includes(status)) {
        ct.total_spent += codAmount;
      }
      if (status === 'returned') {
        ct.return_count += 1;
      }
    }

    for (const [cid, totals] of Object.entries(s1CustomerTotals)) {
      await connection.query(
        `UPDATE customers
         SET total_orders = ?,
             total_spent  = ?,
             return_count = return_count + ?,
             is_risky     = CASE WHEN return_count + ? >= 3 THEN 1 ELSE is_risky END
         WHERE id = ? AND seller_id = ?`,
        [totals.total_orders, dec(totals.total_spent), totals.return_count, totals.return_count, parseInt(cid, 10), seller1Id]
      );
    }

    // Initial stock restock for Seller 1
    for (let idx = 0; idx < s1ProductIds.length; idx++) {
      const qty = SELLER1_PRODUCTS[idx].stock_quantity + rand(10, 50);
      await connection.query(
        `INSERT INTO stock_movements (seller_id, product_id, variant_id, type, quantity, reason, order_id, created_by, created_at)
         VALUES (?, ?, NULL, 'restock', ?, 'Initial stock load', NULL, ?, ?)`,
        [seller1Id, s1ProductIds[idx], qty, admin1Id, dt(daysAgo(31))]
      );
    }

    // Courier settlement for Seller 1
    await connection.query(
      `INSERT INTO courier_settlements (seller_id, courier, settled_orders, total_amount, settled_at, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        seller1Id,
        'Pathao',
        JSON.stringify([orderNumber('SD', 1), orderNumber('SD', 5), orderNumber('SD', 12)]),
        dec(3 * 650 + 3 * 60),
        dt(daysAgo(5)),
        'Batch settlement for delivered orders',
        admin1Id,
      ]
    );

    // ── 6. Seed Seller 2 Products, Customers & Orders ────────────────────────
    console.log('[seed] Seeding Seller 2 (Gadget Planet) Products, Customers & Orders …');
    const s2ProductIds = [];
    for (const p of SELLER2_PRODUCTS) {
      const [res] = await connection.query(
        `INSERT INTO products (seller_id, name, sku, category, buying_cost, cost_price, selling_price, sale_price, stock_quantity, low_stock_threshold)
         VALUES (?, ?, ?, 'Gadgets', ?, ?, ?, ?, ?, ?)`,
        [seller2Id, p.name, p.sku, p.buying_cost, p.buying_cost, p.selling_price, p.selling_price, p.stock_quantity, p.low_stock_threshold]
      );
      s2ProductIds.push(res.insertId);
    }

    const s2CustomerIds = [];
    for (const c of SELLER2_CUSTOMERS) {
      const area = pick(AREAS[c.district]);
      const fullAddress = `${area}, ${c.district}`;
      const [res] = await connection.query(
        `INSERT INTO customers (seller_id, name, phone, district, area, full_address, address, return_count, is_risky)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [seller2Id, c.name, c.phone, c.district, area, fullAddress, fullAddress, c.risky ? 1 : 0]
      );
      s2CustomerIds.push(res.insertId);
    }

    // 10 sample orders for Seller 2
    let s2OrderSeq = 1;
    for (let i = 0; i < 10; i++) {
      const status = i < 4 ? 'delivered' : i < 7 ? 'shipped' : 'new';
      const customerId = pick(s2CustomerIds);
      const courier = 'Steadfast';
      const pIdx = rand(0, s2ProductIds.length - 1);
      const product = SELLER2_PRODUCTS[pIdx];
      const qty = 1;
      const total = product.selling_price + 80;
      const orderNum = orderNumber('GP', s2OrderSeq++);

      const [orderRes] = await connection.query(
        `INSERT INTO orders
         (seller_id, order_number, customer_id, status, courier, tracking_id,
          subtotal, delivery_charge, discount, total, payment_method, advance_amount,
          source, note, cod_amount, cod_collected, cod_settled, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 80, 0, ?, 'cod', 0, 'facebook', 'Gadget delivery', ?, ?, 0, ?, ?, ?)`,
        [
          seller2Id,
          orderNum,
          customerId,
          status,
          courier,
          `STD${rand(100000, 999999)}`,
          product.selling_price,
          total,
          total,
          status === 'delivered' ? total : 0,
          admin2Id,
          dt(daysAgo(i + 1)),
          dt(daysAgo(i + 1)),
        ]
      );
      const orderId = orderRes.insertId;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, buying_cost, cost_price)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
        [orderId, s2ProductIds[pIdx], product.name, qty, product.selling_price, product.buying_cost, product.buying_cost]
      );

      await connection.query(
        `INSERT INTO order_status_history (order_id, status, changed_by, note, created_at)
         VALUES (?, ?, ?, 'Seeded history', ?)`,
        [orderId, status, admin2Id, dt(daysAgo(i + 1))]
      );
    }

    console.log('\n[seed] ✅ Multi-tenant Seeding complete!');
    console.log('[seed]    Tenant 1 (Fashion House BD):');
    console.log('[seed]      Admin: admin@demo.com   / Admin@123');
    console.log('[seed]      Staff: staff@demo.com   / Staff@123');
    console.log('[seed]    Tenant 2 (Gadget Planet):');
    console.log('[seed]      Admin: seller2@demo.com / Seller2@123');
    console.log('[seed]      Staff: staff2@demo.com  / Staff2@123');
  } finally {
    if (closeDb) await closeDb();
  }
}

function buildHistorySteps(finalStatus, createdAt) {
  const steps = [];
  const flow = statusFlow(finalStatus);

  let cursor = new Date(createdAt);
  for (const s of flow) {
    steps.push({ status: s, note: null, at: new Date(cursor) });
    cursor = new Date(cursor.getTime() + rand(6, 36) * 60 * 60 * 1000);
  }
  return steps;
}

function statusFlow(finalStatus) {
  const pipeline = ['new', 'confirmed', 'shipped', 'delivered'];
  const idx = pipeline.indexOf(finalStatus);
  if (idx >= 0) return pipeline.slice(0, idx + 1);
  if (finalStatus === 'returned') return ['new', 'confirmed', 'shipped', 'returned'];
  if (finalStatus === 'cancelled') return ['new', 'cancelled'];
  return ['new'];
}

if (require.main === module) {
  run().catch((err) => {
    console.error('\n[seed] ❌ Fatal error:', err.stack || err);
    if (err.code) console.error('[seed] Error Code:', err.code);
    process.exit(1);
  });
}

module.exports = {
  runSeed: run,
};
