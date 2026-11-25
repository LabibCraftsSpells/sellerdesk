-- ============================================================
-- SellerDesk Database Schema for SQLite (Multi-Tenant Architecture)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- sellers (Tenants)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  email         TEXT    DEFAULT NULL,
  phone         TEXT    DEFAULT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug);

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id     INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'staff' CHECK(role IN ('admin','staff')),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_seller ON users(seller_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------
-- settings (Key-value store per seller)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id  INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  key        TEXT    NOT NULL,
  value      TEXT,
  updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (seller_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_seller ON settings(seller_id);

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id           INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name                TEXT    NOT NULL,
  sku                 TEXT    NOT NULL,
  category            TEXT,
  photo_url           TEXT,
  image_url           TEXT,
  description         TEXT,
  unit                TEXT    DEFAULT 'pcs',
  buying_cost         REAL    NOT NULL DEFAULT 0.00,
  cost_price          REAL    NOT NULL DEFAULT 0.00,
  selling_price       REAL    NOT NULL DEFAULT 0.00,
  sale_price          REAL    NOT NULL DEFAULT 0.00,
  stock_quantity      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active           INTEGER NOT NULL DEFAULT 1,
  deleted_at          TEXT    DEFAULT NULL,
  created_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (seller_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- ------------------------------------------------------------
-- product_variants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  sku            TEXT,
  sku_suffix     TEXT,
  sale_price     REAL    NOT NULL DEFAULT 0.00,
  cost_price     REAL    NOT NULL DEFAULT 0.00,
  extra_cost     REAL    NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pv_product_id ON product_variants(product_id);

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id    INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  phone        TEXT    NOT NULL,
  district     TEXT,
  area         TEXT,
  full_address TEXT,
  address      TEXT,
  notes        TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent  REAL    NOT NULL DEFAULT 0.00,
  return_count INTEGER NOT NULL DEFAULT 0,
  is_risky     INTEGER NOT NULL DEFAULT 0,
  deleted_at   TEXT    DEFAULT NULL,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (seller_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_seller ON customers(seller_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id       INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  order_number    TEXT    NOT NULL,
  customer_id     INTEGER NOT NULL REFERENCES customers(id),
  status          TEXT    NOT NULL DEFAULT 'new' CHECK(status IN ('new','confirmed','shipped','delivered','returned','cancelled')),
  courier         TEXT,
  tracking_id     TEXT,
  subtotal        REAL    NOT NULL DEFAULT 0.00,
  delivery_charge REAL    NOT NULL DEFAULT 0.00,
  shipping_cost   REAL    NOT NULL DEFAULT 0.00,
  discount        REAL    NOT NULL DEFAULT 0.00,
  total           REAL    NOT NULL DEFAULT 0.00,
  payment_method  TEXT    NOT NULL DEFAULT 'cod' CHECK(payment_method IN ('cod','bkash','nagad','bank','advance')),
  advance_amount  REAL    NOT NULL DEFAULT 0.00,
  advance_payment REAL    NOT NULL DEFAULT 0.00,
  source          TEXT    NOT NULL DEFAULT 'facebook' CHECK(source IN ('facebook','instagram','whatsapp','other')),
  note            TEXT,
  cod_amount      REAL    NOT NULL DEFAULT 0.00,
  cod_collected   REAL    NOT NULL DEFAULT 0.00,
  cod_settled     INTEGER NOT NULL DEFAULT 0,
  cod_settled_at  TEXT    DEFAULT NULL,
  cod_received    REAL    NOT NULL DEFAULT 0.00,
  created_by      INTEGER NOT NULL REFERENCES users(id),
  deleted_at      TEXT    DEFAULT NULL,
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (seller_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ------------------------------------------------------------
-- order_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id),
  variant_id   INTEGER REFERENCES product_variants(id),
  product_name TEXT    NOT NULL,
  variant_name TEXT,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit_price   REAL    NOT NULL,
  buying_cost  REAL    NOT NULL DEFAULT 0.00,
  cost_price   REAL    NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_oi_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_product_id ON order_items(product_id);

-- ------------------------------------------------------------
-- order_status_history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  note       TEXT,
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_osh_order_id ON order_status_history(order_id);

-- ------------------------------------------------------------
-- stock_movements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id  INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  type       TEXT    NOT NULL CHECK(type IN ('restock','deducted','returned','damaged','correction')),
  quantity   INTEGER NOT NULL,
  reason     TEXT,
  order_id   INTEGER REFERENCES orders(id),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sm_seller ON stock_movements(seller_id);
CREATE INDEX IF NOT EXISTS idx_sm_product_id ON stock_movements(product_id);

-- ------------------------------------------------------------
-- courier_settlements
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courier_settlements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id      INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  courier        TEXT    NOT NULL,
  settled_orders TEXT    DEFAULT NULL,
  total_amount   REAL    NOT NULL DEFAULT 0.00,
  settled_at     TEXT    NOT NULL,
  notes          TEXT,
  created_by     INTEGER NOT NULL REFERENCES users(id),
  created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cs_seller ON courier_settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_cs_courier ON courier_settlements(courier);
