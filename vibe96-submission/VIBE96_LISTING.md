# Vibe96 Marketplace Listing — SellerDesk

---

## 1. Product Title & Short Tagline

- **Product Title**: SellerDesk — Order, Inventory & COD Manager for Social Commerce
- **Short Tagline**: Complete, self-hosted order pipeline, automated stock control, and courier COD settlement system for Facebook, Instagram, and WhatsApp sellers.

---

## 2. Product Description

**SellerDesk** is a modern, responsive, commercial-grade web application built specifically for online sellers running social commerce stores on Facebook, Instagram, TikTok, and WhatsApp. Designed with a mobile-first philosophy, SellerDesk eliminates the chaos of spreadsheets, lost cash-on-delivery (COD) disbursements, and inventory overselling.

With zero-configuration SQLite support out of the box, buyers can clone, install, and run SellerDesk in under 60 seconds without installing external database servers or Docker. For growing businesses, it seamlessly switches to MySQL/MariaDB with a single environment flag.

Equipped with bilingual English and Bengali (বাংলা) support, 64-district Bangladesh address datasets, multi-payment reconciliation (COD, bKash, Nagad, Bank, Advance), automatic stock reservation on order confirmation, printable A4 invoices with courier slips, and financial net-profit reporting, SellerDesk is ready to be deployed as a business backbone or resold as a packaged SaaS product.

---

## 3. Target Audience

- **Social Commerce Merchants**: Sellers operating on Facebook Pages, Facebook Groups, Instagram Direct, and WhatsApp Business.
- **D2C E-Commerce Brands**: Boutique apparel, electronics, cosmetics, and lifestyle brands managing their own fulfillment.
- **Freelance Agencies & Developers**: Web agencies delivering custom operational portals to regional merchants.
- **SaaS Entrepreneurs**: Software sellers seeking a battle-tested, clean codebase to launch a vertical commerce CRM.

---

## 4. Key Features

### 🛍️ Quick Order Entry (Mobile-First)
- **High-Velocity Input**: Large touch targets (≥ 38px) designed for one-handed operation on mobile devices.
- **Returning Customer Auto-Fill**: Instant lookup by phone number automatically populates customer name and delivery address.
- **BD Phone Validation**: Regex validation for Bangladeshi 11-digit mobile numbers (`01XXXXXXXXX`).
- **Duplicate Prevention Warning**: Real-time warning alert if an order was placed by the same phone number recently.
- **Multi-Item Support**: Add multiple products with variants, custom pricing, delivery charges, and discounts.

### 📦 Order Lifecycle Pipeline
- **Visual Status Management**: Track orders through `New` → `Confirmed` → `Shipped` → `Delivered` → `Returned` → `Cancelled`.
- **Courier Integration Fields**: Track parcel status across Pathao, Steadfast, RedX, Paperfly, and custom couriers with tracking IDs.
- **Batch Operations**: Bulk update order statuses with a single click.
- **Audit History**: Complete timeline history tracking every status change and the team member responsible.
- **Printable Invoices & Slips**: A4 print-ready invoice layout with customer information, item breakdown, and courier dispatch slip.

### 📊 Real-Time Inventory & Stock Audit
- **Automatic Stock Reservation**: Inventory is automatically deducted the moment an order is `Confirmed`.
- **Return & Cancel Restorations**: Cancelled or returned orders automatically refund stock units to inventory.
- **Low-Stock Alerting**: Configurable low-stock thresholds with real-time dashboard notifications.
- **Immutable Movement Logs**: Every stock adjustment records the audit reason (`restock`, `damaged`, `correction`, `order deduction`).

### 💰 Cash-on-Delivery (COD) Tracker & Reconciliation
- **Reconciliation Engine**: Track outstanding COD balances pending delivery vs. settled payments.
- **Courier Batch Settlement**: Reconcile disbursements received from couriers against delivered order IDs, tracking courier COD fees and net payout.
- **Payment Method Coverage**: Full support for COD, bKash, Nagad, Bank Transfer, and Advance Deposits.

### 📈 Financial Profit & Analytics
- **Executive Sales Dashboard**: 7-day revenue and volume bar charts, delivery success rate KPIs, and pending COD totals.
- **Net Profit Analysis**: Real-time profit calculation tracking `Gross Revenue - (Cost of Goods Sold + Delivery Expenses)`.
- **Role Isolation**: Profit metrics and margins are strictly hidden from staff accounts.

---

## 5. Technical Specifications

- **Frontend**: React 18.3.1, React Router v6.27.0, Tailwind CSS v3.4.14, `@tanstack/react-query` v5, React Hook Form v7, Recharts v2.13.3, Lucide React icons, `i18next` (English + বাংলা).
- **Backend**: Node.js 18+ / 20+ LTS, Express 4.18.2, Helmet security headers, CORS origin whitelist, `express-rate-limit`, Joi validation.
- **Database**: Dual-driver architecture supporting **SQLite** (via `better-sqlite3` v13, WAL mode) and **MySQL / MariaDB** (via `mysql2`).
- **Authentication**: Stateless JWT (`HS256`, 7-day expiration), `bcryptjs` password hashing (12 salt rounds), login rate limiting.
- **PWA Ready**: Web App Manifest and Service Worker registration bundled for mobile home-screen installation.

---

## 6. Screens & Database Tables

### Screens Count: `12 Functional Pages`
1. **Login & Role Selector** (`/login`)
2. **Sales Analytics Dashboard** (`/dashboard`)
3. **Orders Pipeline & List** (`/orders`)
4. **Quick Order Entry Form** (`/orders/new`)
5. **Order Details & Timeline** (`/orders/:id`)
6. **Order Edit Screen** (`/orders/:id/edit`)
7. **Printable Invoice & Courier Slip** (`/invoice/:id`)
8. **Products Catalog & Stock** (`/products`)
9. **Stock Adjustment & Movement Log** (`/products/:id/stock`)
10. **Customer Management Directory** (`/customers`)
11. **COD Tracker & Courier Settlement** (`/cod`)
12. **Financial Profit Report** (`/reports/profit`)
13. **Store Settings & User Management** (`/settings`)

### Database Tables: `10 Relational Tables`
1. `users`
2. `settings`
3. `products`
4. `product_variants`
5. `stock_movements`
6. `customers`
7. `orders`
8. `order_items`
9. `order_status_history`
10. `courier_settlements`

---

## 7. Server Requirements & Hosting Cost Estimates

| Tier | Server Specifications | Recommended Host | Estimated Monthly Cost | Target Volume |
| :--- | :--- | :--- | :--- | :--- |
| **Starter / Local** | 1 vCPU, 1 GB RAM, SQLite | Any Basic VPS (DigitalOcean, Linode, Hetzner) | **$4.00 – $6.00 / month** | Up to 3,000 orders/mo |
| **Growing Business** | 2 vCPU, 2 GB RAM, SQLite/MySQL | Hetzner Cloud / DigitalOcean Droplet | **$10.00 – $15.00 / month** | 3,000 – 25,000 orders/mo |
| **Enterprise / Multi-Store** | 2 vCPU, 4 GB RAM, Managed MySQL | Managed Cloud (AWS Lightsail, DigitalOcean) | **$20.00 – $35.00 / month** | 25,000+ orders/mo |

---

## 8. Installation & Deployment Options

- **Clean Machine Quickstart**:
  ```bash
  npm install
  npm run setup
  npm run dev
  ```
- **Deployment Strategy 1 (VPS)**: Ubuntu 22.04 / 24.04 with systemd service and Nginx reverse proxy + SSL.
- **Deployment Strategy 2 (Docker)**: Multi-stage `Dockerfile` and `docker-compose.yml` included in repository.

---

## 9. Demo Credentials (For Testing)

- **Admin Account**: `admin@demo.com` / `Admin@123` (Full system access, profit analytics, store settings).
- **Staff Account**: `staff@demo.com` / `Staff@123` (Operational access: orders, stock, customers, COD).

---

## 10. Known Limitations & Scope Boundaries

1. **Simulated Courier Webhooks**: Courier providers (Pathao, Steadfast, RedX) include status and tracking ID fields; live webhook callbacks require merchant API keys from each respective courier.
2. **Thermal Printers**: Printable invoices and slips are styled for standard A4 and thermal formats via browser print; direct raw ESC/POS network printing is not included.

---

## 11. Support & Commercial Terms

- **Source Code**: 100% full, un-obfuscated JavaScript / React source code.
- **License**: Commercial use, self-hosting, and client deployment permitted.
- **Updates**: Bug fixes and documentation improvements included.

---

## 12. Suggested Marketplace Pricing

- **Suggested Price**: **$39.00 – $49.00 USD (One-Time Purchase)**
- **Pricing Rationale**:
  - Delivers complete full-stack functionality (React 18 + Node Express + Dual SQLite/MySQL support).
  - Out-of-the-box local setup takes less than 60 seconds with zero database installation required.
  - Positioned competitively against general SaaS tools that charge $20–$50 *per month* for basic order tracking.
  - Offers high ROI for freelancers and web agencies looking to deploy turnkey operational portals for retail clients.
