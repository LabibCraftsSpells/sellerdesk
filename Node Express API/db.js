'use strict';

const path = require('path');
const fs = require('fs');

const rawDbClient = (process.env.DB_CLIENT || '').toLowerCase();
const isMysql =
  rawDbClient === 'mysql' ||
  (!rawDbClient && (Boolean(process.env.MYSQLHOST) || Boolean(process.env.MYSQL_URL)));

const DB_CLIENT = isMysql ? 'mysql' : 'sqlite';

let dbAdapter;

if (DB_CLIENT === 'mysql') {
  // ── MySQL / MariaDB Implementation ──────────────────────────────────────────
  const mysql = require('mysql2');

  const poolConfig = process.env.MYSQL_URL
    ? {
        uri: process.env.MYSQL_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+06:00',
      }
    : {
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
        user: process.env.DB_USER || process.env.MYSQLUSER || 'sellerdesk',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'sellerdesk',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+06:00',
      };

  const pool = mysql.createPool(poolConfig);
  const promisePool = pool.promise();

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('[DB:MySQL] Connection failed:', err.message);
      return;
    }
    const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sellerdesk';
    console.log('[DB:MySQL] Connected successfully to MySQL database:', dbName);
    connection.release();
  });

  dbAdapter = promisePool;
} else {
  // ── SQLite Implementation (Default for Local Development) ───────────────────
  const Database = require('better-sqlite3');

  const projectRoot = path.resolve(__dirname, '..');
  const rawFile = process.env.SQLITE_FILE || './database/sellerdesk.sqlite';
  const dbFile = path.isAbsolute(rawFile) ? rawFile : path.resolve(projectRoot, rawFile);

  // Ensure parent directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbFile);

  // Performance and safety pragmas with filesystem resilience
  try {
    sqlite.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn(`[DB:SQLite] WAL journal_mode not supported on this filesystem (${err.message}); falling back to DELETE mode.`);
    try {
      sqlite.pragma('journal_mode = DELETE');
    } catch (fallbackErr) {
      console.warn(`[DB:SQLite] journal_mode fallback warning: ${fallbackErr.message}`);
    }
  }

  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');

  console.log(`[DB:SQLite] Connected to local database file: ${dbFile}`);

  /**
   * Translates MySQL-specific SQL idioms into SQLite-compatible SQL
   */
  function normalizeSql(sql) {
    let s = sql;
    // Replace MySQL NOW() with SQLite datetime('now', 'localtime')
    s = s.replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')");
    // Replace MySQL DATE(col) with date(col)
    s = s.replace(/\bDATE\(/gi, 'date(');
    return s;
  }

  /**
   * Cleans parameters: converts booleans to 1/0, undefined to null
   */
  function cleanParams(params) {
    if (!params || !Array.isArray(params)) return [];
    return params.map((v) => {
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (v === undefined) return null;
      return v;
    });
  }

  async function execute(sql, params = []) {
    const query = normalizeSql(sql.trim());
    const bound = cleanParams(params);
    const isSelect = /^(SELECT|PRAGMA|EXPLAIN|WITH)/i.test(query);

    try {
      const stmt = sqlite.prepare(query);
      if (isSelect) {
        const rows = stmt.all(...bound);
        return [rows, []];
      } else {
        const info = stmt.run(...bound);
        const header = {
          insertId: Number(info.lastInsertRowid),
          affectedRows: info.changes,
          changedRows: info.changes,
        };
        return [header, []];
      }
    } catch (err) {
      throw err;
    }
  }

  async function getConnection() {
    return {
      beginTransaction: async () => {
        try {
          sqlite.prepare('BEGIN IMMEDIATE').run();
        } catch (e) {
          // If already in a transaction, ignore
        }
      },
      commit: async () => {
        try {
          sqlite.prepare('COMMIT').run();
        } catch (e) {
          // Ignore
        }
      },
      rollback: async () => {
        try {
          sqlite.prepare('ROLLBACK').run();
        } catch (e) {
          // Ignore
        }
      },
      execute: async (sql, params) => execute(sql, params),
      query: async (sql, params) => execute(sql, params),
      release: () => {},
    };
  }

  dbAdapter = {
    execute,
    query: execute,
    getConnection,
    _sqlite: sqlite,
  };
}

module.exports = dbAdapter;
