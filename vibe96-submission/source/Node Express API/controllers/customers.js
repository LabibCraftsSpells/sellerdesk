'use strict';

const db = require('../db');

// GET /api/customers
async function listCustomers(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const conditions = ['c.seller_id = ?'];
  const params = [req.user.seller_id];

  if (req.query.search) {
    conditions.push('(c.name LIKE ? OR c.phone LIKE ?)');
    const like = `%${req.query.search}%`;
    params.push(like, like);
  }
  if (req.query.risky === 'true') {
    conditions.push('c.is_risky = 1');
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM customers c ${where}`,
    params
  );

  const [rows] = await db.execute(
    `SELECT c.id, c.seller_id, c.name, c.phone, c.address, c.total_orders, c.total_spent,
            c.is_risky, c.notes, c.created_at
     FROM customers c
     ${where}
     ORDER BY c.total_orders DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: countRows[0].total,
      pages: Math.ceil(countRows[0].total / limit),
    },
  });
}

// GET /api/customers/:id
async function getCustomer(req, res) {
  const { id } = req.params;

  const [customers] = await db.execute(
    'SELECT * FROM customers WHERE id = ? AND seller_id = ? LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!customers[0]) return res.status(404).json({ error: 'Customer not found' });

  const [orders] = await db.execute(
    `SELECT id, order_number, status, payment_method, total, cod_amount,
            cod_settled, courier, tracking_id, created_at
     FROM orders
     WHERE customer_id = ? AND seller_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 50`,
    [id, req.user.seller_id]
  );

  res.json({ ...customers[0], orders });
}

// GET /api/customers/lookup?phone=
async function lookupCustomer(req, res) {
  const { phone } = req.query;
  if (!phone) return res.status(422).json({ error: 'Phone number is required' });

  const [rows] = await db.execute(
    `SELECT id, seller_id, name, phone, district, area, full_address, address, total_orders, total_spent, is_risky
     FROM customers WHERE phone = ? AND seller_id = ? LIMIT 1`,
    [phone, req.user.seller_id]
  );

  // Check for recent duplicate order within last 48 hours for this seller
  const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  const [recentOrders] = await db.execute(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at
     FROM orders o
     WHERE (o.customer_id = ? OR o.customer_id IN (SELECT id FROM customers WHERE phone = ? AND seller_id = ?))
       AND o.seller_id = ?
       AND o.deleted_at IS NULL AND o.created_at >= ?
     ORDER BY o.created_at DESC LIMIT 1`,
    [rows[0] ? rows[0].id : 0, phone, req.user.seller_id, req.user.seller_id, twoDaysAgo]
  );

  const recentOrder = recentOrders && recentOrders[0] ? recentOrders[0] : null;

  if (!rows[0]) {
    return res.json({ found: false, recent_order: recentOrder });
  }

  res.json({
    found: true,
    customer: rows[0],
    recent_order: recentOrder,
  });
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  const { id } = req.params;
  const { name, phone, address, notes, is_risky } = req.body;

  const [exists] = await db.execute(
    'SELECT id FROM customers WHERE id = ? AND seller_id = ? LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!exists[0]) return res.status(404).json({ error: 'Customer not found' });

  await db.execute(
    `UPDATE customers SET
       name = COALESCE(?, name),
       phone = COALESCE(?, phone),
       address = COALESCE(?, address),
       notes = COALESCE(?, notes),
       is_risky = COALESCE(?, is_risky),
       updated_at = NOW()
     WHERE id = ? AND seller_id = ?`,
    [
      name ?? null, phone ?? null, address ?? null, notes ?? null,
      is_risky !== undefined ? (is_risky ? 1 : 0) : null,
      id,
      req.user.seller_id,
    ]
  );

  const [updated] = await db.execute(
    'SELECT * FROM customers WHERE id = ? AND seller_id = ?',
    [id, req.user.seller_id]
  );
  res.json(updated[0]);
}

module.exports = { listCustomers, getCustomer, lookupCustomer, updateCustomer };
