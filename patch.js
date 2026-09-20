// patch.js — патчи + авто-пуш в GitHub
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === Утилиты ===

function readFile(relPath) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Файл не найден: ${relPath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`✅ Обновлён: ${relPath}`);
}

function replaceOnce(content, search, replace, label = '') {
  if (!content.includes(search)) {
    console.warn(`⚠️  Не найдено (${label}): ${search.slice(0, 60)}...`);
    return content;
  }
  return content.replace(search, replace);
}

function backup(relPath) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    const backupPath = fullPath + '.backup';
    fs.copyFileSync(fullPath, backupPath);
    console.log(`💾 Бэкап: ${relPath}`);
  }
}

// === Git-авто-пуш ===

function gitPush(commitMessage) {
  try {
    console.log('\n📤 Отправляю на GitHub...');

    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (!status.trim()) {
      console.log('ℹ️  Изменений нет');
      return;
    }

    execSync('git add -A', { stdio: 'inherit' });

    const msg = commitMessage || `Auto-patch: ${new Date().toISOString()}`;
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });

    execSync('git push', { stdio: 'inherit' });

    console.log('✨ Запушено на GitHub!\n');
  } catch (e) {
    console.error('❌ Ошибка пуша:', e.message);
    console.log('💾 Изменения в файлах уже внесены — можешь запушить вручную.\n');
  }
}

// === ПАТЧИ ===

const patches = {
  'fix-player-render': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // 1. Фикс init — добавляем СЕБЯ в players
    content = replaceOnce(
      content,
      `socket.on('init', ({ you, players: others }) => {
    myId = you.id;
    players.clear();
    others.forEach(p => players.set(p.id, p));
    camera.x = you.x - canvas.width / 2;
    camera.y = you.y - canvas.height / 2;
  });`,
      `socket.on('init', ({ you, players: others }) => {
    myId = you.id;
    players.clear();
    players.set(you.id, you); // кладём СЕБЯ
    others.forEach(p => players.set(p.id, p));
    camera.x = you.x - canvas.width / 2;
    camera.y = you.y - canvas.height / 2;
    character = { ...character, ...you };
    console.log('🎮 Инициализирован:', you.name, 'в', you.city);
  });`,
      'init handler'
    );

    // 2. Красивая отрисовка игроков
    content = replaceOnce(
      content,
      `  // Игроки
  players.forEach((p, id) => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;

    // тело
    ctx.fillStyle = id === myId ? '#ffd700' : '#4a4aff';
    ctx.fillRect(sx - 12, sy - 16, 24, 32);

    // голова
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(sx - 8, sy - 28, 16, 16);

    // имя
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, sx, sy - 34);
  });`,
      `  // Игроки (сортируем по Y — кто ниже, тот поверх)
  const sorted = [...players.values()].sort((a, b) => a.y - b.y);

  sorted.forEach((p) => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    const isMe = p.id === myId;

    // тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // подсветка под своим персонажем
    if (isMe) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 16, 18, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // тело
    ctx.fillStyle = isMe ? '#ffd700' : '#4a4aff';
    ctx.fillRect(sx - 12, sy - 16, 24, 32);
    ctx.strokeStyle = isMe ? '#ffaa00' : '#2a2aff';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 12, sy - 16, 24, 32);

    // голова
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(sx - 8, sy - 28, 16, 16);
    ctx.strokeStyle = '#cc9966';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, sy - 28, 16, 16);

    // глаза
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 5, sy - 24, 2, 3);
    ctx.fillRect(sx + 3, sy - 24, 2, 3);

    // имя с обводкой
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(p.name, sx, sy - 38);
    ctx.fillStyle = isMe ? '#ffd700' : '#ffffff';
    ctx.fillText(p.name, sx, sy - 38);

    // уровень
    ctx.font = '11px Arial';
    ctx.fillStyle = '#aaaaff';
    ctx.fillText('Ур.' + (p.level || 1), sx, sy - 24);
  });`,
      'draw players'
    );

    writeFile(file, content);
    return true;
  }
};

// === ЗАПУСК ===

const patchName = process.argv[2];
const noPush = process.argv.includes('--no-push');

if (!patchName) {
  console.log('\n📋 Доступные патчи:');
  Object.keys(patches).forEach(name => console.log(`   • ${name}`));
  console.log('\n🚀 Запуск: node patch.js <имя-патча>');
  console.log('   Флаг --no-push — не пушить на GitHub\n');
  process.exit(0);
}

if (!patches[patchName]) {
  console.error(`❌ Патч не найден: ${patchName}`);
  process.exit(1);
}

console.log(`\n🔧 Применяю патч: ${patchName}\n`);
const ok = patches[patchName]();

if (ok && !noPush) {
  gitPush(`Patch: ${patchName}`);
} else if (ok && noPush) {
  console.log('\n⏸️  Пуш пропущен (--no-push)\n');
}

console.log(`✨ Готово! Обнови страницу (Ctrl+F5)\n`);