# Changelog

All notable changes to the SellerDesk platform are documented in this file.

## [1.0.0] - 2026-11-18

### Initial Marketplace Release (Vibe96 Compliance)

#### Architecture & Multi-Tenancy
- **Tenant Isolation**: Introduced first-class multi-tenancy model supporting independent merchants (`sellers` table).
- **Tenant Scoping**: All relational entities (`products`, `product_variants`, `customers`, `orders`, `stock_movements`, `courier_settlements`, `settings`, `users`) are strictly scoped by `seller_id`.
- **Query Protection**: Implemented tenant isolation across all backend controller queries, mutations, aggregations, and CSV exports.
- **Cross-Tenant Validation**: Added automated verification preventing cross-seller unauthorized read, update, or delete operations.

#### Database Architecture
- **Dual Database Drivers**: Native support for SQLite (WAL mode, zero-configuration local development) and MySQL / MariaDB (InnoDB, utf8mb4 production).
- **Database Migrations**: Cross-database migration runner in `database/migrate.js`.
- **Comprehensive Seed Data**: Included automated seeder (`database/seed.js`) and raw SQL seed script (`database/seed.sql`) generating realistic Bangladeshi merchant demo accounts.

#### Security & Access Control
- **Stateless JWT**: Secure token generation embedding user identity and verified `seller_id`.
- **RBAC**: Enforced Admin and Staff role segregation across all routes and API endpoints.
- **Rate Limiting & Helmet**: Hardened HTTP security headers and endpoint request limiting.

#### Operations & Testing
- **E2E Automation**: Browser test suite with Puppeteer verifying full operational flows for Admin and Staff.
- **Integration Test Suite**: 15 in-memory supertest integration tests covering authentication, CRUD, stock lifecycle, COD settlement, and multi-tenant isolation.
- **Clean Installation Wizard**: Interactive setup script (`npm run setup`) automating dependency installation, migrations, and seeding.
- **Docker Deployment**: Multi-stage production `Dockerfile` and `docker-compose.yml` orchestrating MariaDB and the SellerDesk application.
