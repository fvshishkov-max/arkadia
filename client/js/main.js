// client/js/main.js
const API = ''; // тот же origin

let token = null;
let character = null;
let socket = null;
let players = new Map(); // id → {name, class, x, y, ...}
let myId = null;
let canvas, ctx;
let camera = { x: 0, y: 0 };
const keys = {};

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
clearCityZones(GAME_MAP);

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
}

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

// Отрисовка одного города
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

  // Рисуем города
  CITIES.forEach(city => drawCity(ctx, city, camera));
}


// === Переключение табов ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  };
});

// === API вызовы ===
async function doLogin() {
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return err.textContent = data.error;
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = 'Ошибка соединения';
  }
}

async function doRegister() {
  const username = document.getElementById('regUser').value;
  const password = document.getElementById('regPass').value;
  const charName = document.getElementById('regCharName').value;
  const charClass = document.getElementById('regClass').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, charName, charClass })
    });
    const data = await res.json();
    if (!res.ok) return err.textContent = data.error;
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = 'Ошибка соединения';
  }
}

function onAuthSuccess(data) {
  token = data.token;
  character = data.character;
  localStorage.setItem('arkadia_token', token);
  startGame();
}

// === Игра ===
function startGame() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  document.getElementById('charInfo').textContent =
    `${character.name} [${character.class}] Ур.${character.level}`;
  document.getElementById('cityInfo').textContent = `🏰 ${character.city}`;

  connectSocket();
  bindInput();
  requestAnimationFrame(renderLoop);
}

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('join', { token });
  });

  socket.on('init', ({ you, players: others }) => {
    myId = you.id;
    players.clear();
    players.set(you.id, you); // кладём СЕБЯ
    others.forEach(p => players.set(p.id, p));
    camera.x = you.x - canvas.width / 2;
    camera.y = you.y - canvas.height / 2;
    character = { ...character, ...you };
    console.log('🎮 Инициализирован:', you.name, 'в', you.city);
  });

  socket.on('playerJoined', (p) => {
    players.set(p.id, p);
  });

  socket.on('playerMoved', ({ id, x, y }) => {
    const p = players.get(id);
    if (p) { p.x = x; p.y = y; }
  });

  socket.on('playerLeft', (id) => {
    players.delete(id);
  });

  socket.on('online', (n) => {
    document.getElementById('onlineInfo').textContent = `🟢 Онлайн: ${n}`;
  });

  socket.on('error', (msg) => console.error('Socket error:', msg));
}

// === Ввод ===
function bindInput() {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
}

// === Игровой цикл ===
let lastMove = 0;
function renderLoop(t) {
  const speed = 3;
  let dx = 0, dy = 0;

  if (keys['w'] || keys['arrowup']) dy -= speed;
  if (keys['s'] || keys['arrowdown']) dy += speed;
  if (keys['a'] || keys['arrowleft']) dx -= speed;
  if (keys['d'] || keys['arrowright']) dx += speed;

  const me = players.get(myId) || character;
  if ((dx || dy) && socket && me) {
    me.x = Math.max(16, Math.min(WORLD_SIZE - 16, me.x + dx));
    me.y = Math.max(16, Math.min(WORLD_SIZE - 16, me.y + dy));
    if (t - lastMove > 50) {
      socket.emit('move', { x: me.x, y: me.y });
      lastMove = t;
    }
  }

  // Камера следует за игроком
  if (me) {
    camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
    camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;
  }

  draw();
  requestAnimationFrame(renderLoop);
}

function draw() {
  // Рисуем карту тайлами
  drawMap(ctx, camera, canvas.width, canvas.height);

  // Игроки (сортируем по Y — кто ниже, тот поверх)
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
  });

  // Прицел-центр
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(canvas.width/2 - 1, canvas.height/2 - 1, 2, 2);
}

// === Автологин ===
window.addEventListener('load', () => {
  const saved = localStorage.getItem('arkadia_token');
  if (saved) {
    token = saved;
    // Попробуем зайти — но нужен character. Проще: пользователь вводит логин.
    // Для MVP — не автологиним, чистим
    localStorage.removeItem('arkadia_token');
  }
});

// Экспорт в window для inline onclick
window.doLogin = doLogin;
window.doRegister = doRegister;