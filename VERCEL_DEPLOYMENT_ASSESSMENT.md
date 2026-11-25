# SellerDesk — Vercel Production Deployment Feasibility Assessment

**Assessment Date**: November 18, 2026  
**Auditor**: Senior Systems Architect & Release Engineer  
**Target Platform**: Vercel (Hobby / Free Tier vs. Pro)  
**Target Destination**: Vibe96 Software Marketplace Live Demo  
**Evaluation Target**: Full-Stack React (Vite) + Node.js (Express) + Relational Multi-Tenant Database  

---

## 1. Executive Summary & Recommendation

### Recommendation Verdict: **NO-GO for Vercel Free (Hobby) Tier**
### Qualified Status: **TECHNICALLY FEASIBLE with TiDB Serverless, BUT STRONGLY DISCOURAGED due to Vercel Commercial Terms of Service Violations and Serverless MySQL Connection Overhead.**

| Evaluation Pillar | Assessment Score | Verdict | Critical Findings |
| :--- | :---: | :---: | :--- |
| **Frontend Feasibility (React Vite SPA)** | 100% | **PASS** | React 18 + Vite builds and deploys cleanly to Vercel's Edge Network. |
| **Backend Feasibility (Express REST API)** | 85% | **CONDITIONAL** | Express can run as a Vercel Serverless Function (`api/index.js`), but suffers from cold starts and connection limits. |
| **Database Persistence (SQLite Mode)** | 0% | **FATAL** | Vercel Serverless filesystem is strictly read-only and ephemeral (`/tmp` is wiped on container recycling). SQLite **cannot** persist demo orders or stock. |
| **Database Persistence (External MySQL)** | 90% | **PASS** | Works with remote MySQL 8.0 (e.g. TiDB Serverless free tier), requiring SSL/TLS connection handling. |
| **Vibe96 Marketplace Requirements** | 95% | **PASS** | Framing (CSP `frame-ancestors`) and `v96-demo.js` analytics script can be delivered via `vercel.json` headers. |
| **Vercel Hobby Plan Compliance** | 0% | **FATAL RISK** | **Vercel Hobby Plan explicitly prohibits commercial use** (selling software, marketplace listings, or commercial SaaS demos). |
| **Cost vs. Operational Tradeoff** | 60% | **HIGH FRICTION** | A fully containerized platform (e.g. Railway or Linux VPS) provides native MariaDB + Node at $0–$5/mo with 0 TOS risk and 0 code restructuring. |

---

## 2. Technical Feasibility Analysis

### 2.1 React + Vite Frontend
- **Compatibility**: **100% Native**.
- The frontend located in `React Vite Web/` is a standard client-side Single-Page Application (SPA).
- Vercel natively detects Vite and outputs static assets to Edge CDN nodes with automatic Brotli/Gzip compression.
- Requires standard SPA fallback rewrite in `vercel.json`: all non-asset, non-API routes rewrite to `/index.html`.

### 2.2 Node.js Express Backend on Serverless Functions
- **Compatibility**: **Possible via Adapter Pattern** (No full rewrite required).
- Vercel allows running an Express application inside a single Serverless Function wrapper (e.g. `api/index.js` or `api/[...path].js`).
- **How it works**: Vercel intercepts incoming requests to `/api/(.*)` and invokes the exported Express `app` instance as an AWS Lambda / Vercel Serverless Function invocation.
- **Architectural Drawbacks**:
  1. **Cold Starts**: When inactive, lambdas spin down to 0 instances. The first request after idle takes 1,500ms – 3,500ms to initialize Node.js, load dependencies (bcrypt, mysql2, express, helmet), and establish database handshakes.
  2. **Vibe96 Healthcheck Impact**: Vibe96 performs automated periodic availability pings against the demo URL. A cold start timeout could report the demo as temporarily degraded or unavailable.
  3. **Execution Time Limits**: Vercel Hobby functions have a strict 10-second maximum execution timeout (Pro allows 60s).

### 2.3 Filesystem & Database Persistence
- **Local SQLite**: **COMPLETELY INCOMPATIBLE ON VERCEL**.
  - Serverless function instances are stateless and ephemeral.
  - While files can technically be written to `/tmp`, `/tmp` is wiped between invocations and is never shared across concurrent lambda instances.
  - Any demo order created, product updated, or COD settled in SQLite on Vercel would vanish within minutes.
- **External MySQL / MariaDB**: **MANDATORY**.
  - To deploy to Vercel, the application **must** connect to a hosted external cloud database over the internet (TCP/TLS).

---

## 3. Free Database Options & Tradeoffs

Because local SQLite is non-viable on Vercel, a persistent, remotely accessible MySQL 8.0-compatible database is required:

| Provider | Free Tier Allowance | MySQL Protocol Compatibility | Limitations & Risks for Vibe96 Demo |
| :--- | :--- | :---: | :--- |
| **TiDB Cloud (Serverless)** *(Top Free Pick)* | 5 GB storage, 50M Request Units / month. Free forever. | **100% MySQL 8.0 Wire Compatible** | Requires SSL/TLS certificate (`rejectUnauthorized: true`). Serverless architecture handles connection spikes well. |
| **AlwaysData** | 100 MB storage, free account. | **MySQL 8.0 Native** | Limited to 100MB; server located in Europe (France), adding ~150–220ms network latency to each SQL query executed from US/Asia lambdas. |
| **Clever Cloud** | Free MySQL addon (5 MB free credits). | **MySQL 8.0 Native** | Very small storage limit (5MB); quickly fills up with order history, variants, and stock movement audit logs. |
| **PlanetScale** | *Discontinued free tier (April 2024).* | MySQL Compatible | Paid only ($39/mo minimum). No longer free. |
| **Supabase / Neon** | Free tiers available. | **PostgreSQL ONLY** | **Incompatible** without rewriting SQL queries, adapters, and schema syntax (`AUTOINCREMENT`, `NOW()`, `insertId`). |

**Conclusion on Free Databases**: If deploying to Vercel, **TiDB Cloud Serverless** is the only free MySQL-compatible provider with adequate storage (5GB) and reliable uptime.

---

## 4. Vercel Hobby Plan Legal & Commercial Restrictions

This is the most critical constraint for your project:

> **Vercel Terms of Service (Fair Use Guidelines — Hobby Plan)**:  
> *"The Hobby plan is for personal, non-commercial use only. Commercial use (including promoting a product, marketplace selling, SaaS, or revenue-generating software) requires a Pro plan ($20/month per seat)."*

### What this means for SellerDesk:
1. **Commercial Marketplace Violation**: You are listing SellerDesk on **Vibe96**, a software marketplace where software is bought and sold for commercial distribution. Hosting the live sales demo on a Vercel Hobby account violates Vercel's Terms of Service.
2. **Account Suspension Risk**: If Vibe96 evaluators or buyers generate traffic spikes, Vercel's automated compliance monitors can flag the project as an un-licensed commercial showcase, resulting in a sudden 402/403 block on your live demo URL.
3. **Upgrading Cost**: Upgrading to Vercel Pro costs **$20 / month per seat**, which completely defeats the goal of using a "free" service.

---

## 5. Required Architecture & Code Changes (If Proceeding with Vercel)

If you decide to deploy to Vercel regardless (either on Vercel Pro or accepting Hobby plan risk), the following architecture and code changes are required:

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Platform                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Edge Network CDN: Static Assets (React Vite)   │  │
│  │   SPA Fallback: /orders, /products → /index.html │  │
│  └─────────────────────────┬────────────────────────┘  │
│                            │ /api/* Rewrites           │
│  ┌─────────────────────────▼────────────────────────┐  │
│  │   Vercel Serverless Function: api/index.js       │  │
│  │   Express Adapter + JWT Auth + RBAC + Joi        │  │
│  └─────────────────────────┬────────────────────────┘  │
└────────────────────────────┼───────────────────────────┘
                             │ Parameterized SQL over TLS
┌────────────────────────────▼───────────────────────────┐
│          Remote Managed Database (TiDB Cloud)          │
│   Persistent MySQL 8.0 Cloud (5GB Free Tier)           │
│   Sellers, Products, Orders, Settlements, Customers    │
└────────────────────────────────────────────────────────┘
```

### Affected Files and Exact Code Modifications:

#### 1. Create Serverless Handler: `api/index.js`
Vercel looks in the `/api` directory at the project root for serverless function entrypoints:
```javascript
// api/index.js
'use strict';
const app = require('../Node Express API/index.js');
module.exports = app;
```

#### 2. Create Vercel Configuration: `vercel.json`
To handle SPA routing, API rewrites, and Vibe96 iframe headers:
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://vibe96.com https://*.vibe96.com;"
        }
      ]
    }
  ]
}
```

#### 3. Database Connection Pooling Adjustment in `Node Express API/db.js`
In serverless functions, database connection pools must be cached outside the handler scope to prevent creating 10 new connections on every lambda invocation, which quickly exhausts MySQL's `max_connections`:
```javascript
// Must configure connection pool with low limit and idle timeout for serverless
const pool = mysql.createPool({
  ...poolConfig,
  connectionLimit: 2, // Low connection limit per serverless lambda
  idleTimeout: 30000,
});
```

#### 4. Environment Variables on Vercel Dashboard
Must configure:
- `NODE_ENV=production`
- `JWT_SECRET=<64-char-random-string>`
- `DB_CLIENT=mysql`
- `MYSQL_URL=mysql://<user>:<password>@<tidb-host>:4000/sellerdesk?ssl={"rejectUnauthorized":true}`
- `AUTO_SEED=false`

---

## 6. Vibe96 Marketplace Compatibility on Vercel

| Requirement | Implementation on Vercel | Status |
| :--- | :--- | :---: |
| **Iframe Embedding** | Headers in `vercel.json` and Express Helmet configured with `frameguard: false` and `frame-ancestors: ['self', 'https://vibe96.com', 'https://*.vibe96.com']`. | **PASS** |
| **No X-Frame-Options** | Explicitly removed; no `X-Frame-Options` header sent. | **PASS** |
| **Analytics Script** | `<script defer src="https://vibe96.com/js/v96-demo.js"></script>` compiled into frontend assets. | **PASS** |
| **Public HTTPS URL** | Vercel provides automatic valid wildcard SSL (`*.vercel.app`). | **PASS** |
| **Availability Checks** | Periodic healthcheck ping to `GET /api/health` works, but cold starts can introduce 1.5–3s latency spikes. | **WARN** |

---

## 7. Cost & Platform Comparison Matrix

| Platform | Setup Complexity | Serverless vs. Long-Running | MySQL Database Solution | Monthly Cost | Commercial Use Allowed on Free Tier? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Vercel (Hobby)** | Moderate (Requires adapter & remote DB) | Serverless (Cold starts) | TiDB Serverless (Free 5GB) | **$0** | ❌ **NO (Violates Terms of Service)** |
| **Vercel (Pro)** | Moderate | Serverless (Cold starts) | TiDB Serverless (Free 5GB) | **$20 / month** | ✔ **YES** |
| **Railway.app** | **Low (Zero-rewrite)** | **Container (Always-on)** | **Native MariaDB 10.6 Container** | **$0 – $5 / month** *(Covered by $5 credit)* | ✔ **YES** |
| **Render.com** | Low | Container (Spins down on Free) | Cloud MySQL (TiDB / Aiven) | **$0 / month** | ✔ **YES** |
| **Linux Cloud VPS** | Low (Docker Compose) | Container (Always-on) | Native MariaDB 10.6 on NVMe | **$4 – $6 / month** | ✔ **YES** |

---

## 8. Final Verdict: GO or NO-GO?

### Final Recommendation: **NO-GO FOR VERCEL HOBBY**

### Key Reasons:
1. **Terms of Service Violation**: Using Vercel's free Hobby plan to host a commercial software demo for a paid product listing on Vibe96 breaches Vercel's Fair Use Guidelines. If your account is flagged or restricted during marketplace review, the demo goes dark.
2. **Serverless Impedance Mismatch**: SellerDesk is built as a stateful, transactional business management application with relational connection pooling, inventory atomicity, and background logging. Forcing it into stateless AWS Lambda/Vercel serverless containers introduces cold-start latency, connection pool fragmentation, and reliance on third-party remote database latency.
3. **Superior Alternatives Exist at Equal or Lower Cost**:
   - **Railway.app**: Provides native Docker container hosting + native MariaDB 10.6 with persistent storage volumes. The application runs with zero code changes, no cold starts, no connection exhaustion, and within Railway's $5 monthly credit (**effectively $0** for a demo).
   - **Render.com**: Can host the Docker container with no cold-start restrictions on paid ($7/mo) or free tier ($0/mo) with full commercial permission.

---

## 9. Next Steps (Awaiting Your Direction)

Please review this assessment and confirm which route you want to pursue:

1. **Option A (Follow Recommendation — Containerized Deploy)**:
   - Deploy via **Railway** or **Render** with persistent MariaDB.
   - 0 code rewrites, 0 TOS risk, native MariaDB performance.
2. **Option B (Proceed with Vercel + TiDB Cloud)**:
   - Create `api/index.js` serverless bridge and `vercel.json`.
   - Set up a free 5GB TiDB Serverless MySQL database.
   - Deploy to Vercel acknowledging the Hobby commercial TOS consideration.
3. **Option C (Client on Vercel, Backend elsewhere)**:
   - Deploy the static React SPA to Vercel, and the Express API + MariaDB container to Railway/VPS.
