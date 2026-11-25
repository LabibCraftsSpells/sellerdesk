# SellerDesk — Comprehensive QA Test Report (TEST_REPORT.md)

**Target Application:** SellerDesk  
**Environment:** Node.js v20+, Express API (`http://localhost:5001`), React 18 SPA (`http://localhost:5173`)  
**Database:** SQLite (WAL Mode) & MySQL Dual Adapter  
**Audit Date:** November 18, 2026  
**Overall Status:** **41/41 E2E Tests Passed (100%)** | **14/14 API Integration Tests Passed (100%)**

---

## 1. Summary of Test Execution

| Suite | Category | Command / Harness | Total Tests | Passed | Failed | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **API Integration** | Backend Endpoints & RBAC | `node scripts/test-api.js` | 14 | 14 | 0 | **PASS** |
| **E2E Automation (Phase 1)** | Admin Workflows & Orders | `node scripts/e2e-runner.js` | 24 | 24 | 0 | **PASS** |
| **E2E Automation (Phase 2)** | Staff RBAC & Guarding | `node scripts/e2e-runner.js` | 13 | 13 | 0 | **PASS** |
| **E2E Automation (Phase 3)** | Responsive Mobile & i18n | `node scripts/e2e-runner.js` | 4 | 4 | 0 | **PASS** |
| **Total** | | | **55** | **55** | **0** | **100% PASS** |

---

## 2. API Integration Test Suite Details (`scripts/test-api.js`)

| # | Test Name | What it Checks | Command / Method | Actual Result | Status | Log / Evidence |
| :-: | :--- | :--- | :--- | :--- | :-: | :--- |
| 1 | **Health Check** | API liveness and timestamp | `GET /api/health` | HTTP 200 `{ status: 'ok' }` | **PASS** | `test-api.js#L30` |
| 2 | **Admin Authentication** | Admin credential verification and JWT issuance | `POST /api/auth/login` | HTTP 200, JWT token returned | **PASS** | `test-api.js#L36` |
| 3 | **Staff Authentication** | Staff credential verification and JWT issuance | `POST /api/auth/login` | HTTP 200, JWT token returned | **PASS** | `test-api.js#L46` |
| 4 | **Role Authorization & RBAC** | Staff blocked from user creation with 403 | `POST /api/auth/users` with Staff JWT | HTTP 403 Forbidden | **PASS** | `test-api.js#L56` |
| 5 | **Products Retrieval** | Authenticated retrieval of catalog items | `GET /api/products` | HTTP 200, returned 20 products | **PASS** | `test-api.js#L68` |
| 6 | **Stock Adjustment** | Manual adjustment writes to stock movement log | `POST /api/stock/adjust` | Stock quantity updated, movement recorded | **PASS** | `test-api.js#L81` |
| 7 | **Order Creation** | Order placement with multiple items & customer | `POST /api/orders` | HTTP 201, Order number generated | **PASS** | `test-api.js#L98` |
| 8 | **Order Confirmation (Deduction)** | Confirming order automatically deducts stock | `PUT /api/orders/:id` (status: confirmed) | Stock deducted from 50 to 48 | **PASS** | `test-api.js#L125` |
| 9 | **Order Return (Restoration)** | Returning order automatically restores stock | `PUT /api/orders/:id` (status: returned) | Stock restored from 48 to 50 | **PASS** | `test-api.js#L143` |
| 10 | **COD Summary & Tracker** | Reconciles pending vs collected COD totals | `GET /api/cod/summary` | Pending and collected totals matched | **PASS** | `test-api.js#L158` |
| 11 | **Customer Lookup by Phone** | Auto-lookup returns customer profile & recent order | `GET /api/customers/lookup?phone=...` | Returning customer detected | **PASS** | `test-api.js#L170` |
| 12 | **Settings Management** | Updating shop name and invoice preferences | `PUT /api/settings` | Settings persisted and re-queried | **PASS** | `test-api.js#L187` |
| 13 | **7-Day Live Trend Metrics** | Dashboard chart aggregation by date | `GET /api/reports/dashboard` | 7-day revenue array computed | **PASS** | `test-api.js#L201` |
| 14 | **Password Change Verification** | Verifies current password before updating | `PUT /api/auth/change-password` | Verified with `current_password` | **PASS** | `test-api.js#L215` |

---

## 3. End-to-End Browser Automation Suite (`scripts/e2e-runner.js`)

### Phase 1 — Administrator Operations & Pipeline
| # | Test Name | Expected Result | Actual Result | Status | Screenshot Evidence |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 1 | Admin Login & Dashboard | Lands on `/dashboard` with valid session | Successfully redirected to `/dashboard` | **PASS** | `02-admin-dashboard.png` |
| 2 | Dashboard KPI Cards | All 4 KPI summary cards present | Today's Orders, Revenue, Rate, COD present | **PASS** | `02-admin-dashboard.png` |
| 3-10 | Navigation (8 Modules) | Navigation to all 8 sidebar modules | All 8 routes loaded with HTTP 200 | **PASS** | `03-` through `10-*.png` |
| 11 | Product Creation | Creates product with SKU and stock | Created SKU `QA-508372` with 25 units | **PASS** | `11-product-created.png` |
| 12 | Product Search | Created product searchable in catalog | Product returned in search results | **PASS** | `04-admin-products.png` |
| 13 | Order: COD Method | Creates Cash on Delivery order | Order #65 recorded, COD balance active | **PASS** | `12-order-created-cod.png` |
| 14 | Order: bKash Method | Creates order with bKash advance deposit | Order #66 recorded, advance deducted | **PASS** | `12-order-created-bkash.png` |
| 15 | Order: Nagad Method | Creates order with Nagad advance deposit | Order #67 recorded, advance deducted | **PASS** | `12-order-created-nagad.png` |
| 16 | Order: 100% Advance | Creates prepaid order | Order #68 recorded, COD set to ৳0 | **PASS** | `12-order-created-advance.png` |
| 17 | Order Status: Confirmed | Stock deducted automatically | Status updated to Confirmed; stock deducted | **PASS** | `14-order-status-confirmed.png` |
| 18 | Order Status: Shipped | Parcel dispatched state | Status transitioned to Shipped | **PASS** | `13-order-detail-page.png` |
| 19 | Order Status: Delivered | Parcel delivered state | Status transitioned to Delivered | **PASS** | `15-order-status-delivered.png` |
| 20 | Order Status: Returned | Stock restored automatically | Status transitioned to Returned; stock refunded | **PASS** | `16-order-status-returned.png` |
| 21 | Print Invoice & Slip | Printable A4 layout with parcel slip | Formatted invoice with barcode/slip | **PASS** | `17-invoice-print-layout.png` |
| 22 | COD Tracking Module | Breakdown of courier disbursements | Pending COD amounts listed | **PASS** | `18-cod-tracker-screen.png` |
| 23 | Profit Calculations Page | Real-time Gross Revenue and Net Margin | Revenue, Cost, and Profit rendered | **PASS** | `19-admin-profit-report.png` |
| 24 | Settings Persistence | Shop details and courier saved to DB | Settings saved and re-read from DB | **PASS** | `20-admin-settings-saved.png` |

### Phase 2 — Staff RBAC & Privilege Enforcement
| # | Test Name | Expected Result | Actual Result | Status | Screenshot Evidence |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 25 | Staff Login & Dashboard | Staff accesses dashboard without admin error | Successfully landed on `/dashboard` | **PASS** | `21-staff-dashboard.png` |
| 26-30 | Operational Access | Orders, New Order, Products, Customers, COD | All 5 operational routes accessible | **PASS** | Verified in console |
| 31 | Guard: `/reports` | Staff blocked from Reports overview | Blocked & redirected to `/dashboard` | **PASS** | `22-staff-blocked-reports-page.png` |
| 32 | Guard: `/reports/profit` | Staff blocked from Profit Report | Blocked & redirected to `/dashboard` | **PASS** | `22-staff-blocked-profit-report.png` |
| 33 | Guard: `/settings` | Staff blocked from Shop Settings | Blocked & redirected to `/dashboard` | **PASS** | `22-staff-blocked-settings-page.png` |
| 34 | Guard: `/products/new` | Staff blocked from Product Creation | Blocked & redirected to `/dashboard` | **PASS** | `22-staff-blocked-product-creation-page.png` |
| 35 | API RBAC: `/api/reports/profit` | Backend rejects direct Staff API query | Returns HTTP 403 Forbidden | **PASS** | DevTools console verified |
| 36 | API RBAC: `PUT /api/settings` | Backend rejects direct Staff store mutation | Returns HTTP 403 Forbidden | **PASS** | DevTools console verified |
| 37 | API RBAC: `/api/auth/users` | Backend rejects direct Staff user management | Returns HTTP 403 Forbidden | **PASS** | DevTools console verified |

### Phase 3 — UI, Responsive 390px Viewport & Localization
| # | Test Name | Expected Result | Actual Result | Status | Screenshot Evidence |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 38 | Mobile Bottom Navigation | Persistent bottom nav rendered at 390px | `<nav aria-label="Mobile Navigation">` active | **PASS** | `23-mobile-dashboard-390px.png` |
| 39 | Big Touch Targets | Inputs have touch height ≥ 34px | All inputs, selects, textareas ≥ 38px | **PASS** | `24-mobile-order-entry-390px.png` |
| 40 | Responsive Order List | Mobile card layout without horizontal overflow | Clean responsive card rendering | **PASS** | `25-mobile-orders-pipeline-390px.png` |
| 41 | Bangla i18n Toggle | Toggling language updates UI to Bengali | All labels updated (`ড্যাশবোর্ড`, `অর্ডার`, `পণ্য`) | **PASS** | `26-mobile-bangla-i18n.png` |
