'use strict';

/**
 * package-release.js — SellerDesk Marketplace Release Packager
 *
 * Copies clean, buyer-ready source into vibe96-submission/source/
 * Generates verified distributable archive meeting exact Vibe96 portal requirements.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SUBMISSION_DIR = path.join(ROOT, 'vibe96-submission');
const SOURCE_DIR = path.join(SUBMISSION_DIR, 'source');
const ZIP_OUTPUT = path.join(SUBMISSION_DIR, 'sellerdesk-v1.0.0-source.zip');

console.log('══════════════════════════════════════════════════════════════');
console.log('📦 PACKAGING SELLERDESK MARKETPLACE RELEASE');
console.log('══════════════════════════════════════════════════════════════\n');

// 1. Clean staging directory
if (fs.existsSync(SOURCE_DIR)) {
  fs.rmSync(SOURCE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(SOURCE_DIR, { recursive: true });

// 2. Documentation files to copy into vibe96-submission/ and source/
const docs = [
  'README.md',
  'HowToSetup.md',
  'LICENSE-NOTE.md',
  'CLAUDE.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'DEPLOYMENT.md',
  'SECURITY.md',
  'THIRD_PARTY_LICENSES.md',
  'VIBE96_LISTING.md',
  'TEST_REPORT.md',
  'SECURITY_AUDIT.md',
  'RELEASE_CHECKLIST.md',
];

console.log('1. Copying documentation into submission directory...');
for (const doc of docs) {
  const src = path.join(ROOT, doc);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(SUBMISSION_DIR, doc));
    fs.copyFileSync(src, path.join(SOURCE_DIR, doc));
    console.log(`   ✔ ${doc}`);
  } else {
    console.warn(`   ⚠ Missing: ${doc}`);
  }
}

// 3. Root configuration files
const rootFiles = [
  'package.json',
  'package-lock.json',
  '.gitignore',
  'Dockerfile',
  'docker-compose.yml',
];

console.log('\n2. Copying root manifests and deployment configurations...');
for (const f of rootFiles) {
  const src = path.join(ROOT, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(SOURCE_DIR, f));
    console.log(`   ✔ ${f}`);
  }
}

// 4. Source directories (clean without node_modules, sqlite runtime, or dist)
const sourceDirs = [
  'Node Express API',
  'React Vite Web',
  'database',
  'scripts',
];

console.log('\n3. Copying clean application source into vibe96-submission/source/...');
for (const dir of sourceDirs) {
  const srcDir = path.join(ROOT, dir);
  const destDir = path.join(SOURCE_DIR, dir);
  fs.cpSync(srcDir, destDir, {
    recursive: true,
    filter: (src) => {
      const parts = src.split(path.sep);
      if (parts.includes('node_modules') || parts.includes('dist')) return false;
      if (parts.includes('.git') || parts.includes('uploads')) return false;
      if (src.endsWith('.sqlite') || src.endsWith('.sqlite-wal') || src.endsWith('.sqlite-shm')) return false;
      if (src.endsWith('.DS_Store') || src.endsWith('.log')) return false;
      // Do not copy .env files with secrets into clean source
      if (path.basename(src) === '.env') return false;
      return true;
    },
  });
  console.log(`   ✔ ${dir}/ (clean)`);
}

// 5. Create backwards-compatible symlinks inside clean source
try {
  process.chdir(SOURCE_DIR);
  execSync('ln -s "Node Express API" server');
  execSync('ln -s "React Vite Web" client');
  console.log('   ✔ server & client symlinks created');
} catch (e) {
  console.warn('   ⚠ Symlink creation notice:', e.message);
} finally {
  process.chdir(ROOT);
}

// 6. Verify required Vibe96 checklist files exist in source
console.log('\n4. Verifying required Vibe96 checklist files...');
const requiredFiles = [
  'README.md',
  'HowToSetup.md',
  'LICENSE-NOTE.md',
  'database/schema.sql',
  'database/seed.sql',
  'Node Express API/.env.example',
  'Node Express API/package-lock.json',
  'React Vite Web/package-lock.json',
];

let allPresent = true;
for (const rf of requiredFiles) {
  const p = path.join(SOURCE_DIR, rf);
  if (fs.existsSync(p)) {
    console.log(`   ✔ ${rf}`);
  } else {
    console.error(`   ❌ MISSING REQUIRED FILE: ${rf}`);
    allPresent = false;
  }
}

if (!allPresent) {
  console.error('\n❌ Packaging halted: Missing required files!');
  process.exit(1);
}

// 7. Verify exactly one .env.example exists in the archive
const findEnvExamples = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      results = results.concat(findEnvExamples(fullPath));
    } else if (file === '.env.example') {
      results.push(path.relative(SOURCE_DIR, fullPath));
    }
  }
  return results;
};

const envExamples = findEnvExamples(SOURCE_DIR);
console.log(`\n5. Checking .env.example count: found ${envExamples.length} (${envExamples.join(', ')})`);
if (envExamples.length !== 1 || envExamples[0] !== path.join('Node Express API', '.env.example')) {
  console.error(`❌ Exactly ONE .env.example required in 'Node Express API/.env.example'. Found:`, envExamples);
  process.exit(1);
}
console.log('   ✔ Exactly one .env.example verified in API directory');

// 8. Generate distributable ZIP archive
console.log('\n6. Generating distributable ZIP archive...');
if (fs.existsSync(ZIP_OUTPUT)) {
  fs.unlinkSync(ZIP_OUTPUT);
}

try {
  execSync(`cd "${SOURCE_DIR}" && zip -r -y -q "${ZIP_OUTPUT}" . -x "*.DS_Store"`, { stdio: 'inherit' });
  const stat = fs.statSync(ZIP_OUTPUT);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✔ Generated: ${ZIP_OUTPUT} (${sizeMb} MB)`);
} catch (err) {
  console.error('   ❌ ZIP creation error:', err.message);
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════════════════════');
console.log('🎉 RELEASE PACKAGING COMPLETE — 100% VIBE96 COMPLIANT');
console.log('══════════════════════════════════════════════════════════════');
