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
  },
  
    'world-v1-tiles': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // 1. Добавляем систему тайлов в начало файла (после переменных)
    const tilesCode = `
// === СИСТЕМА ТАЙЛОВ ===
const TILE_SIZE = 32;
const MAP_SIZE = 50; // 50x50 тайлов
const WORLD_SIZE = TILE_SIZE * MAP_SIZE;

// Типы тайлов
const TILE = {
  GRASS: 0,
  GRASS_DARK: 1,
  GRASS_LIGHT: 2,
  TREE: 3,
  WATER: 4,
  ROAD: 5,
  SAND: 6
};

// Генерация карты (детерминированная — одинаковая у всех)
function generateMap() {
  const map = [];
  // Простой seeded random
  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Инициализация травой
  for (let y = 0; y < MAP_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const r = rand();
      if (r < 0.6) map[y][x] = TILE.GRASS;
      else if (r < 0.8) map[y][x] = TILE.GRASS_DARK;
      else map[y][x] = TILE.GRASS_LIGHT;
    }
  }

  // Озеро (правый верхний угол)
  for (let y = 3; y < 10; y++) {
    for (let x = 38; x < 48; x++) {
      map[y][x] = TILE.WATER;
    }
  }

  // Лес (левая часть)
  for (let y = 15; y < 35; y++) {
    for (let x = 2; x < 15; x++) {
      if (rand() < 0.4) map[y][x] = TILE.TREE;
    }
  }

  // Лес (низ)
  for (let y = 38; y < 48; y++) {
    for (let x = 15; x < 35; x++) {
      if (rand() < 0.35) map[y][x] = TILE.TREE;
    }
  }

  // Дороги (крест через центр)
  for (let x = 5; x < 45; x++) map[25][x] = TILE.ROAD;
  for (let y = 5; y < 45; y++) map[y][25] = TILE.ROAD;

  // Центральная площадь (где города)
  for (let y = 23; y <= 27; y++) {
    for (let x = 23; x <= 27; x++) {
      map[y][x] = TILE.SAND;
    }
  }

  return map;
}

const GAME_MAP = generateMap();

// Цвета тайлов
const TILE_COLORS = {
  [TILE.GRASS]: '#3a7a2a',
  [TILE.GRASS_DARK]: '#2e6522',
  [TILE.GRASS_LIGHT]: '#4a8a35',
  [TILE.TREE]: '#1a4a15',
  [TILE.WATER]: '#2a5a9a',
  [TILE.ROAD]: '#8a7a4a',
  [TILE.SAND]: '#c8b878'
};

// Отрисовка одного тайла
function drawTile(ctx, tile, px, py, worldX, worldY) {
  // База
  ctx.fillStyle = TILE_COLORS[tile];
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  // Детали
  if (tile === TILE.TREE) {
    // Ствол
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(px + 12, py + 20, 8, 12);
    // Крона
    ctx.fillStyle = '#2a6a20';
    ctx.fillRect(px + 6, py + 4, 20, 20);
    ctx.fillStyle = '#3a8a2a';
    ctx.fillRect(px + 8, py + 6, 16, 16);
  } else if (tile === TILE.WATER) {
    // Блики
    const t = Date.now() / 500;
    const wave = Math.sin(worldX * 0.5 + worldY * 0.3 + t) * 0.5 + 0.5;
    if (wave > 0.7) {
      ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
      ctx.fillRect(px + 4, py + 8, 8, 2);
      ctx.fillRect(px + 16, py + 20, 10, 2);
    }
  } else if (tile === TILE.GRASS || tile === TILE.GRASS_DARK || tile === TILE.GRASS_LIGHT) {
    // Травинки (детерминированные по позиции)
    const h = ((worldX * 7 + worldY * 13) % 4);
    if (h === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(px + 6, py + 10, 2, 4);
      ctx.fillRect(px + 20, py + 18, 2, 4);
    }
  } else if (tile === TILE.ROAD) {
    // Камешки
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(px + 5, py + 8, 3, 3);
    ctx.fillRect(px + 20, py + 22, 4, 4);
  }
}

// Отрисовка всей карты в поле зрения камеры
function drawMap(ctx, camera, canvasWidth, canvasHeight) {
  const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
  const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
  const endX = Math.min(MAP_SIZE, Math.ceil((camera.x + canvasWidth) / TILE_SIZE));
  const endY = Math.min(MAP_SIZE, Math.ceil((camera.y + canvasHeight) / TILE_SIZE));

  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = GAME_MAP[ty][tx];
      const px = tx * TILE_SIZE - camera.x;
      const py = ty * TILE_SIZE - camera.y;
      drawTile(ctx, tile, px, py, tx, ty);
    }
  }
}
`;

    // Вставляем код тайлов после "const keys = {};"
    content = replaceOnce(
      content,
      `const keys = {};`,
      `const keys = {};\n${tilesCode}`,
      'insert tiles code'
    );

    // 2. Заменяем отрисовку фона в draw() на карту
    content = replaceOnce(
      content,
      `  // Фон — трава
  ctx.fillStyle = '#1a4a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Сетка
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const grid = 64;
  const offsetX = -camera.x % grid;
  const offsetY = -camera.y % grid;
  for (let x = offsetX; x < canvas.width; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = offsetY; y < canvas.height; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }`,
      `  // Рисуем карту тайлами
  drawMap(ctx, camera, canvas.width, canvas.height);`,
      'replace background with map'
    );

    // 3. Расширяем границы карты в renderLoop (было 2000×1500)
    content = replaceOnce(
      content,
      `    me.x = Math.max(0, Math.min(2000, me.x + dx));
    me.y = Math.max(0, Math.min(1500, me.y + dy));`,
      `    me.x = Math.max(16, Math.min(WORLD_SIZE - 16, me.x + dx));
    me.y = Math.max(16, Math.min(WORLD_SIZE - 16, me.y + dy));`,
      'expand world bounds'
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