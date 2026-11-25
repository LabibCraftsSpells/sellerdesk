# SellerDesk — Developer & AI Agent Architecture Guide (AGENTS.md)

This technical reference provides an architectural blueprint of SellerDesk for software engineers, code reviewers, and autonomous AI agents modifying, auditing, or maintaining the repository.

---

## 1. Project Overview & Architectural Topology

SellerDesk is an order, inventory, and cash-on-delivery (COD) management web platform designed for social commerce sellers (Facebook, WhatsApp, Instagram). It is implemented as a client-server architecture:

```
┌────────────────────────────────────────────────────────┐
│               Client Single-Page App                   │
│  React 18 + Vite + Tailwind CSS + TanStack Query v5    │
│  State: React Context (AuthContext, SettingsContext)   │
│  Routing: React Router v6 with Role Route Guards       │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP/REST JSON (JWT in Header)
┌──────────────────────────▼─────────────────────────────┐
│                 Node.js / Express API                   │
│  Security: Helmet, CORS Whitelist, express-rate-limit  │
│  Validation: Joi Schemas for all mutating endpoints    │
│  Auth: Stateless JWT (HS256) + bcryptjs (Cost 12)      │
└──────────────────────────┬─────────────────────────────┘
                           │ Parameterized SQL Queries
┌──────────────────────────▼─────────────────────────────┐
│                 Unified Database Layer                  │
│  Dual Driver: SQLite (better-sqlite3) | MySQL (mysql2) │
│  WAL Mode, Foreign Key Cascades, Atomic Transactions   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Module Responsibilities

```
sellerdesk/
├── client/                      # Frontend Single-Page Application
│   ├── index.html               # HTML entry point with PWA meta & favicon
│   ├── vite.config.js           # Vite config with manual chunk splitting & dev proxy
│   ├── tailwind.config.js       # Tailwind CSS theme & typography configuration
│   └── src/
│       ├── api/                 # Axios HTTP client & domain API services
│       ├── components/          # Reusable UI primitives (Layout, Sidebar, Topbar, BottomNav, etc.)
│       ├── constants/           # District datasets (64 Bangladesh districts) & couriers
│       ├── contexts/            # Global React state (AuthContext, SettingsContext)
│       ├── hooks/               # Custom hooks (useAuth, useSettings, useDebounce)
│       ├── i18n/                # Localization catalogs (en.json, bn.json) & init
│       ├── pages/               # Routed page modules
│       │   ├── auth/            # Login & authentication views
│       │   ├── cod/             # COD tracker & courier settlement
│       │   ├── customers/       # Customer directory & order history
│       │   ├── invoice/         # Printable A4 invoice & courier parcel slip
│       │   ├── orders/          # Pipeline, quick order entry, order details
│       │   ├── products/        # Catalog, stock adjustment, product creation
│       │   ├── profile/         # Password change & user profile
│       │   ├── reports/         # Dashboard analytics & profit report
│       │   └── settings/        # Store settings & team user administration
│       └── utils/               # Currency formatting (BDT ৳), date helpers
├── database/                    # Database Migrations & Seeds
│   ├── migrate.js               # Cross-database schema migration runner
│   ├── schema.sql               # MySQL/MariaDB DDL schema
│   ├── schema.sqlite.sql        # SQLite DDL schema with WAL & index optimizations
│   ├── seed.js                  # Realistic demo data seeder
│   └── sellerdesk.sqlite        # SQLite runtime database file (gitignored)
├── server/                      # Backend REST API Server
│   ├── index.js                 # Express application bootstrapping & middleware
│   ├── db.js                    # Dual-database abstraction adapter
│   ├── controllers/             # Request handlers & domain business logic
│   ├── middleware/              # Auth, requireAdmin, Joi validation, error handler
│   ├── routes/                  # Express route definitions
│   └── utils/                   # Token signing, response formatters
├── scripts/                     # Operational & Testing Automation
│   ├── setup.js                 # Zero-friction clean installation wizard
│   ├── test-api.js              # Integration test suite (Supertest in-memory)
│   ├── e2e-runner.js            # End-to-end browser automation suite (Puppeteer CDP)
│   └── capture-marketplace-screenshots.js # 1920x1080 automated screenshot capture
├── vibe96-submission/          # Official marketplace submission release package
├── package.json                 # Root script orchestrator & dev dependencies
├── Dockerfile                   # Multi-stage production container build
└── docker-compose.yml           # Multi-service production orchestration
```

---

## 3. Database Schema & Relational Model

The database comprises 10 relational tables linked via foreign keys:

1. **`users`**: Administrative and operational accounts (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, timestamps).
2. **`settings`**: Key-value shop metadata (`business_name`, `business_phone`, `currency`, `default_delivery_charge`, `default_courier`, `language`).
3. **`products`**: Product catalog (`id`, `name`, `sku`, `category`, `sale_price`, `cost_price`, `stock_quantity`, `low_stock_threshold`, `unit`, `is_active`).
4. **`product_variants`**: Size/color variants linked to products (`product_id`, `name`, `sku`, `sale_price`, `cost_price`, `stock_quantity`).
5. **`stock_movements`**: Immutable inventory audit log (`product_id`, `variant_id`, `quantity`, `type`, `reason`, `reference_id`, `created_by`, `created_at`).
6. **`customers`**: Customer profiles (`id`, `name`, `phone`, `district`, `area`, `address`, `total_orders`, `total_spent`, `is_risky`).
7. **`orders`**: Orders master table (`id`, `order_number`, `customer_id`, `status`, `payment_method`, `subtotal`, `delivery_charge`, `discount`, `advance_amount`, `total`, `cod_amount`, `courier`, `tracking_id`, `cod_settled`, `deleted_at`).
8. **`order_items`**: Order line items (`order_id`, `product_id`, `product_name`, `variant_name`, `quantity`, `unit_price`, `buying_cost`, `total_price`).
9. **`order_status_history`**: Audit trail of status changes (`order_id`, `old_status`, `new_status`, `changed_by`, `note`, `created_at`).
10. **`courier_settlements`**: Courier disbursement records (`courier`, `amount_collected`, `cod_fee`, `net_received`, `settled_at`, `notes`).

---

## 4. Business Logic & Invariants

### 4.1 Order Status Lifecycle & Inventory Control
- **`new`**: Newly placed order. Stock is NOT yet deducted.
- **`confirmed`**: Order verified by seller. Automatically triggers stock deduction from `products` or `product_variants` and writes a `stock_movements` record of type `deducted`.
- **`shipped`**: Parcel dispatched to courier (Pathao, Steadfast, RedX, Paperfly).
- **`delivered`**: Customer received parcel. Eligible for COD settlement if payment was COD.
- **`returned`**: Parcel returned by customer. Automatically restores stock quantity and logs a `returned` stock movement.
- **`cancelled`**: Order cancelled. If previously confirmed or shipped, reserved stock is automatically refunded back to inventory.

### 4.2 Financial & COD Calculation Rules
- $\text{Grand Total} = \max(0, \text{Subtotal} + \text{Delivery Charge} - \text{Discount})$
- If `payment_method === 'cod'`: $\text{COD Amount} = \max(0, \text{Grand Total} - \text{Advance Amount})$
- If `payment_method !== 'cod'`: $\text{COD Amount} = 0$
- **Profit Calculation**:
  $$\text{Net Profit} = \sum (\text{Delivered Item Unit Price} - \text{Delivered Item Buying Cost}) - \text{Delivery Loss/Returns Expense}$$

---

## 5. Security & Role-Based Access Control (RBAC)

### 5.1 Roles
- **`admin`**: Full system permissions. Can delete orders, create/edit/delete products, modify shop settings, create/delete users, and inspect profit margins.
- **`staff`**: Operational staff. Can view and advance orders in pipeline, take new orders, view catalog products, look up customers, and track COD.
  - **Denied**: Access to `/reports/profit`, `POST /api/products`, `PUT /api/settings`, `/api/auth/users`, and `DELETE /api/orders/:id`.

### 5.2 API Middleware Implementation
- `auth`: Decodes JWT from `Authorization: Bearer <token>`, validates expiration, attaches user object to `req.user`.
- `requireAdmin`: Rejects request with HTTP 403 Forbidden if `req.user.role !== 'admin'`.
- `errorHandler`: Global catch-all handler. In production, masks 500 error messages to prevent database credential or schema leakage.

---

## 6. Development & Build Commands

```bash
# Start both client and server concurrently
npm run dev

# Start server only (runs on port 5001)
npm run dev:server

# Start client only (runs on port 5173 with proxy to 5001)
npm run dev:client

# Execute backend in-memory Supertest integration suite
npm test

# Execute Google Chrome headless E2E automation suite
node scripts/e2e-runner.js

# Build production client bundle into client/dist
npm run build

# Start production server
npm start
```
