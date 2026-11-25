'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      seller_id: user.seller_id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const [rows] = await db.execute(
    `SELECT u.id, u.seller_id, u.name, u.email, u.role, u.password_hash, u.is_active,
            s.name AS seller_name, s.slug AS seller_slug, s.is_active AS seller_is_active
     FROM users u
     JOIN sellers s ON s.id = u.seller_id
     WHERE u.email = ? LIMIT 1`,
    [email]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }
  if (!user.seller_is_active) {
    return res.status(403).json({ error: 'Seller account is deactivated' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      seller_id: user.seller_id,
      seller_name: user.seller_name,
      seller_slug: user.seller_slug,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

// POST /api/auth/logout
async function logout(_req, res) {
  // Stateless JWT — no server-side action required
  res.json({ message: 'Logged out successfully' });
}

// GET /api/auth/me
async function me(req, res) {
  const [rows] = await db.execute(
    `SELECT u.id, u.seller_id, u.name, u.email, u.role, u.is_active, u.created_at,
            s.name AS seller_name, s.slug AS seller_slug
     FROM users u
     JOIN sellers s ON s.id = u.seller_id
     WHERE u.id = ? AND u.seller_id = ? LIMIT 1`,
    [req.user.id, req.user.seller_id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  const oldPassword = req.body.old_password || req.body.current_password;
  const newPassword = req.body.new_password;

  const [rows] = await db.execute(
    'SELECT id, password_hash FROM users WHERE id = ? AND seller_id = ? LIMIT 1',
    [req.user.id, req.user.seller_id]
  );
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.execute('UPDATE users SET password_hash = ? WHERE id = ? AND seller_id = ?', [
    hash,
    user.id,
    req.user.seller_id,
  ]);

  res.json({ message: 'Password changed successfully' });
}

// POST /api/auth/users  (admin)
async function createUser(req, res) {
  const { name, email, password, role } = req.body;

  const [exists] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (exists[0]) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await db.execute(
    'INSERT INTO users (seller_id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [req.user.seller_id, name, email, hash, role || 'staff']
  );

  res.status(201).json({
    id: result.insertId,
    seller_id: req.user.seller_id,
    name,
    email,
    role: role || 'staff',
  });
}

// GET /api/auth/users  (admin)
async function listUsers(req, res) {
  const [rows] = await db.execute(
    'SELECT id, seller_id, name, email, role, is_active, created_at FROM users WHERE seller_id = ? ORDER BY created_at DESC',
    [req.user.seller_id]
  );
  res.json(rows);
}

// PUT /api/auth/users/:id  (admin)
async function updateUser(req, res) {
  const { name, role, is_active } = req.body;
  const { id } = req.params;

  const [exists] = await db.execute(
    'SELECT id FROM users WHERE id = ? AND seller_id = ? LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!exists[0]) return res.status(404).json({ error: 'User not found' });

  await db.execute(
    'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ? AND seller_id = ?',
    [name ?? null, role ?? null, is_active ?? null, id, req.user.seller_id]
  );

  const [updated] = await db.execute(
    'SELECT id, seller_id, name, email, role, is_active FROM users WHERE id = ? AND seller_id = ?',
    [id, req.user.seller_id]
  );
  res.json(updated[0]);
}

// DELETE /api/auth/users/:id  (admin)
async function deleteUser(req, res) {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id, 10) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const [exists] = await db.execute(
    'SELECT id FROM users WHERE id = ? AND seller_id = ? LIMIT 1',
    [id, req.user.seller_id]
  );
  if (!exists[0]) return res.status(404).json({ error: 'User not found' });

  await db.execute('DELETE FROM users WHERE id = ? AND seller_id = ?', [id, req.user.seller_id]);
  res.json({ message: 'User deleted successfully' });
}

module.exports = {
  login,
  logout,
  me,
  changePassword,
  createUser,
  listUsers,
  updateUser,
  deleteUser,
};
