'use strict';

const path = require('path');
const fs = require('fs');

// Load environment variables
const envPaths = [
  process.env.ENV_FILE,
  path.resolve(__dirname, '../Node Express API/.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
].filter(Boolean);

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const codRoutes = require('./routes/cod');
const stockRoutes = require('./routes/stock');

const app = express();

// ── Security Headers (Configured for Vibe96 Demo Embedding) ───────────────────
app.use(
  helmet({
    // Disables X-Frame-Options: SAMEORIGIN to allow embedding by Vibe96 marketplace
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Explicitly allow embedding by self and Vibe96 portal domains (no wildcard)
        'frame-ancestors': ["'self'", 'https://vibe96.com', 'https://*.vibe96.com'],
        // Allow loading the Vibe96 demo analytics script
        'script-src': ["'self'", "'unsafe-inline'", 'https://vibe96.com'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      },
    },
  })
);

// Ensure no residual X-Frame-Options header blocks framing in any reverse proxy
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});

// ── CORS Configuration ────────────────────────────────────────────────────────
const configuredOrigin = process.env.CORS_ORIGIN;
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check against configured origin or local defaults
      if (
        defaultOrigins.includes(origin) ||
        (configuredOrigin && origin === configuredOrigin) ||
        origin === 'https://vibe96.com' ||
        origin.endsWith('.vibe96.com')
      ) {
        return callback(null, true);
      }

      // If running same-origin in production, allow it
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_RATE_LIMIT
    ? parseInt(process.env.LOGIN_RATE_LIMIT, 10)
    : process.env.NODE_ENV === 'production'
    ? 120 // Generous limit for marketplace demo evaluations
    : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', loginLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cod', codRoutes);
app.use('/api/stock', stockRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Serve React Vite Build in Production ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const candidatePaths = [
    path.resolve(__dirname, '../React Vite Web/dist'),
    path.resolve(__dirname, '../client/dist'),
    path.resolve(__dirname, './dist'),
    path.resolve(__dirname, '../dist'),
  ];

  const clientDist = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

  if (clientDist) {
    app.use(express.static(clientDist));
    // SPA fallback: redirect all non-API GET requests to index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    console.warn('[Production Warning] Compiled frontend bundle (dist/index.html) not found in candidate paths!');
  }
}

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your_super_secret_jwt_key')) {
      console.warn('[SECURITY WARNING] Using placeholder JWT_SECRET in production! Please set a strong, random JWT_SECRET in environment variables.');
    }
  }

  const DEFAULT_PORT = parseInt(process.env.PORT || '5001', 10);
  const HOST = '0.0.0.0';
  const server = app.listen(DEFAULT_PORT, HOST, () => {
    console.log(`[Server] SellerDesk API running on ${HOST}:${DEFAULT_PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = DEFAULT_PORT + 1;
      console.warn(`[Server] Port ${DEFAULT_PORT} is in use. Retrying on port ${fallbackPort}...`);
      app.listen(fallbackPort, HOST, () => {
        console.log(`[Server] SellerDesk API running on ${HOST}:${fallbackPort} (${process.env.NODE_ENV || 'development'})`);
      });
    } else {
      throw err;
    }
  });
}

module.exports = app;
