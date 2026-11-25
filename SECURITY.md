# SellerDesk — Security Policy & Configuration Guide (SECURITY.md)

SellerDesk is engineered with defense-in-depth principles across its frontend, API, authentication, and database tiers. This document details the security posture, configuration rules, and guidelines for production deployments.

---

## 1. Security Architecture & Defense In Depth

### 1.1 Authentication & Password Storage
- **Password Hashing**: User passwords are encrypted using `bcryptjs` with **12 salt rounds**. Passwords are never logged or stored in plaintext.
- **Session Tokens**: Authentication uses stateless **JSON Web Tokens (JWT)** signed via HMAC-SHA256 (`HS256`).
- **Token Expiration**: Tokens expire after 7 days (`JWT_EXPIRES_IN=7d`). When expired, client interceptors clear stored tokens and redirect to `/login`.
- **Brute-Force Rate Limiting**: The login endpoint (`POST /api/auth/login`) is throttled via `express-rate-limit`:
  - Production mode: Maximum 10 failed login attempts per 15-minute window per IP.
  - Exceeding the threshold returns HTTP 429 Too Many Requests.

### 1.2 Authorization & Access Control (RBAC)
- All mutating endpoints enforce strict role verification:
  - **Admin**: Full read, write, update, and delete access across all resources.
  - **Staff**: Operational access restricted to orders, inventory viewing, customer lookups, and COD tracking.
- Staff accounts are strictly forbidden from:
  - Accessing profit reports (`GET /api/reports/profit` returns HTTP 403).
  - Mutating store settings (`PUT /api/settings` returns HTTP 403).
  - Creating, updating, or deleting user accounts (`/api/auth/users/*` returns HTTP 403).
  - Creating or deleting catalog products (`POST /api/products`, `DELETE /api/products/:id` return HTTP 403).
  - Deleting orders (`DELETE /api/orders/:id` returns HTTP 403).
- Frontend route guards (`<AdminRoute>`) redirect unauthorized users directly to `/dashboard`.

### 1.3 Database Security & Parameterized Queries
- **Zero SQL Injection**: 100% of dynamic queries use parameterized prepared statements (`?` placeholders). Dynamic user values are never concatenated directly into SQL strings.
- **Foreign Keys**: Enforced at the engine level (`PRAGMA foreign_keys = ON;` in SQLite, foreign key constraints in MySQL).
- **Transaction Safety**: All multi-step order updates and stock deduction operations execute within atomic transactions (`BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`).

### 1.4 Network & HTTP Security
- **Helmet Headers**: Integrated into Express to set standard HTTP security headers:
  - Content Security Policy (CSP)
  - X-DNS-Prefetch-Control
  - X-Frame-Options (`SAMEORIGIN`)
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options (`nosniff`)
- **CORS Protection**: Access is restricted strictly to origins specified in `CORS_ORIGIN`. Wildcard (`*`) CORS is not used.
- **Error Masking**: In production mode (`NODE_ENV=production`), server 500 error messages are sanitized to `'An unexpected internal server error occurred'`, suppressing internal database diagnostics and stack traces.

---

## 2. Mandatory Production Environment Configuration

When moving from local development to production, the following environment variables **MUST** be set:

```ini
# MUST be set to production
NODE_ENV=production

# MUST be replaced with a strong, random 64-character secret
# Command: openssl rand -base64 32
JWT_SECRET=YOUR_UNIQUE_RANDOM_SECRET_KEY

# Set to your exact production public domain
CORS_ORIGIN=https://app.yourstore.com
```

> ⚠️ **CRITICAL WARNING**:
> The default development JWT secret `your_super_secret_jwt_key_change_this_in_production` must NEVER be used in a live production environment. The server includes startup validation to log a prominent security warning if this key is detected in production.

---

## 3. Demo Account & Public Demo Safety

The seed script creates two demo accounts:
- `admin@demo.com` (`Admin@123`)
- `staff@demo.com` (`Staff@123`)

For a **public live demonstration**:
1. Change demo passwords or restrict live demo accounts to sandboxed environments.
2. In production, change the default administrator email and password immediately after initial deployment.
3. Deactivate any unused demo accounts through the **Settings > Team** panel.

---

## 4. Reporting Security Vulnerabilities

If you discover a security vulnerability in SellerDesk, please report it privately to the repository maintainer or marketplace support. Do not open public GitHub issues for security vulnerabilities.
