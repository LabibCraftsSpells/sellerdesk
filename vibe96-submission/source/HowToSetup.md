# SellerDesk — Clean-Machine Setup & Installation Guide

This guide walks through setting up **SellerDesk** on a completely clean development or staging machine without any pre-existing databases or complex configuration.

---

## 1. Prerequisites

Before starting, ensure your system meets the following minimum requirements:

- **Node.js**: Version `18.18.0` or higher (`20.x LTS` recommended).
  Verify with: `node -v`
- **npm**: Version `9.x` or `10.x`.
  Verify with: `npm -v`
- **Git**: Installed and available on your system path.
- **Supported Operating Systems**: macOS (Apple Silicon / Intel), Ubuntu / Debian / Linux, Windows 10/11 (PowerShell or WSL2).
- **Database**:
  - **Zero-Config Local Development (Default)**: SQLite (Pre-bundled via `better-sqlite3`). **No database installation or Docker required.**
  - **Production Database**: MySQL 8.0+ or MariaDB 10.5+.

---

## 2. Fast 3-Step Quickstart (Zero Configuration)

SellerDesk is designed for frictionless setup. Follow these three steps:

### Step 1: Install Root Tooling & Concurrency Dependencies
```bash
git clone <your-repository-url> sellerdesk
cd sellerdesk
npm install
```

### Step 2: Run the Automated Setup Wizard
```bash
npm run setup
```

**What this automated step does:**
1. Detects whether a `.env` file exists. If missing, it automatically copies `Node Express API/.env.example` to `.env` pre-configured for zero-config SQLite mode.
2. Installs server dependencies in `./Node Express API`.
3. Installs client dependencies in `./React Vite Web`.
4. Executes database migrations (`database/migrate.js`), creating all 11 multi-tenant relational tables and foreign key constraints.
5. Populates the database with demo accounts, settings, catalog products, customers, and orders across multiple independent merchant tenants.

### Step 3: Start the Application in Development Mode
```bash
npm run dev
```

Both services will start concurrently:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001` (Port 5001 is used to avoid conflicts with macOS AirPlay Receiver)

---

## 3. Demo Credentials

The database is seeded with multi-tenant merchant accounts:

### Tenant 1 — Fashion House BD
| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@demo.com` | `Admin@123` | Full system access, team user management, financial profit reports, shop settings, delete operations. |
| **Staff Member** | `staff@demo.com` | `Staff@123` | Operational access to orders pipeline, quick order entry, products catalog, customer directory, COD tracker. Restricted from profit reports, user accounts, and shop settings. |

### Tenant 2 — Gadget Planet (Tenant Isolation Verification)
| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `seller2@demo.com` | `Seller2@123` | Completely isolated merchant workspace with separate products, customers, and orders. |
| **Staff Member** | `staff2@demo.com` | `Staff2@123` | Operational staff for Tenant 2. |

*Quick Fill:* The login screen includes 1-click **Admin Demo** and **Staff Demo** shortcut buttons to automatically fill credentials.

---

## 4. Manual / Step-by-Step Setup (Alternative)

If you prefer to perform each setup step manually instead of running `npm run setup`:

### Step 1: Configure Environment
Copy the environment template:
```bash
cp "Node Express API/.env.example" .env
```

### Step 2: Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd "Node Express API" && npm install && cd ..

# Frontend dependencies
cd "React Vite Web" && npm install && cd ..
```

### Step 3: Run Database Migrations
```bash
npm run migrate
```
Creates all 11 tables in `./database/sellerdesk.sqlite`.

### Step 4: Seed Demo Data
```bash
npm run seed
```

### Step 5: Start Development Servers
```bash
npm run dev
```

---

## 5. Switching to MySQL / MariaDB (Optional)

To use MySQL or MariaDB instead of SQLite:

1. Create a MySQL database and user:
   ```sql
   CREATE DATABASE sellerdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'sellerdesk'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON sellerdesk.* TO 'sellerdesk'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Update `.env`:
   ```ini
   DB_CLIENT=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=sellerdesk
   DB_PASSWORD=your_password
   DB_NAME=sellerdesk
   ```

3. Run migrations and seed:
   ```bash
   npm run migrate
   npm run seed
   # or import raw SQL: mysql -u sellerdesk -p sellerdesk < database/seed.sql
   ```

---

## 6. Docker Deployment

To launch MariaDB and the SellerDesk application via Docker:

```bash
docker compose up -d --build
```

Access the application at `http://localhost:5001`.
Persistent volumes ensure your database and uploaded assets are preserved.

---

## 7. Verification & Self-Test

Verify your installation by running the automated integration test suite:

```bash
npm test
```

This verifies healthcheck endpoints, role-based access control, transaction atomicity, stock deduction/restoration, and cross-seller tenant isolation.
