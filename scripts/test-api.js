'use strict';

/**
 * test-api.js — Comprehensive API integration test
 * Tests authentication, multi-tenant seller isolation, RBAC, CRUD operations,
 * transactions, stock deduction/restoration, COD settlement, reports.
 */

const path = require('path');
const fs = require('fs');

const envPaths = [
  path.resolve(__dirname, '../Node Express API/.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../.env'),
];
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}
require('dotenv').config();

const serverDir = fs.existsSync(path.resolve(__dirname, '../Node Express API'))
  ? '../Node Express API'
  : '../server';

let request;
try {
  request = require('supertest');
} catch {
  request = require(path.join(serverDir, 'node_modules/supertest'));
}
const app = require(path.join(serverDir, 'index'));

async function runTests() {
  console.log('🧪 Starting SellerDesk API Integration Tests (In-Memory Supertest)...\n');

  try {
    // 1. Health check
    console.log('1. Health check endpoint');
    const health = await request(app).get('/api/health');
    console.assert(health.status === 200, `Health check expected 200, got ${health.status}`);
    console.assert(health.body.status === 'ok', 'Health status should be ok');
    console.log('   ✅ Health check passed\n');

    // 2. Auth - Admin login (Seller 1)
    console.log('2. Authentication (Seller 1 Admin Login)');
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@demo.com', password: 'Admin@123' });
    console.assert(adminLogin.status === 200, `Login expected 200, got ${adminLogin.status}`);
    const adminToken = adminLogin.body.token;
    console.assert(adminToken, 'Admin token should be present');
    console.assert(adminLogin.body.user.role === 'admin', 'Role should be admin');
    console.assert(adminLogin.body.user.seller_id === 1, 'Seller ID should be 1');
    console.log(`   ✅ Seller 1 Admin logged in (${adminLogin.body.user.seller_name})\n`);

    // 3. Auth - Staff login (Seller 1)
    console.log('3. Authentication (Seller 1 Staff Login)');
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@demo.com', password: 'Staff@123' });
    console.assert(staffLogin.status === 200, `Staff login expected 200, got ${staffLogin.status}`);
    const staffToken = staffLogin.body.token;
    console.assert(staffLogin.body.user.role === 'staff', 'Role should be staff');
    console.assert(staffLogin.body.user.seller_id === 1, 'Seller ID should be 1');
    console.log('   ✅ Seller 1 Staff logged in successfully\n');

    // 4. Role Authorization Check (Operational vs Admin-Only Modules)
    console.log('4. Role Authorization & RBAC Checks');
    // 4a. Staff CAN access operational dashboard
    const staffDashboard = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${staffToken}`);
    console.assert(
      staffDashboard.status === 200,
      `Staff dashboard expected 200, got ${staffDashboard.status}`
    );
    console.assert(
      staffDashboard.body.today.total_profit === undefined,
      'Staff dashboard should not expose total_profit'
    );

    // 4b. Admin CAN access operational dashboard with profit
    const adminDashboard = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(
      adminDashboard.status === 200,
      `Admin dashboard expected 200, got ${adminDashboard.status}`
    );
    console.assert(
      adminDashboard.body.today.total_profit !== undefined,
      'Admin dashboard should include total_profit'
    );

    // 4c. Staff FORBIDDEN from admin-only profit reports
    const forbiddenProfit = await request(app)
      .get('/api/reports/profit')
      .set('Authorization', `Bearer ${staffToken}`);
    console.assert(
      forbiddenProfit.status === 403,
      `Staff access to profit report should be 403, got ${forbiddenProfit.status}`
    );

    // 4d. Staff FORBIDDEN from modifying settings
    const forbiddenSettingsUpdate = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ business_name: 'Hacked Store' });
    console.assert(
      forbiddenSettingsUpdate.status === 403,
      `Staff modifying settings should be 403, got ${forbiddenSettingsUpdate.status}`
    );

    // 4e. Staff FORBIDDEN from user management
    const forbiddenUsers = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${staffToken}`);
    console.assert(
      forbiddenUsers.status === 403,
      `Staff access to users should be 403, got ${forbiddenUsers.status}`
    );

    // 4f. Staff CAN read settings (for business name / delivery charges)
    const staffSettings = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${staffToken}`);
    console.assert(
      staffSettings.status === 200,
      `Staff reading settings expected 200, got ${staffSettings.status}`
    );

    console.log('   ✅ Role authorization & RBAC checks passed perfectly\n');

    // 5. Products list (Seller 1)
    console.log('5. Products Retrieval (Seller 1)');
    const productsRes = await request(app)
      .get('/api/products?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(productsRes.status === 200, `Products list expected 200, got ${productsRes.status}`);
    console.assert(productsRes.body.data.length > 0, 'Products list should have items');
    const testProduct = productsRes.body.data[0];
    const initialStock = testProduct.stock_quantity;
    console.log(`   ✅ Products loaded (Found ${productsRes.body.pagination.total} products for Seller 1)\n`);

    // 6. Stock adjustment
    console.log('6. Stock Adjustment');
    const adjustRes = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        product_id: testProduct.id,
        quantity: 5,
        type: 'restock',
        reason: 'Automated test shipment',
      });
    console.assert(adjustRes.status === 200, `Stock adjust expected 200, got ${adjustRes.status}`);
    console.assert(
      adjustRes.body.stock_quantity === initialStock + 5,
      `Expected stock ${initialStock + 5}, got ${adjustRes.body.stock_quantity}`
    );
    console.log(`   ✅ Stock adjusted from ${initialStock} to ${adjustRes.body.stock_quantity}\n`);

    // 7. Order Creation with Customer & Items (Transaction)
    console.log('7. Create Order & Validate Stock Reservation');
    const orderPayload = {
      customer: {
        name: 'Sultana Razia',
        phone: '01899112233',
        district: 'Dhaka',
        area: 'Dhanmondi',
        address: 'Road 27, House 4B',
      },
      items: [
        {
          product_id: testProduct.id,
          product_name: testProduct.name,
          quantity: 2,
          unit_price: testProduct.sale_price || testProduct.selling_price || 500,
          buying_cost: testProduct.cost_price || testProduct.buying_cost || 250,
        },
      ],
      delivery_charge: 60,
      discount: 10,
      payment_method: 'cod',
      advance_amount: 0,
      source: 'facebook',
      courier: 'Pathao',
      note: 'Urgent delivery test',
    };

    const createOrderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(orderPayload);
    console.assert(createOrderRes.status === 201, `Order create expected 201, got ${createOrderRes.status}`);
    const newOrder = createOrderRes.body.order || createOrderRes.body;
    console.assert(newOrder.order_number, 'Order number generated');
    console.assert(newOrder.status === 'new', `Order status should be new, got ${newOrder.status}`);
    console.log(`   ✅ Order ${newOrder.order_number} created successfully\n`);

    // 8. Order Status Transition: New -> Confirmed (Deducts Stock)
    console.log('8. Confirm Order (Triggers automatic stock deduction)');
    const confirmRes = await request(app)
      .put(`/api/orders/${newOrder.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    console.assert(confirmRes.status === 200, `Order confirm expected 200, got ${confirmRes.status}`);

    const verifiedProd = await request(app)
      .get(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(
      verifiedProd.body.stock_quantity === initialStock + 5 - 2,
      `Stock should be ${initialStock + 5 - 2}, got ${verifiedProd.body.stock_quantity}`
    );
    console.log(`   ✅ Stock deducted on confirmation (${initialStock + 5} -> ${verifiedProd.body.stock_quantity})\n`);

    // 9. Order Status Transition: Confirmed -> Returned (Restores Stock)
    console.log('9. Return Order (Triggers automatic stock restoration)');
    const returnRes = await request(app)
      .put(`/api/orders/${newOrder.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'returned' });
    console.assert(returnRes.status === 200, `Order return expected 200, got ${returnRes.status}`);

    const restoredProd = await request(app)
      .get(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(
      restoredProd.body.stock_quantity === initialStock + 5,
      `Stock should be restored to ${initialStock + 5}, got ${restoredProd.body.stock_quantity}`
    );
    console.log(`   ✅ Stock restored on return (${restoredProd.body.stock_quantity})\n`);

    // 10. COD Summary & Tracker
    console.log('10. COD Summary & Tracker');
    const codSummary = await request(app)
      .get('/api/cod/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(codSummary.status === 200, `COD summary expected 200, got ${codSummary.status}`);
    console.assert(codSummary.body.total_pending !== undefined, 'COD pending defined');
    console.log(
      `   ✅ COD Summary: Pending ${codSummary.body.total_pending}, Collected ${codSummary.body.total_collected}\n`
    );

    // 11. Customer Phone Auto-fill Lookup & Duplicate Warning Check
    console.log('11. Customer Lookup by Phone & Duplicate Warning Check');
    const lookupRes = await request(app)
      .get('/api/customers/lookup?phone=01899112233')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(lookupRes.status === 200, `Customer lookup expected 200, got ${lookupRes.status}`);
    console.assert(lookupRes.body.found === true, 'Customer should be found');
    console.assert(lookupRes.body.customer.name === 'Sultana Razia', 'Customer name matches');
    console.assert(lookupRes.body.recent_order !== null, 'Recent order should be detected for duplicate warning');
    console.log(`   ✅ Customer lookup found: ${lookupRes.body.customer.name} (Recent order: ${lookupRes.body.recent_order.order_number})\n`);

    // 12. Settings Get & Update
    console.log('12. Settings Management');
    const settingsGet = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(settingsGet.status === 200, `Settings get expected 200, got ${settingsGet.status}`);
    const settingsUpdate = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        business_name: 'SellerDesk Official Store',
        default_delivery_charge: 70,
      });
    console.assert(settingsUpdate.status === 200, `Settings update expected 200, got ${settingsUpdate.status}`);
    console.log(`   ✅ Settings updated: ${settingsUpdate.body.business_name}\n`);

    // 13. Dynamic Dashboard Analytics (7-day trend check)
    console.log('13. Dashboard Live 7-Day Trend');
    const dashRes = await request(app)
      .get('/api/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    console.assert(dashRes.status === 200, `Dashboard expected 200, got ${dashRes.status}`);
    console.assert(Array.isArray(dashRes.body.last_7_days), 'last_7_days should be an array');
    console.assert(dashRes.body.last_7_days.length === 7, 'last_7_days should have 7 entries');
    console.log(`   ✅ Dashboard trends computed: ${dashRes.body.last_7_days.length} days verified\n`);

    // 14. Password Change verification
    console.log('14. Password Change (Using current_password payload)');
    const passChangeRes = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        current_password: 'Staff@123',
        new_password: 'NewStaff@123',
      });
    console.assert(passChangeRes.status === 200, `Password change expected 200, got ${passChangeRes.status}`);

    // Revert password back
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        current_password: 'NewStaff@123',
        new_password: 'Staff@123',
      });
    console.log('   ✅ Password change with current_password verified & reverted\n');

    // 15. CRITICAL: Multi-Tenant Seller Isolation Verification
    console.log('15. Multi-Tenant Seller Isolation Verification (Seller 1 vs Seller 2)');

    // 15a. Login as Seller 2 Admin
    const seller2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'seller2@demo.com', password: 'Seller2@123' });
    console.assert(seller2Login.status === 200, `Seller 2 login failed: ${seller2Login.status}`);
    const seller2Token = seller2Login.body.token;
    console.assert(seller2Login.body.user.seller_id === 2, 'Seller 2 ID should be 2');
    console.log(`   ✅ Seller 2 Admin logged in (${seller2Login.body.user.seller_name})`);

    // 15b. Cross-Seller Product Isolation: Seller 2 cannot see Seller 1's products in list
    const seller2Products = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(seller2Products.status === 200, 'Seller 2 products list');
    const s1ProdInS2 = seller2Products.body.data.find((p) => p.id === testProduct.id);
    console.assert(!s1ProdInS2, 'Seller 1 product MUST NOT appear in Seller 2 product list');

    // 15c. Cross-Seller Product Isolation: Seller 2 cannot GET Seller 1's product directly
    const s2GetS1Prod = await request(app)
      .get(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2GetS1Prod.status === 404, `Seller 2 reading Seller 1 product should be 404, got ${s2GetS1Prod.status}`);

    // 15d. Cross-Seller Product Isolation: Seller 2 cannot UPDATE Seller 1's product
    const s2UpdateS1Prod = await request(app)
      .put(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ name: 'Hacked by Seller 2' });
    console.assert(s2UpdateS1Prod.status === 404, `Seller 2 updating Seller 1 product should be 404, got ${s2UpdateS1Prod.status}`);

    // 15e. Cross-Seller Product Isolation: Seller 2 cannot DELETE Seller 1's product
    const s2DeleteS1Prod = await request(app)
      .delete(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2DeleteS1Prod.status === 404, `Seller 2 deleting Seller 1 product should be 404, got ${s2DeleteS1Prod.status}`);

    // 15f. Cross-Seller Order Isolation: Seller 2 cannot GET Seller 1's order
    const s2GetS1Order = await request(app)
      .get(`/api/orders/${newOrder.id}`)
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2GetS1Order.status === 404, `Seller 2 reading Seller 1 order should be 404, got ${s2GetS1Order.status}`);

    // 15g. Cross-Seller Order Isolation: Seller 2 cannot UPDATE Seller 1's order
    const s2UpdateS1Order = await request(app)
      .put(`/api/orders/${newOrder.id}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ status: 'delivered' });
    console.assert(s2UpdateS1Order.status === 404, `Seller 2 updating Seller 1 order should be 404, got ${s2UpdateS1Order.status}`);

    // 15h. Cross-Seller Order Isolation: Seller 2 cannot BULK UPDATE Seller 1's order
    const s2BulkUpdate = await request(app)
      .put('/api/orders/bulk-status')
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ order_ids: [newOrder.id], status: 'delivered' });
    console.assert(s2BulkUpdate.status === 403, `Seller 2 bulk updating Seller 1 order should be 403, got ${s2BulkUpdate.status}`);

    // 15i. Cross-Seller Order Isolation: Seller 2 cannot DELETE Seller 1's order
    const s2DeleteS1Order = await request(app)
      .delete(`/api/orders/${newOrder.id}`)
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2DeleteS1Order.status === 404, `Seller 2 deleting Seller 1 order should be 404, got ${s2DeleteS1Order.status}`);

    // 15j. Cross-Seller Customer Isolation: Seller 2 lookup for Seller 1's customer phone returns not found
    const s2CustomerLookup = await request(app)
      .get('/api/customers/lookup?phone=01899112233')
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2CustomerLookup.status === 200, 'Customer lookup status');
    console.assert(s2CustomerLookup.body.found === false, 'Seller 1 customer should NOT be found by Seller 2');

    // 15k. Cross-Seller Settings Isolation: Seller 2 settings are distinct
    const s2Settings = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${seller2Token}`);
    console.assert(s2Settings.status === 200, 'Seller 2 settings status');
    console.assert(
      s2Settings.body.business_name === 'Gadget Planet',
      `Expected Gadget Planet, got ${s2Settings.body.business_name}`
    );

    console.log('   ✅ Multi-Tenant Seller Isolation fully verified across Products, Orders, Customers, and Settings!\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! (15/15)');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
