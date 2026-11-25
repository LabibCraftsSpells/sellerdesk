'use strict';

const db = require('../db');

// POST /api/stock/adjust
async function adjustStock(req, res) {
  const sellerId = req.user.seller_id;
  const { product_id, variant_id, quantity, type, reason } = req.body;

  const allowedTypes = ['restock', 'deducted', 'returned', 'damaged', 'correction', 'add', 'remove', 'adjustment', 'damage', 'initial'];
  if (!allowedTypes.includes(type)) {
    return res.status(422).json({ error: `Invalid adjustment type. Must be one of: restock, damaged, correction` });
  }

  // Map to DB enum ('restock','deducted','returned','damaged','correction')
  const typeMap = {
    add: 'restock',
    restock: 'restock',
    initial: 'restock',
    remove: 'deducted',
    deducted: 'deducted',
    returned: 'returned',
    damage: 'damaged',
    damaged: 'damaged',
    adjustment: 'correction',
    correction: 'correction',
  };
  const dbType = typeMap[type] || 'correction';

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify product exists for this seller
    const [products] = await conn.execute(
      'SELECT id, stock_quantity FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
      [product_id, sellerId]
    );
    if (!products[0]) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const isNegative = dbType === 'deducted' || dbType === 'damaged' || type === 'remove';
    const delta = isNegative ? -Math.abs(quantity) : Math.abs(quantity);

    if (variant_id) {
      const [variants] = await conn.execute(
        'SELECT id, stock_quantity FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1',
        [variant_id, product_id]
      );
      if (!variants[0]) {
        await conn.rollback();
        return res.status(404).json({ error: 'Variant not found' });
      }
      const newQty = variants[0].stock_quantity + delta;
      if (newQty < 0) {
        await conn.rollback();
        return res.status(422).json({ error: 'Insufficient stock for this adjustment' });
      }
      await conn.execute(
        'UPDATE product_variants SET stock_quantity = ? WHERE id = ?',
        [newQty, variant_id]
      );
    } else {
      const newQty = products[0].stock_quantity + delta;
      if (newQty < 0) {
        await conn.rollback();
        return res.status(422).json({ error: 'Insufficient stock for this adjustment' });
      }
      await conn.execute(
        'UPDATE products SET stock_quantity = ?, updated_at = NOW() WHERE id = ? AND seller_id = ?',
        [newQty, product_id, sellerId]
      );
    }

    await conn.execute(
      `INSERT INTO stock_movements (seller_id, product_id, variant_id, quantity, type, reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sellerId, product_id, variant_id || null, Math.abs(quantity), dbType, reason || null, req.user.id]
    );

    await conn.commit();

    const [updated] = await conn.execute(
      'SELECT id, name, stock_quantity FROM products WHERE id = ? AND seller_id = ?',
      [product_id, sellerId]
    );

    res.json({
      message: 'Stock adjusted successfully',
      product: updated[0],
      ...updated[0],
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { adjustStock };
