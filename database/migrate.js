'use strict';

/**
 * migrate.js — SellerDesk database migration runner
 *
 * Supports both SQLite (default for zero-config local dev) and MySQL/MariaDB (for production).
 *
 * Usage:  node database/migrate.js [--fresh]
 */

const path = require('path');
const fs = require('fs');

// Load .env from multiple potential locations
const envPaths = [
  process.env.ENV_FILE,
  path.resolve(__dirname, '../Node Express API/.env'),
  path.resolve(__dirname, '../server/.env'),
  path.resolve(__dirname, '../.env'),
].filter(Boolean);

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();

const rawDbClient = (process.env.DB_CLIENT || '').toLowerCase();
const isMysql =
  rawDbClient === 'mysql' ||
  (!rawDbClient && (Boolean(process.env.MYSQLHOST) || Boolean(process.env.MYSQL_URL)));

const DB_CLIENT = isMysql ? 'mysql' : 'sqlite';

async function runSqlite() {
  const Database = require('better-sqlite3');
  const projectRoot = path.resolve(__dirname, '..');
  const rawFile = process.env.SQLITE_FILE || './database/sellerdesk.sqlite';
  const dbFile = path.isAbsolute(rawFile) ? rawFile : path.resolve(projectRoot, rawFile);

  console.log(`[migrate:SQLite] Preparing database file: ${dbFile}`);
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbFile);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const isFresh = process.argv.includes('--fresh');
  const existingUsers = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  let needsReset = isFresh;

  if (existingUsers && !isFresh) {
    const cols = sqlite.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
    if (!cols.includes('seller_id')) {
      console.log('[migrate:SQLite] ⚠️  Legacy single-tenant schema detected. Performing clean migration to multi-tenant schema…');
      needsReset = true;
    }
  }

  if (needsReset) {
    sqlite.pragma('foreign_keys = OFF');
    const existing = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    for (const t of existing) {
      sqlite.prepare(`DROP TABLE IF EXISTS "${t.name}"`).run();
    }
    sqlite.pragma('foreign_keys = ON');
    console.log('[migrate:SQLite] 🔄 Tables cleaned for fresh schema migration.');
  }

  const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
  console.log(`[migrate:SQLite] Reading schema from ${schemaPath}`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[migrate:SQLite] Executing schema…');
  sqlite.exec(schemaSql);

  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => r.name);

  console.log(`[migrate:SQLite] ✅  Migration complete — ${tables.length} tables:`);
  tables.forEach((t) => console.log(`           • ${t}`));
  sqlite.close();
}

async function runMysql() {
  const mysql = require('mysql2/promise');
  const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
  const user = process.env.DB_USER || process.env.MYSQLUSER;
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sellerdesk';

  if (!user && !process.env.MYSQL_URL) {
    console.error('[migrate:MySQL] ❌  DB_USER or MYSQLUSER must be set in .env when DB_CLIENT=mysql');
    process.exit(1);
  }

  console.log('[migrate:MySQL] Connecting to MySQL…');
  const connectionConfig = process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL, multipleStatements: true, charset: 'utf8mb4' }
    : {
        host,
        port,
        user,
        password,
        multipleStatements: true,
        charset: 'utf8mb4',
      };

  const connection = await mysql.createConnection(connectionConfig);

  console.log(`[migrate:MySQL] Creating database if not exists: ${database}`);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.query(`USE \`${database}\``);

  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`[migrate:MySQL] Reading schema from ${schemaPath}`);
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[migrate:MySQL] Executing schema…');
  await connection.query(schemaSql);

  const [rows] = await connection.query('SHOW TABLES');
  const tables = rows.map((r) => Object.values(r)[0]);

  console.log(`[migrate:MySQL] ✅  Migration complete — ${tables.length} tables:`);
  tables.forEach((t) => console.log(`           • ${t}`));
  await connection.end();
}

async function main() {
  console.log(`[migrate] Starting migration with DB_CLIENT = ${DB_CLIENT}`);
  if (DB_CLIENT === 'mysql') {
    await runMysql();
  } else {
    await runSqlite();
  }
}

main().catch((err) => {
  console.error('[migrate] ❌  Error:', err);
  process.exit(1);
});
