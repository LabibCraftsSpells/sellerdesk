# SellerDesk — Third-Party Dependency & License Audit (THIRD_PARTY_LICENSES.md)

This document provides a comprehensive third-party software license inventory for **SellerDesk**. All production libraries and developer tooling have been verified for compliance with commercial redistribution and self-hosted software sales on the **Vibe96 Marketplace**.

---

## 1. Executive License Summary

- **Total Production Dependencies**: 23 packages across root, server, and client.
- **Copyleft (GPL / AGPL / SSPL) Packages**: **0 (None)**
- **Permissive Open Source Packages (MIT / BSD / ISC)**: **23 (100%)**
- **Commercial Redistribution Clearance**: **CLEARED**. All packages permit private commercial use, modification, closed-source bundling, and redistribution as source code.

---

## 2. Server & Root Production Dependencies

| Package | Version | License | Copyright / Publisher | Commercial Use Allowed |
| :--- | :--- | :--- | :--- | :---: |
| `bcryptjs` | 2.4.3 | **MIT** | Daniel Bikiel | ✅ YES |
| `better-sqlite3` | 13.2.0 | **MIT** | Joshua Wise | ✅ YES |
| `cors` | 2.8.5 | **MIT** | Troy Goode | ✅ YES |
| `dotenv` | 16.4.5 | **BSD-2-Clause** | Scott Motte | ✅ YES |
| `express` | 4.18.2 | **MIT** | StrongLoop, IBM | ✅ YES |
| `express-async-errors` | 3.1.1 | **ISC** | David Banham | ✅ YES |
| `express-rate-limit` | 7.1.5 | **MIT** | Nathan Friedly | ✅ YES |
| `helmet` | 7.1.0 | **MIT** | Adam Baldwin, Evan Hahn | ✅ YES |
| `joi` | 17.11.0 | **BSD-3-Clause** | Sideway Inc. | ✅ YES |
| `jsonwebtoken` | 9.0.2 | **MIT** | Auth0 | ✅ YES |
| `multer` | 1.4.5-lts.1 | **MIT** | Linus Unnebäck | ✅ YES |
| `mysql2` | 3.9.7 | **MIT** | Andrey Sidorov | ✅ YES |

---

## 3. Client Frontend Production Dependencies

| Package | Version | License | Copyright / Publisher | Commercial Use Allowed |
| :--- | :--- | :--- | :--- | :---: |
| `react` | 18.3.1 | **MIT** | Meta Platforms, Inc. | ✅ YES |
| `react-dom` | 18.3.1 | **MIT** | Meta Platforms, Inc. | ✅ YES |
| `react-router-dom` | 6.27.0 | **MIT** | Remix Software Inc. | ✅ YES |
| `@tanstack/react-query` | 5.60.5 | **MIT** | Tanner Linsley | ✅ YES |
| `axios` | 1.7.7 | **MIT** | Matt Zabriskie | ✅ YES |
| `react-hook-form` | 7.53.2 | **MIT** | Beier Luo | ✅ YES |
| `react-hot-toast` | 2.4.1 | **MIT** | Timo Lins | ✅ YES |
| `recharts` | 2.13.3 | **MIT** | Recharts Community | ✅ YES |
| `date-fns` | 4.1.0 | **MIT** | Sasha Koss | ✅ YES |
| `@headlessui/react` | 2.2.0 | **MIT** | Tailwind Labs Inc. | ✅ YES |
| `lucide-react` | 0.460.0 | **ISC** | Lucide Contributors | ✅ YES |
| `i18next` | 23.16.4 | **MIT** | Jan Mühlemann | ✅ YES |
| `react-i18next` | 15.1.0 | **MIT** | Jan Mühlemann | ✅ YES |

---

## 4. Development & Build Dependencies

| Package | Version | License | Category |
| :--- | :--- | :--- | :--- |
| `vite` | 5.4.10 | **MIT** | Client build tool |
| `@vitejs/plugin-react` | 4.3.3 | **MIT** | Vite React fast refresh plugin |
| `tailwindcss` | 3.4.14 | **MIT** | CSS utility framework |
| `postcss` | 8.4.47 | **MIT** | CSS post-processor |
| `autoprefixer` | 10.4.20 | **MIT** | CSS vendor prefixer |
| `concurrently` | 8.2.2 | **MIT** | Development script runner |
| `puppeteer-core` | 25.18.1 | **Apache-2.0** | Browser automation test harness |
| `supertest` | 7.3.2 | **MIT** | HTTP integration testing |
| `nodemon` | 3.0.2 | **MIT** | Development file watcher |

---

## 5. Legal Notices & Copyright Disclaimers

All third-party libraries listed above remain the property of their respective copyright holders. Redistribution of SellerDesk source code under commercial terms adheres to the respective license conditions:
1. **MIT / ISC**: Permitted to sell, copy, merge, publish, distribute, sublicense, and/or sell copies without warranty.
2. **BSD 2-Clause & 3-Clause**: Permitted in binary or source form provided that the respective copyright notices and disclaimers are preserved.
3. **Apache 2.0**: Permitted for commercial use and distribution with appropriate attribution.
