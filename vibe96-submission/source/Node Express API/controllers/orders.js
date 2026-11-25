'use strict';

const db = require('../db');
const { generateOrderNumber } = require('../utils/orderNumber');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function findOrCreateCustomer(conn, sellerId, { name, phone, district, area, full_address, address, notes }) {
  const [existing] = await conn.execute(
    'SELECT id FROM customers WHERE phone = ? AND seller_id = ? LIMIT 1',
    [phone, sellerId]
  );
  const addr = address || full_address || '';
  if (existing[0]) {
    await conn.execute(
      'UPDATE customers SET name = COALESCE(?, name), district = COALESCE(?, district), area = COALESCE(?, area), full_address = COALESCE(?, full_address), address = COALESCE(?, address) WHERE id = ? AND seller_id = ?',
      [name || null, district || null, area || null, addr || null, addr || null, existing[0].id, sellerId]
    );
    return existing[0].id;
  }

  const [result] = await conn.execute(
    'INSERT INTO customers (seller_id, name, phone, district, area, full_address, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [sellerId, name, phone, district || null, area || null, addr || null, addr || null, notes || null]
  );
  return result.insertId;
}

async function validateStock(conn, sellerId, items) {
  const warnings = [];
  for (const item of items) {
    const [rows] = await conn.execute(
      `SELECT p.name, COALESCE(pv.stock_quantity, p.stock_quantity) AS available
       FROM products p
       LEFT JOIN product_variants pv ON pv.id = ? AND pv.product_id = p.id
       WHERE p.id = ? AND p.seller_id = ? LIMIT 1`,
      [item.variant_id || null, item.product_id, sellerId]
    );
    if (!rows[0]) continue;
    if (rows[0].available < item.quantity) {
      warnings.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: rows[0].name,
        requested: item.quantity,
        available: rows[0].available,
      });
    }
  }
  return warnings;
}

async function deductStock(conn, sellerId, items, orderId, direction = 'deduct', userId = null) {
  for (const item of items) {
    const qty = direction === 'deduct' ? -item.quantity : item.quantity;
    const movementType = direction === 'deduct' ? 'deducted' : 'returned';

    if (item.variant_id) {
      await conn.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [qty, item.variant_id]
      );
    } else {
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND seller_id = ?',
        [qty, item.product_id, sellerId]
      );
    }

    await conn.execute(
      `INSERT INTO stock_movements (seller_id, product_id, variant_id, order_id, quantity, type, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        item.product_id,
        item.variant_id || null,
        orderId,
        Math.abs(item.quantity),
        movementType,
        direction === 'deduct' ? 'Order confirmed' : 'Order returned/cancelled',
        userId,
      ]
    );
  }
}

function buildOrderListQuery(filters, sellerId) {
  const conditions = ['o.deleted_at IS NULL', 'o.seller_id = ?'];
  const params = [sellerId];

  if (filters.status) { conditions.push('o.status = ?'); params.push(filters.status); }
  if (filters.courier) { conditions.push('o.courier = ?'); params.push(filters.courier); }
  if (filters.payment_method) { conditions.push('o.payment_method = ?'); params.push(filters.payment_method); }
  if (filters.source) { conditions.push('o.source = ?'); params.push(filters.source); }
  if (filters.date_from) { conditions.push('DATE(o.created_at) >= ?'); params.push(filters.date_from); }
  if (filters.date_to) { conditions.push('DATE(o.created_at) <= ?'); params.push(filters.date_to); }
  if (filters.search) {
    conditions.push('(c.name LIKE ? OR c.phone LIKE ? OR o.order_number LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  return { where: conditions.join(' AND '), params };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/orders
async function createOrder(req, res) {
  const {
    customer,
    items,
    payment_method,
    source,
    courier,
    tracking_id,
    shipping_cost,
    delivery_charge,
    discount,
    note,
    advance_payment,
    advance_amount,
  } = req.body;

  const sellerId = req.user.seller_id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Find or create customer (scoped to seller)
    const customerId = await findOrCreateCustomer(conn, sellerId, customer);

    // 2. Validate stock (warn, don't block)
    const stockWarnings = await validateStock(conn, sellerId, items);

    // 3. Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unit_price * item.quantity;
    }
    const shippingCost = Number(delivery_charge !== undefined ? delivery_charge : shipping_cost) || 0;
    const discountAmt = Number(discount) || 0;
    const advanceAmt = Number(advance_amount !== undefined ? advance_amount : advance_payment) || 0;
    const total = subtotal + shippingCost - discountAmt;
    const codAmount = payment_method === 'cod' ? Math.max(0, total - advanceAmt) : 0;

    // 4. Generate order number
    const orderNumber = await generateOrderNumber(sellerId, conn);

    // 5. Insert order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders
         (seller_id, order_number, customer_id, payment_method, source, courier, tracking_id,
          subtotal, delivery_charge, discount, advance_amount, total, cod_amount,
          cod_settled, status, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'new', ?, ?)`,
      [
        sellerId,
        orderNumber, customerId, payment_method, source || 'facebook',
        courier || null, tracking_id || null,
        subtotal, shippingCost, discountAmt, advanceAmt, total, codAmount,
        note || null, req.user.id,
      ]
    );
    const orderId = orderResult.insertId;

    // 6. Insert order items
    for (const item of items) {
      const buyingCost = Number(item.buying_cost || item.cost_price || 0);
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, buying_cost, cost_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.product_id, item.variant_id || null,
          item.product_name, item.variant_name || null,
          item.quantity, item.unit_price, buyingCost, buyingCost,
        ]
      );
    }

    // 7. Initial status history
    await conn.execute(
      `INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, 'new', 'Order created', ?)`,
      [orderId, req.user.id]
    );

    // Update customer stats
    await conn.execute(
      `UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ? AND seller_id = ?`,
      [total, customerId, sellerId]
    );

    await conn.commit();

    // 8. Fetch and return complete order
    const [created] = await conn.execute(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ? AND o.seller_id = ?`,
      [orderId, sellerId]
    );

    res.status(201).json({
      order: created[0],
      stock_warnings: stockWarnings,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// GET /api/orders
async function listOrders(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const { where, params } = buildOrderListQuery(req.query, req.user.seller_id);

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM orders o JOIN customers c ON c.id = o.customer_id WHERE ${where}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await db.execute(
    `SELECT o.id, o.seller_id, o.order_number, o.status, o.payment_method, o.courier, o.tracking_id,
            o.total, o.cod_amount, o.cod_settled, o.source, o.note, o.created_at,
            c.name AS customer_name, c.phone AS customer_phone
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// GET /api/orders/:id
async function getOrder(req, res) {
  const { id } = req.params;

  const [orders] = await db.execute(
    `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone,
            c.address AS customer_address, c.total_orders, c.total_spent, c.is_risky
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ? AND o.seller_id = ? AND o.deleted_at IS NULL LIMIT 1`,
    [id, req.user.seller_id]
  );
  if (!orders[0]) return res.status(404).json({ error: 'Order not found' });

  const [items] = await db.execute(
    'SELECT * FROM order_items WHERE order_id = ?',
    [id]
  );
  const [history] = await db.execute(
    `SELECT osh.*, u.name AS changed_by_name
     FROM order_status_history osh
     LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = ? ORDER BY osh.created_at ASC`,
    [id]
  );

  res.json({ ...orders[0], items, status_history: history });
}

// PUT /api/orders/:id
async function updateOrder(req, res) {
  const { id } = req.params;
  const sellerId = req.user.seller_id;
  const {
    status, courier, tracking_id, note,
    shipping_cost, discount, advance_payment,
  } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRows] = await conn.execute(
      'SELECT * FROM orders WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
      [id, sellerId]
    );
    const order = orderRows[0];
    if (!order) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const prevStatus = order.status;
    const newStatus = status || prevStatus;

    // Handle stock changes on status transitions
    if (prevStatus !== newStatus) {
      const [items] = await conn.execute(
        'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
        await deductStock(conn, sellerId, items, parseInt(id, 10), 'deduct', req.user.id);
      } else if (
        (newStatus === 'returned' || newStatus === 'cancelled') &&
        (prevStatus === 'confirmed' || prevStatus === 'shipped' || prevStatus === 'delivered')
      ) {
        await deductStock(conn, sellerId, items, parseInt(id, 10), 'restore', req.user.id);
      }

      // Update customer totals
      if (newStatus === 'delivered') {
        await conn.execute(
          `UPDATE customers SET
             total_orders = total_orders + 1,
             total_spent = total_spent + ?
           WHERE id = ? AND seller_id = ?`,
          [order.total || order.cod_amount || 0, order.customer_id, sellerId]
        );
      } else if (newStatus === 'returned') {
        await conn.execute(
          `UPDATE customers SET return_count = return_count + 1 WHERE id = ? AND seller_id = ?`,
          [order.customer_id, sellerId]
        );
      }

      // Log status change
      await conn.execute(
        'INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)',
        [id, newStatus, note || null, req.user.id]
      );
    }

    // Build dynamic update
    const updates = [];
    const vals = [];

    if (status) { updates.push('status = ?'); vals.push(status); }
    if (courier !== undefined) { updates.push('courier = ?'); vals.push(courier); }
    if (tracking_id !== undefined) { updates.push('tracking_id = ?'); vals.push(tracking_id); }
    if (note !== undefined) { updates.push('note = ?'); vals.push(note); }
    if (shipping_cost !== undefined) { updates.push('shipping_cost = ?'); vals.push(Number(shipping_cost)); }
    if (discount !== undefined) { updates.push('discount = ?'); vals.push(Number(discount)); }
    if (advance_payment !== undefined) { updates.push('advance_payment = ?'); vals.push(Number(advance_payment)); }

    if (updates.length > 0) {
      await conn.execute(
        `UPDATE orders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND seller_id = ?`,
        [...vals, id, sellerId]
      );
    }

    await conn.commit();

    const [updated] = await conn.execute(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.id = ? AND o.seller_id = ?`,
      [id, sellerId]
    );
    res.json(updated[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// PUT /api/orders/bulk-status
async function bulkUpdateStatus(req, res) {
  const { order_ids, status, note } = req.body;
  const sellerId = req.user.seller_id;

  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return res.status(422).json({ error: 'order_ids must be a non-empty array' });
  }

  const allowedStatuses = ['new', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(422).json({ error: `Invalid status: ${status}` });
  }

  const placeholders = order_ids.map(() => '?').join(',');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch existing status and items for each order belonging to this seller
    const [existingOrders] = await conn.execute(
      `SELECT id, status, customer_id, total, cod_amount FROM orders WHERE id IN (${placeholders}) AND deleted_at IS NULL AND seller_id = ?`,
      [...order_ids, sellerId]
    );

    if (existingOrders.length !== order_ids.length) {
      await conn.rollback();
      return res.status(403).json({ error: 'One or more orders not found or belong to another seller' });
    }

    for (const ord of existingOrders) {
      const prevStatus = ord.status;
      if (prevStatus === status) continue;

      const [items] = await conn.execute(
        'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
        [ord.id]
      );

      if (status === 'confirmed' && prevStatus !== 'confirmed') {
        await deductStock(conn, sellerId, items, ord.id, 'deduct', req.user.id);
      } else if (
        (status === 'returned' || status === 'cancelled') &&
        (prevStatus === 'confirmed' || prevStatus === 'shipped' || prevStatus === 'delivered')
      ) {
        await deductStock(conn, sellerId, items, ord.id, 'restore', req.user.id);
      }

      if (status === 'delivered') {
        await conn.execute(
          `UPDATE customers SET total_spent = total_spent + ? WHERE id = ? AND seller_id = ?`,
          [ord.total || ord.cod_amount || 0, ord.customer_id, sellerId]
        );
      } else if (status === 'returned') {
        await conn.execute(
          `UPDATE customers SET return_count = return_count + 1 WHERE id = ? AND seller_id = ?`,
          [ord.customer_id, sellerId]
        );
      }

      await conn.execute(
        'INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)',
        [ord.id, status, note || 'Bulk status update', req.user.id]
      );
    }

    await conn.execute(
      `UPDATE orders SET status = ?, updated_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL AND seller_id = ?`,
      [status, ...order_ids, sellerId]
    );

    await conn.commit();
    res.json({ message: `Updated ${order_ids.length} order(s) to status "${status}"` });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// DELETE /api/orders/:id  (admin)
async function deleteOrder(req, res) {
  const { id } = req.params;
  const sellerId = req.user.seller_id;
  const hard = req.query.hard === 'true';

  const [exists] = await db.execute(
    'SELECT id FROM orders WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
    [id, sellerId]
  );
  if (!exists[0]) return res.status(404).json({ error: 'Order not found' });

  if (hard) {
    await db.execute('DELETE FROM orders WHERE id = ? AND seller_id = ?', [id, sellerId]);
  } else {
    await db.execute('UPDATE orders SET deleted_at = NOW() WHERE id = ? AND seller_id = ?', [id, sellerId]);
  }

  res.json({ message: 'Order deleted successfully' });
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  bulkUpdateStatus,
  deleteOrder,
};
