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
  },
  
    'world-v1-cities': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // 1. Определение городов — вставляем после GAME_MAP
    content = replaceOnce(
      content,
      `const GAME_MAP = generateMap();`,
      `const GAME_MAP = generateMap();

// === ГОРОДА ===
const CITIES = [
  { name: 'Валенсия', x: 25, y: 25, size: 5, color: '#d4af37', type: 'trade' },
  { name: 'Драконье Логово', x: 25, y: 8, size: 4, color: '#c0392b', type: 'military' },
  { name: 'Эльфийская Роща', x: 25, y: 42, size: 4, color: '#27ae60', type: 'magic' }
];

// Проверка: находится ли игрок в городе
function getCurrentCity(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    if (tileX >= city.x - half && tileX <= city.x + half &&
        tileY >= city.y - half && tileY <= city.y + half) {
      return city;
    }
  }
  return null;
}`,
      'add cities data'
    );

    // 2. Отрисовка городов — вставляем функцию после drawMap
    content = replaceOnce(
      content,
      `// Отрисовка всей карты в поле зрения камеры
function drawMap(ctx, camera, canvasWidth, canvasHeight) {`,
      `// Отрисовка одного города
function drawCity(ctx, city, camera) {
  const half = Math.floor(city.size / 2);
  const x = (city.x - half) * TILE_SIZE - camera.x;
  const y = (city.y - half) * TILE_SIZE - camera.y;
  const w = city.size * TILE_SIZE;
  const h = city.size * TILE_SIZE;

  // Земля города (каменная площадь)
  ctx.fillStyle = '#8a8a7a';
  ctx.fillRect(x, y, w, h);

  // Плитка
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= city.size; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * TILE_SIZE, y);
    ctx.lineTo(x + i * TILE_SIZE, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + i * TILE_SIZE);
    ctx.lineTo(x + w, y + i * TILE_SIZE);
    ctx.stroke();
  }

  // Стены (по периметру)
  ctx.fillStyle = city.color;
  ctx.fillRect(x, y, w, 4);
  ctx.fillRect(x, y + h - 4, w, 4);
  ctx.fillRect(x, y, 4, h);
  ctx.fillRect(x + w - 4, y, 4, h);

  // Ворота (снизу)
  const gateW = TILE_SIZE;
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x + w / 2 - gateW / 2, y + h - 6, gateW, 6);

  // Домики внутри
  const houses = [
    { dx: 0.2, dy: 0.25, w: 0.25, h: 0.2, roof: '#8B4513' },
    { dx: 0.55, dy: 0.25, w: 0.25, h: 0.2, roof: '#a0522d' },
    { dx: 0.2, dy: 0.55, w: 0.25, h: 0.2, roof: '#a0522d' },
    { dx: 0.55, dy: 0.55, w: 0.25, h: 0.2, roof: '#8B4513' }
  ];
  houses.forEach(house => {
    const hx = x + house.dx * w;
    const hy = y + house.dy * h;
    const hw = house.w * w;
    const hh = house.h * h;
    // Стены домика
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(hx, hy + hh * 0.4, hw, hh * 0.6);
    // Крыша
    ctx.fillStyle = house.roof;
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy + hh * 0.4);
    ctx.lineTo(hx + hw / 2, hy);
    ctx.lineTo(hx + hw + 2, hy + hh * 0.4);
    ctx.closePath();
    ctx.fill();
    // Дверь
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(hx + hw / 2 - 3, hy + hh * 0.75, 6, hh * 0.25);
  });

  // Название города над зоной
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.strokeText(city.name, x + w / 2, y - 8);
  ctx.fillStyle = city.color;
  ctx.fillText(city.name, x + w / 2, y - 8);
}

// Отрисовка всей карты в поле зрения камеры
function drawMap(ctx, camera, canvasWidth, canvasHeight) {`,
      'add drawCity function'
    );

    // 3. Вызов drawCity в drawMap после тайлов
    content = replaceOnce(
      content,
      `  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = GAME_MAP[ty][tx];
      const px = tx * TILE_SIZE - camera.x;
      const py = ty * TILE_SIZE - camera.y;
      drawTile(ctx, tile, px, py, tx, ty);
    }
  }
}`,
      `  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = GAME_MAP[ty][tx];
      const px = tx * TILE_SIZE - camera.x;
      const py = ty * TILE_SIZE - camera.y;
      drawTile(ctx, tile, px, py, tx, ty);
    }
  }

  // Рисуем города
  CITIES.forEach(city => drawCity(ctx, city, camera));
}`,
      'call drawCity'
    );

    // 4. Обновляем HUD города — показываем текущий город
    content = replaceOnce(
      content,
      `  document.getElementById('cityInfo').textContent = \`🏰 \${character.city}\`;`,
      `  document.getElementById('cityInfo').textContent = \`🏰 \${character.city}\`;`,
      'city HUD (skip)'
    );

    // 5. Расширяем города — затираем деревья и воду в зоне городов
    content = replaceOnce(
      content,
      `const GAME_MAP = generateMap();`,
      `const GAME_MAP = generateMap();

// Очищаем зоны городов от деревьев/воды
function clearCityZones(map) {
  const citiesRaw = [
    { x: 25, y: 25, size: 5 },
    { x: 25, y: 8, size: 4 },
    { x: 25, y: 42, size: 4 }
  ];
  citiesRaw.forEach(c => {
    const half = Math.floor(c.size / 2) + 1;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const tx = c.x + dx;
        const ty = c.y + dy;
        if (ty >= 0 && ty < MAP_SIZE && tx >= 0 && tx < MAP_SIZE) {
          if (map[ty][tx] === TILE.TREE || map[ty][tx] === TILE.WATER) {
            map[ty][tx] = TILE.GRASS_LIGHT;
          }
        }
      }
    }
  });
}
clearCityZones(GAME_MAP);`,
      'clear city zones'
    );

    writeFile(file, content);
    return true;
  },
  
    'city-fix': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // 1. ФИКС: getCityAt — расширяем зону, включая ворота
    content = replaceOnce(
      content,
      `function getCityAt(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    if (tx >= city.tileX - half && tx <= city.tileX + half &&
        ty >= city.tileY - half && ty <= city.tileY + half) {
      return city;
    }
  }
  return null;
}`,
      `function getCityAt(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    // Основная зона города + ворота снизу
    if (tx >= city.tileX - half && tx <= city.tileX + half &&
        ty >= city.tileY - half && ty <= city.tileY + half + 1) {
      return city;
    }
  }
  return null;
}`,
      'expand getCityAt'
    );

    // 2. ФИКС: enterCity — проверяем и ворота, и город
    content = replaceOnce(
      content,
      `function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;
  const city = getCityAt(me.x, me.y);
  if (!city) return;

  currentCity = city;
  currentScene = 'city';
  hideEnterButton();

  // При входе возвращаемся в центр canvas
  console.log(\`🏰 Вошли в \${city.name}\`);
}`,
      `function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;
  const city = getCityAt(me.x, me.y);
  if (!city) {
    console.warn('❌ Не найдена зона города рядом');
    return;
  }

  currentCity = city;
  currentScene = 'city';
  hideEnterButton();
  console.log(\`🏰 Вошли в \${city.name}\`);
}`,
      'fix enterCity'
    );

    // 3. ДОБАВЛЯЕМ: клик по карте для движения
    content = replaceOnce(
      content,
      `  // Клик по canvas — для интерьера (выход через ворота)
  canvas.addEventListener('click', e => {
    if (currentScene !== 'city') return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Клик по нижней зоне (ворота)
    if (my > canvas.height - 40) {
      exitCity();
      return;
    }

    // Клик по зданиям
    CITY_BUILDINGS.forEach(b => {
      const bx = b.tileX * TILE_SIZE;
      const by = b.tileY * TILE_SIZE;
      const bw = TILE_SIZE * 3;
      const bh = TILE_SIZE * 2.5;
      if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
        console.log(\`🖱️ Клик по: \${b.name}\`);
        alert(\`\${b.icon} \${b.name}\\n\\n(меню скоро будет)\`);
      }
    });
  });`,
      `  // Клик по canvas
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // === СЦЕНА: ИНТЕРЬЕР ГОРОДА ===
    if (currentScene === 'city') {
      // Клик по нижней зоне (ворота)
      if (my > canvas.height - 40) {
        exitCity();
        return;
      }

      // Клик по зданиям
      CITY_BUILDINGS.forEach(b => {
        const bx = b.tileX * TILE_SIZE;
        const by = b.tileY * TILE_SIZE;
        const bw = TILE_SIZE * 3;
        const bh = TILE_SIZE * 2.5;
        if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
          console.log(\`🖱️ Клик по: \${b.name}\`);
          alert(\`\${b.icon} \${b.name}\\n\\n(меню скоро будет)\`);
        }
      });
      return;
    }

    // === СЦЕНА: МИР ===
    // Клик по карте → шаг в сторону клика
    const me = players.get(myId) || character;
    if (!me) return;

    const clickWorldX = mx + camera.x;
    const clickWorldY = my + camera.y;

    // Разница в тайлах между кликом и персонажем
    const dxTiles = Math.round((clickWorldX - me.x) / TILE_SIZE);
    const dyTiles = Math.round((clickWorldY - me.y) / TILE_SIZE);

    // Идём сначала по X, потом по Y (простой pathfinding)
    if (Math.abs(dxTiles) >= Math.abs(dyTiles)) {
      if (dxTiles > 0) tryMove(1, 0);
      else if (dxTiles < 0) tryMove(-1, 0);
      else if (dyTiles > 0) tryMove(0, 1);
      else if (dyTiles < 0) tryMove(0, -1);
    } else {
      if (dyTiles > 0) tryMove(0, 1);
      else if (dyTiles < 0) tryMove(0, -1);
      else if (dxTiles > 0) tryMove(1, 0);
      else if (dxTiles < 0) tryMove(-1, 0);
    }
  });`,
      'add click movement'
    );

    // 4. УЛУЧШАЕМ визуал города на карте: стены по периметру
    content = replaceOnce(
      content,
      `  // Названия городов над их зонами
  CITIES.forEach(city => {
    const half = Math.floor(city.size / 2);
    const cx = city.tileX * TILE_SIZE - camera.x;
    const cy = city.tileY * TILE_SIZE - camera.y - half * TILE_SIZE - 10;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(city.name, cx, cy);
    ctx.fillStyle = city.color;
    ctx.fillText(city.name, cx, cy);
  });`,
      `  // Города: стены, ворота, подписи
  CITIES.forEach(city => {
    const half = Math.floor(city.size / 2);
    const gx = (city.tileX - half) * TILE_SIZE - camera.x;
    const gy = (city.tileY - half) * TILE_SIZE - camera.y;
    const gw = city.size * TILE_SIZE;
    const gh = city.size * TILE_SIZE;

    // Стены (цвет города, толщина 6px)
    ctx.fillStyle = city.color;
    ctx.fillRect(gx, gy, gw, 6);
    ctx.fillRect(gx, gy + gh - 6, gw, 6);
    ctx.fillRect(gx, gy, 6, gh);
    ctx.fillRect(gx + gw - 6, gy, 6, gh);

    // Башни по углам
    const towerSize = 12;
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(gx - 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx - 3, gy + gh - towerSize + 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy + gh - towerSize + 3, towerSize, towerSize);

    // Проём ворот (снизу по центру — открытая часть)
    ctx.fillStyle = TILE_COLORS[TILE.CITY_GROUND];
    ctx.fillRect(gx + gw / 2 - TILE_SIZE / 2, gy + gh - 6, TILE_SIZE, 6);

    // Название
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(city.name, gx + gw / 2, gy - 10);
    ctx.fillStyle = city.color;
    ctx.fillText(city.name, gx + gw / 2, gy - 10);
  });`,
      'improve city visuals'
    );

    // 5. Показываем кнопку входа не только на воротах, но и рядом с городом
    content = replaceOnce(
      content,
      `    // Проверка ворот
    if (isOnGate(me.x, me.y)) {
      showEnterButton();
    } else {
      hideEnterButton();
    }`,
      `    // Проверка: стоим ли на воротах или в зоне города
    const city = getCityAt(me.x, me.y);
    if (city) {
      showEnterButton();
    } else {
      hideEnterButton();
    }`,
      'fix enter button visibility'
    );

    writeFile(file, content);
    return true;
  },
  
    'click-move': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // === 1. Убираем WASD — заменяем renderLoop ===
    content = replaceOnce(
      content,
      `function renderLoop(t) {
  // Шаг по клеткам с задержкой
  if (t - lastMoveTime > MOVE_COOLDOWN) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    else if (keys['s'] || keys['arrowdown']) dy = 1;
    else if (keys['a'] || keys['arrowleft']) dx = -1;
    else if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx || dy) {
      tryMove(dx, dy);
      lastMoveTime = t;
    }
  }

  // Камера следит за игроком только в мире
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;
    }
  }

  draw();
  requestAnimationFrame(renderLoop);
}`,
      `function renderLoop(t) {
  const dt = t - (renderLoop.lastT || t);
  renderLoop.lastT = t;

  // === ПЛАВНОЕ ДВИЖЕНИЕ В ГОРОДЕ ===
  if (currentScene === 'city') {
    const me = players.get(myId) || character;
    if (me) {
      // Плавное перемещение к целевой точке
      if (me.targetX !== undefined && me.targetY !== undefined) {
        const speed = 0.15; // 15% пути за кадр
        const dx = me.targetX - me.x;
        const dy = me.targetY - me.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          me.x = me.targetX;
          me.y = me.targetY;
        } else {
          me.x += dx * speed;
          me.y += dy * speed;
        }
      }
    }
  }

  // === ПЛАВНОЕ ДВИЖЕНИЕ НА КАРТЕ (по клеткам) ===
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me && me.targetX !== undefined && me.targetY !== undefined) {
      const dx = me.targetX - me.x;
      const dy = me.targetY - me.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        me.x = me.targetX;
        me.y = me.targetY;
        me.targetX = undefined;
        me.targetY = undefined;
      } else {
        const step = Math.min(dist, 6);
        me.x += (dx / dist) * step;
        me.y += (dy / dist) * step;
        if (socket) socket.emit('move', { x: me.x, y: me.y });
      }
    }
  }

  // Камера следит за игроком в мире
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;
    }
  }

  draw();
  requestAnimationFrame(renderLoop);
}`,
      'rewrite renderLoop'
    );

    // === 2. Убираем bindInput с WASD, оставляем только клик ===
    content = replaceOnce(
      content,
      `function bindInput() {
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });`,
      `function bindInput() {
  // Toggle дебага по G
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'g') {
      window.DEBUG_TILES = !window.DEBUG_TILES;
      console.log('Debug tiles:', window.DEBUG_TILES);
    }
  });`,
      'remove WASD'
    );

    // === 3. Новый клик — точный шаг в клетку ===
    content = replaceOnce(
      content,
      `    // === СЦЕНА: МИР ===
    // Клик по карте → шаг в сторону клика
    const me = players.get(myId) || character;
    if (!me) return;

    const clickWorldX = mx + camera.x;
    const clickWorldY = my + camera.y;

    // Разница в тайлах между кликом и персонажем
    const dxTiles = Math.round((clickWorldX - me.x) / TILE_SIZE);
    const dyTiles = Math.round((clickWorldY - me.y) / TILE_SIZE);

    // Идём сначала по X, потом по Y (простой pathfinding)
    if (Math.abs(dxTiles) >= Math.abs(dyTiles)) {
      if (dxTiles > 0) tryMove(1, 0);
      else if (dxTiles < 0) tryMove(-1, 0);
      else if (dyTiles > 0) tryMove(0, 1);
      else if (dyTiles < 0) tryMove(0, -1);
    } else {
      if (dyTiles > 0) tryMove(0, 1);
      else if (dyTiles < 0) tryMove(0, -1);
      else if (dxTiles > 0) tryMove(1, 0);
      else if (dxTiles < 0) tryMove(-1, 0);
    }
  });`,
      `    // === СЦЕНА: МИР ===
    const me = players.get(myId) || character;
    if (!me) return;

    const clickWorldX = mx + camera.x;
    const clickWorldY = my + camera.y;

    // Определяем клетку под кликом
    const tileX = Math.floor(clickWorldX / TILE_SIZE);
    const tileY = Math.floor(clickWorldY / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE) return;

    // Номер клетки
    const cellId = tileY * MAP_SIZE + tileX;

    // Показываем в HUD
    const hud = document.getElementById('cellInfo') || createCellInfoHUD();
    const tile = GAME_MAP[tileY][tileX];
    hud.textContent = \`📍 Клетка #\${cellId} (x:\${tileX}, y:\${tileY}) — \${tileName(tile)}\`;

    // Проверяем проходимость
    if (tile === TILE.TREE || tile === TILE.WATER) {
      console.log('❌ Клетка непроходима');
      return;
    }

    // Плавно идём в центр этой клетки
    const targetX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const targetY = tileY * TILE_SIZE + TILE_SIZE / 2;
    me.targetX = targetX;
    me.targetY = targetY;
  });`,
      'click exact tile'
    );

    // === 4. В городе клик — плавное движение к точке ===
    content = replaceOnce(
      content,
      `    if (currentScene === 'city') {
      // Клик по нижней зоне (ворота)
      if (my > canvas.height - 40) {
        exitCity();
        return;
      }

      // Клик по зданиям
      CITY_BUILDINGS.forEach(b => {
        const bx = b.tileX * TILE_SIZE;
        const by = b.tileY * TILE_SIZE;
        const bw = TILE_SIZE * 3;
        const bh = TILE_SIZE * 2.5;
        if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
          console.log(\`🖱️ Клик по: \${b.name}\`);
          alert(\`\${b.icon} \${b.name}\\n\\n(меню скоро будет)\`);
        }
      });
      return;
    }`,
      `    if (currentScene === 'city') {
      // Клик по нижней зоне (ворота)
      if (my > canvas.height - 40) {
        exitCity();
        return;
      }

      // Проверяем клик по зданиям
      let clickedBuilding = false;
      CITY_BUILDINGS.forEach(b => {
        const bx = b.tileX * TILE_SIZE;
        const by = b.tileY * TILE_SIZE;
        const bw = TILE_SIZE * 3;
        const bh = TILE_SIZE * 2.5;
        if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
          console.log(\`🖱️ Клик по: \${b.name}\`);
          alert(\`\${b.icon} \${b.name}\\n\\n(меню скоро будет)\`);
          clickedBuilding = true;
        }
      });

      // Если не по зданию — плавно идём в точку клика
      if (!clickedBuilding) {
        const me = players.get(myId) || character;
        if (me) {
          me.targetX = mx;
          me.targetY = my;
        }
      }
      return;
    }`,
      'city smooth move'
    );

    // === 5. Помощники: имя тайла + HUD с номером клетки ===
    content = replaceOnce(
      content,
      `// ============================================================
//  UI — КНОПКИ
// ============================================================`,
      `// ============================================================
//  ПОМОЩНИКИ
// ============================================================

function tileName(tile) {
  const names = {
    [TILE.GRASS]: 'трава',
    [TILE.GRASS_DARK]: 'тёмная трава',
    [TILE.GRASS_LIGHT]: 'светлая трава',
    [TILE.TREE]: 'дерево',
    [TILE.WATER]: 'вода',
    [TILE.ROAD]: 'дорога',
    [TILE.SAND]: 'песок',
    [TILE.GATE]: 'ворота',
    [TILE.CITY_GROUND]: 'город'
  };
  return names[tile] || 'неизвестно';
}

function createCellInfoHUD() {
  const div = document.createElement('div');
  div.id = 'cellInfo';
  div.style.cssText = \`
    position: absolute;
    bottom: 15px;
    left: 15px;
    background: rgba(0, 0, 0, 0.75);
    color: #ffd700;
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid #4a4aff;
    font-family: monospace;
    font-size: 13px;
    pointer-events: none;
    z-index: 100;
  \`;
  div.textContent = '📍 Кликни по карте, чтобы увидеть номер клетки';
  document.getElementById('gameScreen').appendChild(div);
  return div;
}

// ============================================================
//  UI — КНОПКИ
// ============================================================`,
      'add helpers'
    );

    // === 6. Рисуем номера клеток в debug-режиме ===
    content = replaceOnce(
      content,
      `  // Города: стены, ворота, подписи
  CITIES.forEach(city => {`,
      `  // Debug: номера клеток
  if (window.DEBUG_TILES) {
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    for (let ty = sy; ty < ey; ty++) {
      for (let tx = sx; tx < ex; tx++) {
        const px = tx * TILE_SIZE - camera.x + TILE_SIZE / 2;
        const py = ty * TILE_SIZE - camera.y + TILE_SIZE / 2 + 3;
        const id = ty * MAP_SIZE + tx;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeText(id, px, py);
        ctx.fillText(id, px, py);
      }
    }
  }

  // Города: стены, ворота, подписи
  CITIES.forEach(city => {`,
      'debug tiles overlay'
    );

    writeFile(file, content);
    return true;
  },
  
    'navigator-fix': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // === 1. A* алгоритм поиска пути ===
    content = replaceOnce(
      content,
      `// ============================================================
//  ПОМОЩНИКИ
// ============================================================`,
      `// ============================================================
//  A* ПОИСК ПУТИ
// ============================================================

function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  return tile !== TILE.TREE && tile !== TILE.WATER;
}

function findPath(startX, startY, endX, endY) {
  // startX/startY/endX/endY — координаты в тайлах
  if (!isWalkable(endX, endY)) return null;
  if (startX === endX && startY === endY) return [];

  const open = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
  const closed = new Set();
  const key = (x, y) => y * MAP_SIZE + x;

  const maxIterations = 2000;
  let iter = 0;

  while (open.length > 0 && iter < maxIterations) {
    iter++;
    // Ищем узел с минимальным f
    let minIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[minIdx].f) minIdx = i;
    }
    const current = open.splice(minIdx, 1)[0];

    if (current.x === endX && current.y === endY) {
      // Восстанавливаем путь
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path.slice(1); // без стартовой точки
    }

    closed.add(key(current.x, current.y));

    // 4 направления: вверх, вниз, влево, вправо
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const n of neighbors) {
      if (!isWalkable(n.x, n.y)) continue;
      if (closed.has(key(n.x, n.y))) continue;

      const g = current.g + 1;
      const h = Math.abs(n.x - endX) + Math.abs(n.y - endY);
      const f = g + h;

      const existing = open.find(o => o.x === n.x && o.y === n.y);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        open.push({ x: n.x, y: n.y, g, h, f, parent: current });
      }
    }
  }

  return null; // путь не найден
}

// ============================================================
//  ПОМОЩНИКИ
// ============================================================`,
      'add A* pathfinding'
    );

    // === 2. Клик вне города — строим маршрут ===
    content = replaceOnce(
      content,
      `    // Определяем клетку под кликом
    const tileX = Math.floor(clickWorldX / TILE_SIZE);
    const tileY = Math.floor(clickWorldY / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE) return;

    // Номер клетки
    const cellId = tileY * MAP_SIZE + tileX;

    // Показываем в HUD
    const hud = document.getElementById('cellInfo') || createCellInfoHUD();
    const tile = GAME_MAP[tileY][tileX];
    hud.textContent = \`📍 Клетка #\${cellId} (x:\${tileX}, y:\${tileY}) — \${tileName(tile)}\`;

    // Проверяем проходимость
    if (tile === TILE.TREE || tile === TILE.WATER) {
      console.log('❌ Клетка непроходима');
      return;
    }

    // Плавно идём в центр этой клетки
    const targetX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const targetY = tileY * TILE_SIZE + TILE_SIZE / 2;
    me.targetX = targetX;
    me.targetY = targetY;
  });`,
      `    // Определяем клетку под кликом
    const tileX = Math.floor(clickWorldX / TILE_SIZE);
    const tileY = Math.floor(clickWorldY / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE) return;

    // Номер клетки
    const cellId = tileY * MAP_SIZE + tileX;

    // Показываем в HUD
    const hud = document.getElementById('cellInfo') || createCellInfoHUD();
    const tile = GAME_MAP[tileY][tileX];
    hud.textContent = \`📍 Клетка #\${cellId} (x:\${tileX}, y:\${tileY}) — \${tileName(tile)}\`;

    // Проверяем проходимость
    if (tile === TILE.TREE || tile === TILE.WATER) {
      console.log('❌ Клетка непроходима');
      return;
    }

    // Строим путь через A*
    const startTileX = Math.floor(me.x / TILE_SIZE);
    const startTileY = Math.floor(me.y / TILE_SIZE);
    const path = findPath(startTileX, startTileY, tileX, tileY);

    if (path && path.length > 0) {
      // Сохраняем маршрут
      me.path = path;
      me.pathIndex = 0;
      console.log(\`🗺️ Маршрут: \${path.length} шагов\`);
    } else {
      console.log('❌ Путь не найден');
    }
  });`,
      'pathfinding on click'
    );

    // === 3. Движение по маршруту в renderLoop ===
    content = replaceOnce(
      content,
      `  // === ПЛАВНОЕ ДВИЖЕНИЕ НА КАРТЕ (по клеткам) ===
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me && me.targetX !== undefined && me.targetY !== undefined) {
      const dx = me.targetX - me.x;
      const dy = me.targetY - me.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        me.x = me.targetX;
        me.y = me.targetY;
        me.targetX = undefined;
        me.targetY = undefined;
      } else {
        const step = Math.min(dist, 6);
        me.x += (dx / dist) * step;
        me.y += (dy / dist) * step;
        if (socket) socket.emit('move', { x: me.x, y: me.y });
      }
    }
  }`,
      `  // === ДВИЖЕНИЕ ПО МАРШРУТУ (A*) ===
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me && me.path && me.path.length > 0) {
      const nextPoint = me.path[0];
      const targetX = nextPoint.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = nextPoint.y * TILE_SIZE + TILE_SIZE / 2;

      const dx = targetX - me.x;
      const dy = targetY - me.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 2) {
        // Дошли до узла — берём следующий
        me.x = targetX;
        me.y = targetY;
        me.path.shift();
        if (me.path.length === 0) {
          me.path = null;
          // Проверяем, не встали ли мы в зону города
          const city = getCityAt(me.x, me.y);
          if (city) showEnterButton();
        }
      } else {
        const step = Math.min(dist, 3);
        me.x += (dx / dist) * step;
        me.y += (dy / dist) * step;
        if (socket) socket.emit('move', { x: me.x, y: me.y });
      }
    }
  }`,
      'follow path in renderLoop'
    );

    // === 4. Фикс кнопки «Войти» при движении ===
    // Теперь кнопка проверяется в renderLoop по факту позиции
    content = replaceOnce(
      content,
      `  // Камера следит за игроком в мире
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;
    }
  }`,
      `  // Камера следит за игроком в мире
  if (currentScene === 'world') {
    const me = players.get(myId) || character;
    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;

      // Проверка: стоим ли в зоне города → показать/скрыть кнопку
      const city = getCityAt(me.x, me.y);
      if (city) showEnterButton();
      else hideEnterButton();
    }
  }`,
      'check enter button every frame'
    );

    // === 5. В городе плавное движение — уже есть, но почистим targetX ===
    content = replaceOnce(
      content,
      `      // Если не по зданию — плавно идём в точку клика
      if (!clickedBuilding) {
        const me = players.get(myId) || character;
        if (me) {
          me.targetX = mx;
          me.targetY = my;
        }
      }
      return;`,
      `      // Если не по зданию — плавно идём в точку клика
      if (!clickedBuilding) {
        const me = players.get(myId) || character;
        if (me) {
          me.targetX = mx;
          me.targetY = my;
        }
      }
      return;`,
      'skip (already ok)'
    );

    writeFile(file, content);
    return true;
  },
  
    'fix-all': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // === 1. Дерево — проходимо, вода — нет ===
    content = replaceOnce(
      content,
      `function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  return tile !== TILE.TREE && tile !== TILE.WATER;
}`,
      `function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  // Дерево проходимо (для добычи), вода — нет
  if (tile === TILE.WATER) return false;
  // В зону города на карте нельзя — только через ворота
  if (tile === TILE.CITY_GROUND) return false;
  return true;
}

// Что под ногами игрока
function getTileUnderPlayer(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return null;
  return { x: tx, y: ty, type: GAME_MAP[ty][tx], name: tileName(GAME_MAP[ty][tx]) };
}`,
      'walkable + tile under'
    );

    // === 2. Кнопка «Войти» — только рядом с воротами ===
    content = replaceOnce(
      content,
      `      // Проверка: стоим ли в зоне города → показать/скрыть кнопку
      const city = getCityAt(me.x, me.y);
      if (city) showEnterButton();
      else hideEnterButton();`,
      `      // Проверка: стоим ли РЯДОМ С ВОРОТАМИ города
      const nearGate = isNearGate(me.x, me.y);
      if (nearGate) showEnterButton();
      else hideEnterButton();`,
      'button near gate'
    );

    // === 3. Функция isNearGate ===
    content = replaceOnce(
      content,
      `function isOnGate(px, py) {`,
      `function isNearGate(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    const gateY = city.tileY + half + 1;
    // Стоим на клетке ворот или в радиусе 1 клетки от неё
    if (Math.abs(tx - city.tileX) <= 1 && Math.abs(ty - gateY) <= 1) {
      return city;
    }
  }
  return null;
}

function isOnGate(px, py) {`,
      'add isNearGate'
    );

    // === 4. В городе — отдельные координаты cityX/cityY ===
    content = replaceOnce(
      content,
      `function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;
  const city = getCityAt(me.x, me.y);
  if (!city) {
    console.warn('❌ Не найдена зона города рядом');
    return;
  }

  currentCity = city;
  currentScene = 'city';
  hideEnterButton();
  console.log(\`🏰 Вошли в \${city.name}\`);
}`,
      `function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;
  const city = isNearGate(me.x, me.y) || getCityAt(me.x, me.y);
  if (!city) {
    console.warn('❌ Не найдена зона города рядом');
    return;
  }

  currentCity = city;
  currentScene = 'city';

  // Отдельные координаты для интерьера (по центру canvas)
  me.cityX = canvas.width / 2;
  me.cityY = canvas.height / 2;
  me.targetCityX = me.cityX;
  me.targetCityY = me.cityY;

  hideEnterButton();
  console.log(\`🏰 Вошли в \${city.name}\`);
}`,
      'city separate coords'
    );

    // === 5. Выход из города — возвращаем в мировые координаты ===
    content = replaceOnce(
      content,
      `function exitCity() {
  const me = players.get(myId) || character;
  if (!me) return;

  // Ставим игрока НИЖЕ ворот, чтобы не сработал повторный вход
  me.x = currentCity.tileX * TILE_SIZE + TILE_SIZE / 2;
  me.y = (currentCity.tileY + Math.floor(currentCity.size / 2) + 2) * TILE_SIZE;

  currentScene = 'world';
  currentCity = null;
  hideEnterButton();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
  console.log('🚪 Вышли из города');
}`,
      `function exitCity() {
  const me = players.get(myId) || character;
  if (!me) return;

  const city = currentCity;
  // Ставим игрока НИЖЕ ворот
  me.x = city.tileX * TILE_SIZE + TILE_SIZE / 2;
  me.y = (city.tileY + Math.floor(city.size / 2) + 2) * TILE_SIZE;

  // Сбрасываем городские координаты
  me.cityX = undefined;
  me.cityY = undefined;
  me.targetCityX = undefined;
  me.targetCityY = undefined;
  me.path = null;

  currentScene = 'world';
  currentCity = null;
  hideEnterButton();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
  console.log('🚪 Вышли из города');
}`,
      'exit fix'
    );

    // === 6. В городе клик — используем cityX/cityY ===
    content = replaceOnce(
      content,
      `      // Если не по зданию — плавно идём в точку клика
      if (!clickedBuilding) {
        const me = players.get(myId) || character;
        if (me) {
          me.targetX = mx;
          me.targetY = my;
        }
      }
      return;`,
      `      // Если не по зданию — плавно идём в точку клика
      if (!clickedBuilding) {
        const me = players.get(myId) || character;
        if (me) {
          me.targetCityX = mx;
          me.targetCityY = my;
        }
      }
      return;`,
      'city click uses cityX'
    );

    // === 7. В городе движение плавное (cityX/cityY) ===
    content = replaceOnce(
      content,
      `  // === ПЛАВНОЕ ДВИЖЕНИЕ В ГОРОДЕ ===
  if (currentScene === 'city') {
    const me = players.get(myId) || character;
    if (me) {
      // Плавное перемещение к целевой точке
      if (me.targetX !== undefined && me.targetY !== undefined) {
        const speed = 0.15; // 15% пути за кадр
        const dx = me.targetX - me.x;
        const dy = me.targetY - me.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          me.x = me.targetX;
          me.y = me.targetY;
        } else {
          me.x += dx * speed;
          me.y += dy * speed;
        }
      }
    }
  }`,
      `  // === ПЛАВНОЕ ДВИЖЕНИЕ В ГОРОДЕ ===
  if (currentScene === 'city') {
    const me = players.get(myId) || character;
    if (me && me.targetCityX !== undefined && me.targetCityY !== undefined) {
      const dx = me.targetCityX - me.cityX;
      const dy = me.targetCityY - me.cityY;
      const speed = 0.2;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        me.cityX = me.targetCityX;
        me.cityY = me.targetCityY;
      } else {
        me.cityX += dx * speed;
        me.cityY += dy * speed;
      }
    }
  }`,
      'city smooth move fix'
    );

    // === 8. Отрисовка персонажа в городе — по cityX/cityY ===
    content = replaceOnce(
      content,
      `  } else {
    // В городе — по центру canvas
    const px = canvas.width / 2 - 10;
    const py = canvas.height / 2 - 10;
    drawPlayer(ctx, px, py, true, me.name, me.level);
  }`,
      `  } else {
    // В городе — по cityX/cityY
    const px = (me.cityX || canvas.width / 2) - 10;
    const py = (me.cityY || canvas.height / 2) - 10;
    drawPlayer(ctx, px, py, true, me.name, me.level);
  }`,
      'draw player in city'
    );

    writeFile(file, content);
    return true;
  },
  
    'fix-walkable': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // === 1. tryMove — блокируем ТОЛЬКО воду и город ===
    content = replaceOnce(
      content,
      `    // Коллизии: нельзя в дерево или воду
    const tx = Math.floor(newX / TILE_SIZE);
    const ty = Math.floor(newY / TILE_SIZE);
    const targetTile = GAME_MAP[ty] && GAME_MAP[ty][tx];
    if (targetTile === TILE.TREE || targetTile === TILE.WATER) return;`,
      `    // Коллизии: нельзя в воду и город
    const tx = Math.floor(newX / TILE_SIZE);
    const ty = Math.floor(newY / TILE_SIZE);
    const targetTile = GAME_MAP[ty] && GAME_MAP[ty][tx];
    if (targetTile === TILE.WATER || targetTile === TILE.CITY_GROUND) return;`,
      'tryMove water only'
    );

    // === 2. isNearGate — только клетка ворот (без радиуса) ===
    content = replaceOnce(
      content,
      `function isNearGate(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    const gateY = city.tileY + half + 1;
    // Стоим на клетке ворот или в радиусе 1 клетки от неё
    if (Math.abs(tx - city.tileX) <= 1 && Math.abs(ty - gateY) <= 1) {
      return city;
    }
  }
  return null;
}`,
      `function isNearGate(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  for (const city of CITIES) {
    const half = Math.floor(city.size / 2);
    const gateY = city.tileY + half + 1;
    // Стоим ТОЛЬКО на клетке ворот
    if (tx === city.tileX && ty === gateY) {
      return city;
    }
  }
  return null;
}`,
      'isNearGate strict'
    );

    // === 3. Функция: что под ногами (для будущей добычи) ===
    content = replaceOnce(
      content,
      `// Что под ногами игрока
function getTileUnderPlayer(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return null;
  return { x: tx, y: ty, type: GAME_MAP[ty][tx], name: tileName(GAME_MAP[ty][tx]) };
}`,
      `// Что под ногами игрока
function getTileUnderPlayer(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return null;
  return { x: tx, y: ty, type: GAME_MAP[ty][tx], name: tileName(GAME_MAP[ty][tx]) };
}

// Показать что под ногами в HUD
function updateTileHUD(me) {
  if (!me) return;
  const under = getTileUnderPlayer(me.x, me.y);
  const hud = document.getElementById('tileUnderInfo') || createTileUnderHUD();
  if (under) {
    const icons = {
      [TILE.GRASS]: '🌿',
      [TILE.GRASS_DARK]: '🌿',
      [TILE.GRASS_LIGHT]: '🌿',
      [TILE.TREE]: '🌲',
      [TILE.WATER]: '💧',
      [TILE.ROAD]: '🛤️',
      [TILE.SAND]: '🏖️',
      [TILE.GATE]: '🚪',
      [TILE.CITY_GROUND]: '🏙️'
    };
    const icon = icons[under.type] || '❓';
    hud.textContent = \`\${icon} Стою на: \${under.name}\`;
  }
}

function createTileUnderHUD() {
  const div = document.createElement('div');
  div.id = 'tileUnderInfo';
  div.style.cssText = \`
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: #88ff88;
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid #4a4aff;
    font-family: monospace;
    font-size: 13px;
    pointer-events: none;
    z-index: 100;
  \`;
  div.textContent = '🌿 Стою на: —';
  document.getElementById('gameScreen').appendChild(div);
  return div;
}`,
      'add tile under HUD'
    );

    // === 4. Обновление HUD «стою на» каждый кадр ===
    content = replaceOnce(
      content,
      `      // Проверка: стоим ли РЯДОМ С ВОРОТАМИ города
      const nearGate = isNearGate(me.x, me.y);
      if (nearGate) showEnterButton();
      else hideEnterButton();`,
      `      // Проверка: стоим ли РЯДОМ С ВОРОТАМИ города
      const nearGate = isNearGate(me.x, me.y);
      if (nearGate) showEnterButton();
      else hideEnterButton();

      // Обновляем HUD «стою на»
      updateTileHUD(me);`,
      'update tile HUD'
    );

    writeFile(file, content);
    return true;
  },
  
    'fix-iswalkable': () => {
    const file = 'client/js/main.js';
    backup(file);
    let content = readFile(file);
    if (!content) return false;

    // isWalkable: дерево — проходимо, вода — нет
    content = replaceOnce(
      content,
      `function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  // Дерево проходимо (для добычи), вода — нет
  if (tile === TILE.WATER) return false;
  // В зону города на карте нельзя — только через ворота
  if (tile === TILE.CITY_GROUND) return false;
  return true;
}`,
      `function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  // Дерево ПРОХОДИМО (можно встать для добычи)
  if (tile === TILE.TREE) return true;
  // Вода — НЕ проходима
  if (tile === TILE.WATER) return false;
  // В зону города на карте нельзя — только через ворота
  if (tile === TILE.CITY_GROUND) return false;
  return true;
}`,
      'isWalkable allow tree'
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