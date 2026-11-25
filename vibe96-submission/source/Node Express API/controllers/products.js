'use strict';

const db = require('../db');

// GET /api/products
async function listProducts(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const conditions = ['p.deleted_at IS NULL', 'p.seller_id = ?'];
  const params = [req.user.seller_id];

  if (req.query.search) {
    conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
    const like = `%${req.query.search}%`;
    params.push(like, like);
  }
  if (req.query.low_stock === 'true') {
    conditions.push('p.stock_quantity <= p.low_stock_threshold');
  }
  if (req.query.category) {
    conditions.push('p.category = ?');
    params.push(req.query.category);
  }

  const where = conditions.join(' AND ');

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM products p WHERE ${where}`,
    params
  );

  const [rows] = await db.execute(
    `SELECT p.id, p.seller_id, p.name, p.sku, p.category,
            COALESCE(p.sale_price, p.selling_price, 0) AS sale_price,
            COALESCE(p.selling_price, p.sale_price, 0) AS selling_price,
            COALESCE(p.cost_price, p.buying_cost, 0) AS cost_price,
            COALESCE(p.buying_cost, p.cost_price, 0) AS buying_cost,
            p.stock_quantity, p.low_stock_threshold, p.unit,
            COALESCE(p.image_url, p.photo_url) AS image_url,
            COALESCE(p.photo_url, p.image_url) AS photo_url,
            p.is_active, p.created_at
     FROM products p
     WHERE ${where}
     ORDER BY p.created_at DESC
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

// POST /api/products
async function createProduct(req, res) {
  const {
    name, sku, category, sale_price, cost_price,
    stock_quantity, low_stock_threshold, unit, image_url,
    description, variants,
  } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const sPrice = Number(sale_price !== undefined ? sale_price : req.body.selling_price) || 0;
    const cPrice = Number(cost_price !== undefined ? cost_price : req.body.buying_cost) || 0;
    const imgUrl = image_url || req.body.photo_url || null;

    const [result] = await conn.execute(
      `INSERT INTO products
         (seller_id, name, sku, category, selling_price, sale_price, buying_cost, cost_price, stock_quantity,
          low_stock_threshold, unit, photo_url, image_url, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.seller_id,
        name, sku || null, category || null,
        sPrice, sPrice, cPrice, cPrice,
        Number(stock_quantity || 0), Number(low_stock_threshold || 5),
        unit || 'pcs', imgUrl, imgUrl, description || null,
      ]
    );
    const productId = result.insertId;

    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await conn.execute(
          `INSERT INTO product_variants
             (product_id, name, sku, sale_price, cost_price, stock_quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId, v.name, v.sku || null,
            Number(v.sale_price || sale_price),
            Number(v.cost_price || cost_price || 0),
            Number(v.stock_quantity || 0),
          ]
        );
      }
    }

    await conn.commit();

    const [created] = await conn.execute(
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
      [productId, req.user.seller_id]
    );
    res.status(201).json(created[0]);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  const { id } = req.params;

  const [products] = await db.execute(
    'SELECT * FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!products[0]) return res.status(404).json({ error: 'Product not found' });

  const [variants] = await db.execute(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [id]
  );
  const [movements] = await db.execute(
    `SELECT sm.*, o.order_number FROM stock_movements sm
     LEFT JOIN orders o ON o.id = sm.order_id
     WHERE sm.product_id = ? AND sm.seller_id = ?
     ORDER BY sm.created_at DESC LIMIT 50`,
    [id, req.user.seller_id]
  );

  res.json({ ...products[0], variants, stock_movements: movements });
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  const { id } = req.params;
  const {
    name, sku, category, sale_price, cost_price,
    stock_quantity, low_stock_threshold, unit, image_url,
    description, is_active,
  } = req.body;

  const [exists] = await db.execute(
    'SELECT id FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!exists[0]) return res.status(404).json({ error: 'Product not found' });

  const sPrice = sale_price !== undefined ? Number(sale_price) : (req.body.selling_price !== undefined ? Number(req.body.selling_price) : null);
  const cPrice = cost_price !== undefined ? Number(cost_price) : (req.body.buying_cost !== undefined ? Number(req.body.buying_cost) : null);
  const imgUrl = image_url !== undefined ? image_url : (req.body.photo_url !== undefined ? req.body.photo_url : null);

  await db.execute(
    `UPDATE products SET
       name = COALESCE(?, name),
       sku = COALESCE(?, sku),
       category = COALESCE(?, category),
       sale_price = COALESCE(?, sale_price),
       selling_price = COALESCE(?, selling_price),
       cost_price = COALESCE(?, cost_price),
       buying_cost = COALESCE(?, buying_cost),
       stock_quantity = COALESCE(?, stock_quantity),
       low_stock_threshold = COALESCE(?, low_stock_threshold),
       unit = COALESCE(?, unit),
       image_url = COALESCE(?, image_url),
       photo_url = COALESCE(?, photo_url),
       description = COALESCE(?, description),
       is_active = COALESCE(?, is_active),
       updated_at = NOW()
     WHERE id = ? AND seller_id = ?`,
    [
      name ?? null, sku ?? null, category ?? null,
      sPrice, sPrice,
      cPrice, cPrice,
      stock_quantity !== undefined ? Number(stock_quantity) : null,
      low_stock_threshold !== undefined ? Number(low_stock_threshold) : null,
      unit ?? null, imgUrl, imgUrl, description ?? null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id,
      req.user.seller_id,
    ]
  );

  const [updated] = await db.execute(
    'SELECT * FROM products WHERE id = ? AND seller_id = ?',
    [id, req.user.seller_id]
  );
  res.json(updated[0]);
}

// DELETE /api/products/:id  (admin)
async function deleteProduct(req, res) {
  const { id } = req.params;

  const [exists] = await db.execute(
    'SELECT id FROM products WHERE id = ? AND seller_id = ? AND deleted_at IS NULL LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!exists[0]) return res.status(404).json({ error: 'Product not found' });

  await db.execute(
    'UPDATE products SET deleted_at = NOW() WHERE id = ? AND seller_id = ?',
    [id, req.user.seller_id]
  );
  res.json({ message: 'Product deleted successfully' });
}

module.exports = {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
