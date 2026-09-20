// install.js — установщик модулей Аркадии
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_DIR = path.join(__dirname, 'install');
const MAIN_FILE = 'client/js/main.js';

function readFile(rel) {
  const full = path.join(__dirname, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function writeFile(rel, content) {
  const full = path.join(__dirname, rel);
  fs.writeFileSync(full, content, 'utf-8');
  console.log(`  ✅ ${rel}`);
}

function backup(rel) {
  const full = path.join(__dirname, rel);
  if (fs.existsSync(full)) {
    fs.copyFileSync(full, full + '.backup');
    console.log(`  💾 Бэкап: ${rel}.backup`);
  }
}

function insertBefore(content, anchor, code, label) {
  if (!content.includes(anchor)) {
    console.warn(`  ⚠️  Якорь не найден (${label})`);
    return content;
  }
  if (content.split(anchor).length > 2) {
    console.warn(`  ⚠️  Якорь найден несколько раз (${label})`);
  }
  return content.replace(anchor, code + '\n\n' + anchor);
}

function hasMarker(content, marker) {
  return content.includes(`// === MODULE: ${marker} ===`);
}

function addMarker(content, marker) {
  return content.replace(
    '// === API и состояние ===',
    `// === MODULE: ${marker} ===\n// === API и состояние ===`
  );
}

function gitPush(message) {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('ℹ️  Изменений нет\n');
      return;
    }
    console.log('\n📤 Пуш на GitHub...');
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('✨ Запушено!\n');
  } catch (e) {
    console.error('❌ Ошибка пуша:', e.message);
  }
}

const name = process.argv[2];

if (!name) {
  const files = fs.existsSync(INSTALL_DIR)
    ? fs.readdirSync(INSTALL_DIR).filter(f => f.endsWith('.js')).sort()
    : [];
  console.log('\n📋 Доступные модули:');
  files.forEach(f => console.log(`   • ${f.replace('.js', '')}`));
  console.log('\n🚀 Запуск:');
  console.log('   node install.js <имя>');
  console.log('   node install.js all\n');
  process.exit(0);
}

async function runOne(fileName) {
  const fullPath = path.join(INSTALL_DIR, fileName);
  const mod = await import(pathToFileURL(fullPath).href);
  const install = mod.default;
  if (typeof install !== 'function') {
    console.error(`❌ ${fileName}: нет default export`);
    return false;
  }
  console.log(`\n🔧 ${fileName}`);
  return await install({
    readFile, writeFile, backup, insertBefore,
    hasMarker, addMarker, MAIN_FILE
  });
}

if (name === 'all') {
  const files = fs.readdirSync(INSTALL_DIR).filter(f => f.endsWith('.js')).sort();
  let changed = false;
  for (const f of files) {
    const c = await runOne(f);
    if (c) changed = true;
  }
  if (changed) gitPush(`Install all modules`);
} else {
  const fileName = name.endsWith('.js') ? name : `${name}.js`;
  const full = path.join(INSTALL_DIR, fileName);
  if (!fs.existsSync(full)) {
    console.error(`❌ Не найдено: ${fileName}`);
    process.exit(1);
  }
  const changed = await runOne(fileName);
  if (changed) gitPush(`Install: ${name}`);
}

console.log('✨ Готово!\n');