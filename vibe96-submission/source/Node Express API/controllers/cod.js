'use strict';

const db = require('../db');

// GET /api/cod/summary
async function getCodSummary(req, res) {
  const sellerId = req.user.seller_id;

  const [[pending]] = await db.execute(
    `SELECT COALESCE(SUM(cod_amount), 0) AS total_pending
     FROM orders
     WHERE seller_id = ? AND payment_method = 'cod' AND cod_settled = 0 AND status = 'delivered' AND deleted_at IS NULL`,
    [sellerId]
  );

  const [[collected]] = await db.execute(
    `SELECT COALESCE(SUM(cod_amount), 0) AS total_collected
     FROM orders
     WHERE seller_id = ? AND payment_method = 'cod' AND cod_settled = 1 AND deleted_at IS NULL`,
    [sellerId]
  );

  const [[lost]] = await db.execute(
    `SELECT COALESCE(SUM(cod_amount), 0) AS total_lost_returns
     FROM orders
     WHERE seller_id = ? AND payment_method = 'cod' AND status IN ('returned', 'cancelled') AND deleted_at IS NULL`,
    [sellerId]
  );

  res.json({
    total_pending: pending.total_pending,
    total_collected: collected.total_collected,
    total_lost_returns: lost.total_lost_returns,
  });
}

// GET /api/cod/pending
async function getPendingCod(req, res) {
  const sellerId = req.user.seller_id;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const conditions = [
    'o.seller_id = ?',
    "o.payment_method = 'cod'",
    'o.cod_settled = 0',
    "o.status = 'delivered'",
    'o.deleted_at IS NULL',
  ];
  const params = [sellerId];

  if (req.query.courier) {
    conditions.push('o.courier = ?');
    params.push(req.query.courier);
  }

  const where = conditions.join(' AND ');

  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM orders o WHERE ${where}`,
    params
  );

  const [rows] = await db.execute(
    `SELECT o.id, o.order_number, o.total, o.cod_amount, o.courier,
            o.tracking_id, o.created_at,
            c.name AS customer_name, c.phone AS customer_phone
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE ${where}
     ORDER BY o.created_at ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ grand_total }]] = await db.execute(
    `SELECT COALESCE(SUM(cod_amount), 0) AS grand_total FROM orders o WHERE ${where}`,
    params
  );

  res.json({
    data: rows,
    grand_total,
    pagination: {
      page,
      limit,
      total: countRow.total,
      pages: Math.ceil(countRow.total / limit),
    },
  });
}

// POST /api/cod/settle
async function settleCod(req, res) {
  const sellerId = req.user.seller_id;
  const { order_ids, courier, received_amount, settled_at, notes } = req.body;

  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return res.status(422).json({ error: 'order_ids must be a non-empty array' });
  }

  const placeholders = order_ids.map(() => '?').join(',');
  const settleDate = settled_at || new Date().toISOString().split('T')[0];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify all orders belong to current seller, specified courier, and are unsettled
    const [orders] = await conn.execute(
      `SELECT id, cod_amount FROM orders
       WHERE id IN (${placeholders})
         AND seller_id = ?
         AND cod_settled = 0
         AND payment_method = 'cod'
         AND status = 'delivered'
         AND deleted_at IS NULL`,
      [...order_ids, sellerId]
    );

    if (orders.length !== order_ids.length) {
      await conn.rollback();
      return res.status(422).json({
        error: 'Some orders are invalid, belong to another seller, already settled, or not eligible for settlement',
      });
    }

    const totalCod = orders.reduce((sum, o) => sum + Number(o.cod_amount), 0);

    // Mark as settled
    await conn.execute(
      `UPDATE orders SET cod_settled = 1, cod_settled_at = ?, cod_received = cod_amount, updated_at = NOW()
       WHERE id IN (${placeholders}) AND seller_id = ?`,
      [settleDate, ...order_ids, sellerId]
    );

    // Insert courier settlement record
    await conn.execute(
      `INSERT INTO courier_settlements
         (seller_id, courier, settled_orders, total_amount, settled_at, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        courier || 'Other',
        JSON.stringify(order_ids),
        Number(received_amount) || totalCod,
        settleDate,
        notes || null,
        req.user.id,
      ]
    );

    await conn.commit();

    res.json({
      message: `${orders.length} order(s) settled successfully`,
      total_cod_amount: totalCod,
      received_amount: Number(received_amount) || totalCod,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getCodSummary, getPendingCod, settleCod };
