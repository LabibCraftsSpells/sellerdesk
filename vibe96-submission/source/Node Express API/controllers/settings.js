'use strict';

const db = require('../db');

// GET /api/settings
async function getSettings(req, res) {
  const sellerId = req.user.seller_id;
  const [rows] = await db.execute(
    'SELECT `key`, `value` FROM settings WHERE seller_id = ? ORDER BY `key`',
    [sellerId]
  );

  const settings = {};
  for (const row of rows) {
    const k = row.key || row.setting_key;
    const v = row.value !== undefined ? row.value : row.setting_value;
    settings[k] = v;
  }

  res.json(settings);
}

// PUT /api/settings (admin only)
async function updateSettings(req, res) {
  const sellerId = req.user.seller_id;
  const updates = req.body;

  if (typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(422).json({ error: 'Request body must be a key-value object' });
  }

  const entries = Object.entries(updates);
  if (entries.length === 0) {
    return res.status(422).json({ error: 'No settings provided' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const [key, value] of entries) {
      const valStr = value !== null && value !== undefined ? String(value) : null;
      // SQLite and MySQL both support REPLACE INTO (with unique constraint on seller_id, key)
      await conn.execute(
        'REPLACE INTO settings (seller_id, `key`, `value`) VALUES (?, ?, ?)',
        [sellerId, key, valStr]
      );
    }

    await conn.commit();

    // Return updated settings for this seller
    const [rows] = await conn.execute(
      'SELECT `key`, `value` FROM settings WHERE seller_id = ? ORDER BY `key`',
      [sellerId]
    );

    const settings = {};
    for (const row of rows) {
      const k = row.key || row.setting_key;
      const v = row.value !== undefined ? row.value : row.setting_value;
      settings[k] = v;
    }

    res.json(settings);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getSettings, updateSettings };
