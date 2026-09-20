// install.js — установщик патчей для Аркадии
// Запуск: node install.js <имя-установщика>
// Или:    node install.js all — применить все

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTALL_DIR = path.join(__dirname, 'install');

// === Утилиты ===

function readFile(relPath) {
  const full = path.join(__dirname, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function writeFile(relPath, content) {
  const full = path.join(__dirname, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  console.log(`  ✅ ${relPath}`);
}

function replaceOnce(content, search, replace, label = '') {
  if (!content.includes(search)) {
    console.warn(`  ⚠️  Не найдено (${label}): ${search.slice(0, 50)}...`);
    return content;
  }
  return content.replace(search, replace);
}

function backup(relPath) {
  const full = path.join(__dirname, relPath);
  if (fs.existsSync(full)) {
    fs.copyFileSync(full, full + '.backup');
  }
}

// === Git-пуш ===

function gitPush(message) {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('ℹ️  Изменений нет, пуш не нужен\n');
      return;
    }
    console.log('\n📤 Пуш на GitHub...');
    execSync('git add -A', { stdio: 'inherit' });
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('✨ Запушено!\n');
  } catch (e) {
    console.error('❌ Ошибка пуша:', e.message);
    console.log('💾 Изменения в файлах есть — запушь вручную\n');
  }
}

// === Запуск установщиков ===

const name = process.argv[2];

if (!name) {
  const files = fs.existsSync(INSTALL_DIR) 
    ? fs.readdirSync(INSTALL_DIR).filter(f => f.endsWith('.js')).sort()
    : [];
  console.log('\n📋 Доступные установщики:');
  files.forEach(f => console.log(`   • ${f.replace('.js', '')}`));
  console.log('\n🚀 Запуск:');
  console.log('   node install.js <имя>');
  console.log('   node install.js all\n');
  process.exit(0);
}

async function runInstaller(fileName) {
  const fullPath = path.join(INSTALL_DIR, fileName);
  // ⚡ ГЛАВНЫЙ ФИКС: превращаем путь в file:// URL для Windows
  const fileUrl = pathToFileURL(fullPath).href;
  
  const mod = await import(fileUrl);
  const install = mod.default;
  if (typeof install !== 'function') {
    console.error(`❌ ${fileName} не экспортирует default function`);
    return false;
  }
  console.log(`\n🔧 ${fileName}`);
  const changed = await install({ readFile, writeFile, replaceOnce, backup, __dirname });
  return changed;
}

if (name === 'all') {
  const files = fs.readdirSync(INSTALL_DIR).filter(f => f.endsWith('.js')).sort();
  let anyChanged = false;
  for (const f of files) {
    const changed = await runInstaller(f);
    if (changed) anyChanged = true;
  }
  if (anyChanged) gitPush(`Install: all (${files.length} модулей)`);
} else {
  const fileName = name.endsWith('.js') ? name : `${name}.js`;
  const fullPath = path.join(INSTALL_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Установщик не найден: ${fileName}`);
    console.log('📋 Доступные:');
    fs.readdirSync(INSTALL_DIR).forEach(f => console.log(`   • ${f}`));
    process.exit(1);
  }
  const changed = await runInstaller(fileName);
  if (changed) gitPush(`Install: ${name}`);
}

console.log('✨ Готово!\n');