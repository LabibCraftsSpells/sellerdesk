'use strict';

const db = require('../db');
const { toCsv, sendCsv } = require('../utils/csv');

// GET /api/reports/dashboard
async function getDashboard(req, res) {
  const sellerId = req.user.seller_id;

  // Helper to get order stats for a date range
  async function getStats(dateCondition, params) {
    const [[orders]] = await db.execute(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_revenue,
         COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) AS delivered,
         COALESCE(SUM(CASE WHEN status IN ('returned', 'cancelled') THEN 1 ELSE 0 END), 0) AS returns
       FROM orders
       WHERE ${dateCondition} AND deleted_at IS NULL AND seller_id = ?`,
      [...params, sellerId]
    );

    // Profit: sum of (unit_price - cost_price) * quantity for delivered orders
    const [[profit]] = await db.execute(
      `SELECT COALESCE(SUM((oi.unit_price - oi.cost_price) * oi.quantity), 0) AS total_profit
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE ${dateCondition} AND o.status = 'delivered' AND o.deleted_at IS NULL AND o.seller_id = ?`,
      [...params, sellerId]
    );

    return {
      total_orders: orders.total_orders,
      total_revenue: orders.total_revenue,
      total_profit: profit.total_profit,
      delivered: orders.delivered,
      returns: orders.returns,
      delivered_rate: orders.total_orders > 0
        ? Math.round((orders.delivered / orders.total_orders) * 100)
        : 0,
      return_rate: orders.total_orders > 0
        ? Math.round((orders.returns / orders.total_orders) * 100)
        : 0,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [todayStats, weekStats, monthStats] = await Promise.all([
    getStats('DATE(created_at) = ?', [today]),
    getStats('DATE(created_at) >= ?', [weekAgo]),
    getStats('DATE(created_at) >= ?', [monthAgo]),
  ]);

  // Strip profit metrics for non-admin staff
  if (req.user?.role !== 'admin') {
    delete todayStats.total_profit;
    delete weekStats.total_profit;
    delete monthStats.total_profit;
  }

  // Top 5 products by revenue (last 30 days)
  const [topProducts] = await db.execute(
    `SELECT oi.product_id, oi.product_name,
            SUM(oi.quantity) AS units_sold,
            SUM(oi.unit_price * oi.quantity) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE DATE(o.created_at) >= ? AND o.status = 'delivered' AND o.deleted_at IS NULL AND o.seller_id = ?
     GROUP BY oi.product_id, oi.product_name
     ORDER BY revenue DESC
     LIMIT 5`,
    [monthAgo, sellerId]
  );

  // Low stock items
  const [lowStock] = await db.execute(
    `SELECT id, name, stock_quantity, low_stock_threshold
     FROM products
     WHERE stock_quantity <= low_stock_threshold AND deleted_at IS NULL AND is_active = 1 AND seller_id = ?
     ORDER BY stock_quantity ASC
     LIMIT 10`,
    [sellerId]
  );

  // COD pending
  const [[codPending]] = await db.execute(
    `SELECT COALESCE(SUM(cod_amount), 0) AS total_cod_pending,
            COUNT(*) AS pending_count
     FROM orders
     WHERE payment_method = 'cod' AND cod_settled = 0 AND status = 'delivered' AND deleted_at IS NULL AND seller_id = ?`,
    [sellerId]
  );

  // Last 7 days delivered vs returned trend
  const [dailyRows] = await db.execute(
    `SELECT DATE(created_at) AS date_str,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) AS delivered,
            COALESCE(SUM(CASE WHEN status IN ('returned', 'cancelled') THEN 1 ELSE 0 END), 0) AS returned
     FROM orders
     WHERE DATE(created_at) >= ? AND deleted_at IS NULL AND seller_id = ?
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) ASC`,
    [weekAgo, sellerId]
  );

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const match = dailyRows.find((r) => r.date_str === dateStr);
    last7Days.push({
      name: daysOfWeek[d.getDay()],
      date: dateStr,
      delivered: match ? Number(match.delivered) : 0,
      returned: match ? Number(match.returned) : 0,
    });
  }

  res.json({
    today: todayStats,
    week: weekStats,
    month: monthStats,
    top_products: topProducts,
    low_stock_items: lowStock,
    cod_pending: codPending,
    last_7_days: last7Days,
  });
}

// GET /api/reports/profit  (admin only)
async function getProfitReport(req, res) {
  const sellerId = req.user.seller_id;
  const { product_id, date_from, date_to } = req.query;

  const dateFrom = date_from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const dateTo = date_to || new Date().toISOString().split('T')[0];

  const conditions = [
    'o.seller_id = ?',
    "o.status = 'delivered'",
    'o.deleted_at IS NULL',
    'DATE(o.created_at) >= ?',
    'DATE(o.created_at) <= ?',
  ];
  const params = [sellerId, dateFrom, dateTo];

  if (product_id) {
    conditions.push('oi.product_id = ?');
    params.push(product_id);
  }

  const where = conditions.join(' AND ');

  // Profit per product
  const [byProduct] = await db.execute(
    `SELECT oi.product_id, oi.product_name,
            SUM(oi.quantity) AS units_sold,
            SUM(oi.unit_price * oi.quantity) AS revenue,
            SUM(oi.cost_price * oi.quantity) AS cost,
            SUM((oi.unit_price - oi.cost_price) * oi.quantity) AS profit
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE ${where}
     GROUP BY oi.product_id, oi.product_name
     ORDER BY profit DESC`,
    params
  );

  // Profit per day
  const [byDay] = await db.execute(
    `SELECT DATE(o.created_at) AS date,
            COUNT(DISTINCT o.id) AS orders,
            SUM(oi.unit_price * oi.quantity) AS revenue,
            SUM(oi.cost_price * oi.quantity) AS cost,
            SUM((oi.unit_price - oi.cost_price) * oi.quantity) AS profit
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE ${where}
     GROUP BY DATE(o.created_at)
     ORDER BY date ASC`,
    params
  );

  res.json({
    date_from: dateFrom,
    date_to: dateTo,
    by_product: byProduct,
    by_day: byDay,
  });
}

// GET /api/reports/orders/export
async function exportOrders(req, res) {
  const sellerId = req.user.seller_id;
  const conditions = ['o.deleted_at IS NULL', 'o.seller_id = ?'];
  const params = [sellerId];

  if (req.query.status) { conditions.push('o.status = ?'); params.push(req.query.status); }
  if (req.query.courier) { conditions.push('o.courier = ?'); params.push(req.query.courier); }
  if (req.query.date_from) { conditions.push('DATE(o.created_at) >= ?'); params.push(req.query.date_from); }
  if (req.query.date_to) { conditions.push('DATE(o.created_at) <= ?'); params.push(req.query.date_to); }
  if (req.query.search) {
    conditions.push('(c.name LIKE ? OR c.phone LIKE ? OR o.order_number LIKE ?)');
    const like = `%${req.query.search}%`;
    params.push(like, like, like);
  }

  const where = conditions.join(' AND ');

  const [rows] = await db.execute(
    `SELECT o.order_number, o.status, o.payment_method, o.courier, o.tracking_id,
            o.subtotal, o.shipping_cost, o.discount, o.total, o.cod_amount,
            o.cod_settled, o.note, o.created_at,
            c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE ${where}
     ORDER BY o.created_at DESC
     LIMIT 5000`,
    params
  );

  const columns = [
    'order_number', 'created_at', 'status', 'payment_method',
    'customer_name', 'customer_phone', 'customer_address',
    'courier', 'tracking_id', 'subtotal', 'shipping_cost',
    'discount', 'total', 'cod_amount', 'cod_settled', 'note',
  ];

  const headers = {
    order_number: 'Order Number',
    created_at: 'Date',
    status: 'Status',
    payment_method: 'Payment Method',
    customer_name: 'Customer Name',
    customer_phone: 'Customer Phone',
    customer_address: 'Customer Address',
    courier: 'Courier',
    tracking_id: 'Tracking ID',
    subtotal: 'Subtotal',
    shipping_cost: 'Shipping Cost',
    discount: 'Discount',
    total: 'Total',
    cod_amount: 'COD Amount',
    cod_settled: 'COD Settled',
    note: 'Note',
  };

  const csv = toCsv(rows, columns, headers);
  const filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;
  sendCsv(res, filename, csv);
}

module.exports = { getDashboard, getProfitReport, exportOrders };
