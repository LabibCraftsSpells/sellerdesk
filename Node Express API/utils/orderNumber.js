'use strict';

const db = require('../db');

/**
 * Generate an order number in the format SD-YYYYMMDD-XXXX
 * The sequence resets daily. Thread-safe via DB lock / atomic update.
 *
 * @param {number} [sellerId] - Optional seller ID for scoping order count
 * @param {object} [existingConn] - Optional active DB connection
 * @returns {Promise<string>} e.g. "SD-20241116-0001"
 */
async function generateOrderNumber(sellerId = null, existingConn = null) {
  const now = new Date();
  // Bangladesh time offset (+06:00)
  const bdOffset = 6 * 60;
  const utcOffset = now.getTimezoneOffset();
  const bdTime = new Date(now.getTime() + (bdOffset + utcOffset) * 60000);

  const year = bdTime.getFullYear();
  const month = String(bdTime.getMonth() + 1).padStart(2, '0');
  const day = String(bdTime.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  const conn = existingConn || (await db.getConnection());
  const shouldRelease = !existingConn;
  try {
    const query = sellerId
      ? 'SELECT COUNT(*) AS cnt FROM orders WHERE seller_id = ? AND order_number LIKE ?'
      : 'SELECT COUNT(*) AS cnt FROM orders WHERE order_number LIKE ?';
    const params = sellerId ? [sellerId, `SD-${datePart}-%`] : [`SD-${datePart}-%`];

    const [rows] = await conn.execute(query, params);
    const sequence = ((rows && rows[0] && rows[0].cnt) || 0) + 1;
    const seqPart = String(sequence).padStart(4, '0');

    return `SD-${datePart}-${seqPart}`;
  } finally {
    if (shouldRelease) {
      conn.release();
    }
  }
}

module.exports = { generateOrderNumber };
