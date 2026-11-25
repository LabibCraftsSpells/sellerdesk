'use strict';

/**
 * start-production.js — Production entrypoint for SellerDesk
 *
 * Automatically checks and runs migrations, seeds demo merchants if empty or requested,
 * then boots the production Express server.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

// Load environment
const envPaths = [
  process.env.ENV_FILE,
  path.join(ROOT, 'Node Express API/.env'),
  path.join(ROOT, '.env'),
].filter(Boolean);

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();

console.log('══════════════════════════════════════════════════════════════');
console.log('🚀 SELLERDESK PRODUCTION INITIALIZATION');
console.log('══════════════════════════════════════════════════════════════');

async function start() {
  // 1. Run database migrations with full error capture
  try {
    console.log('\n[1/3] Running database migrations…');
    const { runMigrations } = require('../database/migrate');
    await runMigrations();
    console.log('✔ Migrations completed successfully.');
  } catch (err) {
    console.error('\n❌ MIGRATION FAILED WITH FULL ERROR DETAILS:');
    console.error(err.stack || err);
    if (err.code) console.error('Error Code:', err.code);
    process.exit(1);
  }

  // 2. Run seed if AUTO_SEED is true or SEED_DEMO is true
  const shouldSeed =
    process.env.AUTO_SEED === 'true' ||
    process.env.SEED_DEMO === 'true' ||
    process.env.DEMO_MODE === 'true';

  if (shouldSeed) {
    try {
      console.log('\n[2/3] Seeding demo merchant data (AUTO_SEED enabled)…');
      const { runSeed } = require('../database/seed');
      await runSeed();
      console.log('✔ Demo seeding completed successfully.');
    } catch (err) {
      console.warn('⚠️ Demo seeding notice:', err.stack || err.message);
    }
  } else {
    console.log('\n[2/3] Skipping demo seed (set AUTO_SEED=true to seed on launch).');
  }

  // 3. Launch Express server
  console.log('\n[3/3] Starting SellerDesk application server…');
  const serverEntry = path.join(ROOT, 'Node Express API/index.js');

  const child = spawn(process.execPath, [serverEntry], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[Server] Exited with signal ${signal}`);
    } else if (code !== 0) {
      console.error(`[Server] Exited with code ${code}`);
      process.exit(code);
    }
  });
}

start().catch((err) => {
  console.error('[start-production] Unexpected startup crash:', err);
  process.exit(1);
});
