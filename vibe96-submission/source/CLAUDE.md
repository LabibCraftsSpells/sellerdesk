# SellerDesk — Architecture & Agent Reference (CLAUDE.md)

This technical guide provides system topology and development references for SellerDesk.

---

## 1. System Topology

- **Frontend Client**: React 18 SPA built with Vite, Tailwind CSS, TanStack Query v5, and Lucide React. Located in `React Vite Web/` (symlinked as `client`).
- **REST Backend**: Node.js Express server running on port 5001 with Helmet, JWT auth, and Joi validation. Located in `Node Express API/` (symlinked as `server`).
- **Database Layer**: Dual-mode data abstraction in `Node Express API/db.js` supporting SQLite (`better-sqlite3`) for local development and MariaDB / MySQL 8.0+ (`mysql2/promise`) for production.
- **Tenant Model**: Strict multi-tenant isolation where all operational tables contain `seller_id` foreign keys and all SQL queries filter by `req.user.seller_id`.

---

## 2. Key Commands

```bash
# Clean zero-configuration installation
npm run setup

# Run client & server concurrently
npm run dev

# Run integration tests
npm test

# Run browser E2E test runner
node scripts/e2e-runner.js

# Build production frontend bundle
npm run build

# Start production server
npm start
```

---

## 3. Directory Layout

- `Node Express API/`: Backend Express server source code, controllers, routes, middleware, and `.env.example`.
- `React Vite Web/`: Single-page application React frontend, components, pages, contexts, and assets.
- `database/`: Cross-database migration scripts (`schema.sql`, `schema.sqlite.sql`, `migrate.js`, `seed.js`, `seed.sql`).
- `scripts/`: Operational automation, setup wizard, integration test runner, and browser E2E tests.

---

## 4. Multi-Tenant Invariants

1. Every write operation must assign `seller_id = req.user.seller_id`.
2. Every read operation must include `seller_id = ?` in its WHERE clause.
3. Order lookups, product modifications, and customer queries must never cross tenant boundaries.
4. Admins have access to profit calculations and user management within their own tenant only.
5. Staff accounts have operational pipeline access without profit visibility or settings mutation permissions.
