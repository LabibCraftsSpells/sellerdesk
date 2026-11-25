'use strict';

/**
 * setup.js — Zero-friction clean installation wizard for SellerDesk
 *
 * Installs dependencies for server & client, then runs
 * migrations and seeds the database.
 *
 * Usage:  node scripts/setup.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOTAL_STEPS = 4;

// ── ANSI color constants ───────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
};

const fmt = {
  info:    (msg) => `${c.cyan}${c.bold}  ℹ  ${c.reset}${msg}`,
  step:    (n, total, msg) => `\n${c.blue}${c.bold}[${n}/${total}]${c.reset} ${c.bold}${msg}${c.reset}`,
  ok:      (msg) => `${c.green}${c.bold}  ✔  ${c.reset}${msg}`,
  warn:    (msg) => `${c.yellow}${c.bold}  ⚠  ${c.reset}${msg}`,
  err:     (msg) => `${c.red}${c.bold}  ✘  ${c.reset}${msg}`,
  divider: ()    => `${c.dim}${'─'.repeat(60)}${c.reset}`,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

function run(cmd, cwd = ROOT, label = '') {
  if (label) console.log(fmt.info(label));
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(fmt.err(`Command failed: ${cmd}`));
    console.error(fmt.err(err.message));
    process.exit(1);
  }
}

function checkEnv() {
  const envFile = path.join(ROOT, '.env');
  const apiEnvFile = path.join(ROOT, 'Node Express API', '.env');
  const apiEnvExample = path.join(ROOT, 'Node Express API', '.env.example');

  if (!fs.existsSync(envFile) && !fs.existsSync(apiEnvFile)) {
    console.warn(fmt.warn('.env not found — copying Node Express API/.env.example → .env'));
    if (fs.existsSync(apiEnvExample)) {
      fs.copyFileSync(apiEnvExample, envFile);
    }
    console.log(fmt.ok('Defaulting to SQLite zero-config mode. (Edit .env if you wish to use MySQL instead)'));
  } else {
    console.log(fmt.ok('.env file found'));
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
console.log('\n' + c.cyan + c.bold +
  '╔══════════════════════════════════════╗\n' +
  '║      SellerDesk — Project Setup      ║\n' +
  '╚══════════════════════════════════════╝' +
  c.reset + '\n');

console.log(fmt.divider());
checkEnv();
console.log(fmt.divider());

const serverDir = fs.existsSync(path.join(ROOT, 'Node Express API')) ? path.join(ROOT, 'Node Express API') : path.join(ROOT, 'server');
const clientDir = fs.existsSync(path.join(ROOT, 'React Vite Web')) ? path.join(ROOT, 'React Vite Web') : path.join(ROOT, 'client');

// Step 1 — Server dependencies
console.log(fmt.step(1, TOTAL_STEPS, 'Installing server dependencies…'));
run('npm install', serverDir);
console.log(fmt.ok('Server dependencies installed'));

// Step 2 — Client dependencies
console.log(fmt.step(2, TOTAL_STEPS, 'Installing client dependencies…'));
run('npm install', clientDir);
console.log(fmt.ok('Client dependencies installed'));

// Step 3 — Database migrations
console.log(fmt.step(3, TOTAL_STEPS, 'Running database migrations…'));
run('node database/migrate.js', ROOT, 'Applying schema…');
console.log(fmt.ok('Migrations complete'));

// Step 4 — Seed demo data
console.log(fmt.step(4, TOTAL_STEPS, 'Seeding demo data…'));
run('node database/seed.js', ROOT, 'Loading demo data…');
console.log(fmt.ok('Database seeded'));

// ── Done ───────────────────────────────────────────────────────────────────────
console.log('\n' + fmt.divider());
console.log(c.green + c.bold + '\n  🎉  Setup complete!' + c.reset);
console.log(fmt.info('Start development with:  ' + c.cyan + 'npm run dev' + c.reset));
console.log(fmt.info('Frontend → ' + c.cyan + 'http://localhost:5173' + c.reset));
console.log(fmt.info('Backend  → ' + c.cyan + 'http://localhost:5001' + c.reset));
console.log('\n' + fmt.divider() + '\n');
