// ============================================================
//  АРКАДИЯ: ПОЛЕ БИТВЫ — Клиент
//  Этап 1.3: Полная переработка, чистая структура
// ============================================================

// === API и состояние ===
let token = null;
let character = null;
let socket = null;
let players = new Map();
let myId = null;

// === Canvas ===
let canvas, ctx;

// === Мир ===
const TILE_SIZE = 32;
const MAP_SIZE = 50;
const WORLD_SIZE = TILE_SIZE * MAP_SIZE;

// Тайлы
const TILE = {
  GRASS: 0, GRASS_DARK: 1, GRASS_LIGHT: 2,
  TREE: 3, WATER: 4, ROAD: 5, SAND: 6,
  GATE: 7, CITY_GROUND: 8
};

const TILE_COLORS = {
  [TILE.GRASS]: '#3a7a2a',
  [TILE.GRASS_DARK]: '#2e6522',
  [TILE.GRASS_LIGHT]: '#4a8a35',
  [TILE.TREE]: '#1a4a15',
  [TILE.WATER]: '#2a5a9a',
  [TILE.ROAD]: '#8a7a4a',
  [TILE.SAND]: '#c8b878',
  [TILE.GATE]: '#5a3a1a',
  [TILE.CITY_GROUND]: '#8a8a7a'
};

const TILE_NAME = {
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

const TILE_ICON = {
  [TILE.GRASS]: '🌿', [TILE.GRASS_DARK]: '🌿', [TILE.GRASS_LIGHT]: '🌿',
  [TILE.TREE]: '🌲', [TILE.WATER]: '💧', [TILE.ROAD]: '🛤️',
  [TILE.SAND]: '🏖️', [TILE.GATE]: '🚪', [TILE.CITY_GROUND]: '🏙️'
};

// === Города ===
const CITIES = [
  { id: 'valencia', name: 'Валенсия', tileX: 25, tileY: 25, size: 7, color: '#d4af37' },
  { id: 'dragon',   name: 'Драконье Логово', tileX: 25, tileY: 8,  size: 7, color: '#c0392b' },
  { id: 'elf',      name: 'Эльфийская Роща', tileX: 25, tileY: 42, size: 7, color: '#27ae60' }
];

// === Сцены ===
let currentScene = 'world';
let currentCity = null;

// === Камера ===
const camera = { x: 0, y: 0 };

// === Отладка ===
window.DEBUG_TILES = false;

// ============================================================
//  ГЕНЕРАЦИЯ КАРТЫ
// ============================================================

function generateMap() {
  const map = [];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // База — трава
  for (let y = 0; y < MAP_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const r = rand();
      if (r < 0.6) map[y][x] = TILE.GRASS;
      else if (r < 0.8) map[y][x] = TILE.GRASS_DARK;
      else map[y][x] = TILE.GRASS_LIGHT;
    }
  }

  // Озеро (правый верх)
  for (let y = 3; y < 10; y++)
    for (let x = 38; x < 48; x++)
      map[y][x] = TILE.WATER;

  // Лес (слева)
  for (let y = 15; y < 35; y++)
    for (let x = 2; x < 15; x++)
      if (rand() < 0.4) map[y][x] = TILE.TREE;

  // Лес (снизу)
  for (let y = 38; y < 48; y++)
    for (let x = 15; x < 35; x++)
      if (rand() < 0.35) map[y][x] = TILE.TREE;

  // Дороги — крест
  for (let x = 5; x < 45; x++) map[25][x] = TILE.ROAD;
  for (let y = 5; y < 45; y++) map[y][25] = TILE.ROAD;

  // Очищаем зоны городов
  CITIES.forEach(city => {
    const half = Math.floor(city.size / 2);
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const tx = city.tileX + dx;
        const ty = city.tileY + dy;
        if (ty >= 0 && ty < MAP_SIZE && tx >= 0 && tx < MAP_SIZE) {
          map[ty][tx] = TILE.CITY_GROUND;
        }
      }
    }
    // Ворота — снизу от города
    const gateY = city.tileY + half + 1;
    if (gateY < MAP_SIZE) {
      map[gateY][city.tileX] = TILE.GATE;
      if (gateY + 1 < MAP_SIZE) map[gateY + 1][city.tileX] = TILE.ROAD;
    }
  });

  return map;
}

const GAME_MAP = generateMap();

// ============================================================
//  ПРОХОДИМОСТЬ И A*
// ============================================================

function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  // Дерево ПРОХОДИМО (можно встать для добычи)
  // Вода — НЕ проходима
  // Город на карте — НЕ проходим (только через ворота)
  if (tile === TILE.WATER) return false;
  if (tile === TILE.CITY_GROUND) return false;
  return true;
}

function findPath(startX, startY, endX, endY) {
  if (!isWalkable(endX, endY)) return null;
  if (startX === endX && startY === endY) return [];

  const open = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
  const closed = new Set();
  const key = (x, y) => y * MAP_SIZE + x;

  let iter = 0;
  while (open.length > 0 && iter < 3000) {
    iter++;
    let minIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[minIdx].f) minIdx = i;
    }
    const current = open.splice(minIdx, 1)[0];

    if (current.x === endX && current.y === endY) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path.slice(1);
    }

    closed.add(key(current.x, current.y));

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
  return null;
}

// ============================================================
//  ОТРИСОВКА
// ============================================================

function drawTile(ctx, tile, px, py, wx, wy) {
  ctx.fillStyle = TILE_COLORS[tile];
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  if (tile === TILE.TREE) {
    // Ствол
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(px + 12, py + 20, 8, 12);
    // Крона
    ctx.fillStyle = '#2a6a20';
    ctx.fillRect(px + 4, py + 2, 24, 22);
    ctx.fillStyle = '#3a8a2a';
    ctx.fillRect(px + 6, py + 4, 20, 18);
    // Блики
    ctx.fillStyle = '#4aaa3a';
    ctx.fillRect(px + 8, py + 6, 6, 4);
    ctx.fillRect(px + 18, py + 12, 6, 4);
  } else if (tile === TILE.WATER) {
    const t = Date.now() / 500;
    const wave = Math.sin(wx * 0.5 + wy * 0.3 + t) * 0.5 + 0.5;
    if (wave > 0.7) {
      ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
      ctx.fillRect(px + 4, py + 8, 8, 2);
      ctx.fillRect(px + 16, py + 20, 10, 2);
    }
  } else if (tile === TILE.GRASS || tile === TILE.GRASS_DARK || tile === TILE.GRASS_LIGHT) {
    const h = ((wx * 7 + wy * 13) % 4);
    if (h === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(px + 6, py + 10, 2, 4);
      ctx.fillRect(px + 20, py + 18, 2, 4);
    }
  } else if (tile === TILE.ROAD) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(px + 5, py + 8, 3, 3);
    ctx.fillRect(px + 20, py + 22, 4, 4);
  } else if (tile === TILE.GATE) {
    ctx.fillStyle = '#3a1a0a';
    ctx.fillRect(px, py + 8, TILE_SIZE, TILE_SIZE - 8);
    ctx.fillStyle = '#5a3a1a';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px + 2 + i * 8, py + 10, 6, TILE_SIZE - 12);
    }
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE - 6, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (tile === TILE.CITY_GROUND) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }
}

function drawWorldMap(ctx, camera, cw, ch) {
  const sx = Math.max(0, Math.floor(camera.x / TILE_SIZE));
  const sy = Math.max(0, Math.floor(camera.y / TILE_SIZE));
  const ex = Math.min(MAP_SIZE, Math.ceil((camera.x + cw) / TILE_SIZE));
  const ey = Math.min(MAP_SIZE, Math.ceil((camera.y + ch) / TILE_SIZE));

  for (let ty = sy; ty < ey; ty++) {
    for (let tx = sx; tx < ex; tx++) {
      const tile = GAME_MAP[ty][tx];
      const px = tx * TILE_SIZE - camera.x;
      const py = ty * TILE_SIZE - camera.y;
      drawTile(ctx, tile, px, py, tx, ty);
    }
  }

  // Debug: номера клеток
  if (window.DEBUG_TILES) {
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    for (let ty = sy; ty < ey; ty++) {
      for (let tx = sx; tx < ex; tx++) {
        const px = tx * TILE_SIZE - camera.x + TILE_SIZE / 2;
        const py = ty * TILE_SIZE - camera.y + TILE_SIZE / 2 + 3;
        const id = ty * MAP_SIZE + tx;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeText(id, px, py);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.fillText(id, px, py);
      }
    }
  }

  // Города: стены, башни, подписи
  CITIES.forEach(city => {
    const half = Math.floor(city.size / 2);
    const gx = (city.tileX - half) * TILE_SIZE - camera.x;
    const gy = (city.tileY - half) * TILE_SIZE - camera.y;
    const gw = city.size * TILE_SIZE;
    const gh = city.size * TILE_SIZE;

    // Стены
    ctx.fillStyle = city.color;
    ctx.fillRect(gx, gy, gw, 6);
    ctx.fillRect(gx, gy + gh - 6, gw, 6);
    ctx.fillRect(gx, gy, 6, gh);
    ctx.fillRect(gx + gw - 6, gy, 6, gh);

    // Башни
    const towerSize = 12;
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(gx - 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx - 3, gy + gh - towerSize + 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy + gh - towerSize + 3, towerSize, towerSize);

    // Проём ворот
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
  });

  // Маршрут (если есть)
  const me = players.get(myId) || character;
  if (me && me.path && me.path.length > 0) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(me.x - camera.x, me.y - camera.y);
    me.path.forEach(p => {
      ctx.lineTo(p.x * TILE_SIZE + TILE_SIZE / 2 - camera.x, p.y * TILE_SIZE + TILE_SIZE / 2 - camera.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ============================================================
//  ИНТЕРЬЕР ГОРОДА
// ============================================================

const CITY_BUILDINGS = [
  { id: 'arena',    name: 'Арена',    icon: '⚔️', tileX: 5,  tileY: 3,  color: '#8B0000' },
  { id: 'shop',     name: 'Торговец', icon: '🛒', tileX: 19, tileY: 3,  color: '#B8860B' },
  { id: 'repair',   name: 'Ремонт',   icon: '🔨', tileX: 3,  tileY: 10, color: '#5a5a5a' },
  { id: 'hospital', name: 'Больница', icon: '🏥', tileX: 21, tileY: 10, color: '#ffffff' },
  { id: 'tavern',   name: 'Таверна',  icon: '🍺', tileX: 12, tileY: 12, color: '#8B4513' }
];

function drawCityInterior(ctx) {
  const city = currentCity;
  const cw = canvas.width;
  const ch = canvas.height;

  // Каменный пол
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < cw; x += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = 0; y < ch; y += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  // Стены
  const wallThick = 16;
  ctx.fillStyle = city.color;
  ctx.fillRect(0, 0, cw, wallThick);
  ctx.fillRect(0, ch - wallThick, cw, wallThick);
  ctx.fillRect(0, 0, wallThick, ch);
  ctx.fillRect(cw - wallThick, 0, wallThick, ch);

  // Название
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.strokeText(city.name, cw / 2, 40);
  ctx.fillStyle = city.color;
  ctx.fillText(city.name, cw / 2, 40);

  // Выход (внизу)
  const gateX = cw / 2 - TILE_SIZE;
  const gateY = ch - wallThick - 4;
  ctx.fillStyle = '#3a1a0a';
  ctx.fillRect(gateX, gateY, TILE_SIZE * 2, wallThick + 4);
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('ВЫХОД', cw / 2, ch - 10);

  // Здания
  CITY_BUILDINGS.forEach(b => {
    const bx = b.tileX * TILE_SIZE;
    const by = b.tileY * TILE_SIZE;
    const bw = TILE_SIZE * 3;
    const bh = TILE_SIZE * 2.5;

    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(bx, by + bh * 0.35, bw, bh * 0.65);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by + bh * 0.35, bw, bh * 0.65);

    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(bx - 4, by + bh * 0.35);
    ctx.lineTo(bx + bw / 2, by);
    ctx.lineTo(bx + bw + 4, by + bh * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(b.icon, bx + bw / 2, by + bh * 0.7);
    ctx.font = 'bold 12px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(b.name, bx + bw / 2, by + bh * 1.05);
    ctx.fillStyle = 'white';
    ctx.fillText(b.name, bx + bw / 2, by + bh * 1.05);
  });
}

// ============================================================
//  ПЕРСОНАЖ
// ============================================================

function drawPlayer(ctx, px, py, isMe, name) {
  // Тень
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px + 10, py + 18, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isMe) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px + 10, py + 18, 13, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = isMe ? '#ffd700' : '#4a4aff';
  ctx.fillRect(px + 3, py + 6, 14, 14);
  ctx.strokeStyle = isMe ? '#ffaa00' : '#2a2aff';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 3, py + 6, 14, 14);

  ctx.fillStyle = '#ffcc99';
  ctx.fillRect(px + 5, py - 2, 10, 10);
  ctx.strokeStyle = '#cc9966';
  ctx.strokeRect(px + 5, py - 2, 10, 10);

  ctx.fillStyle = '#000';
  ctx.fillRect(px + 7, py + 1, 1, 2);
  ctx.fillRect(px + 12, py + 1, 1, 2);

  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.strokeText(name, px + 10, py - 6);
  ctx.fillStyle = isMe ? '#ffd700' : '#ffffff';
  ctx.fillText(name, px + 10, py - 6);
}

// ============================================================
//  HUD
// ============================================================

function createHUDs() {
  // HUD: клетка под курсором
  if (!document.getElementById('cellInfo')) {
    const div = document.createElement('div');
    div.id = 'cellInfo';
    div.style.cssText = `
      position: absolute; bottom: 15px; left: 15px;
      background: rgba(0,0,0,0.75); color: #ffd700;
      padding: 8px 14px; border-radius: 6px;
      border: 1px solid #4a4aff; font-family: monospace;
      font-size: 13px; pointer-events: none; z-index: 100;
    `;
    div.textContent = '📍 Кликни по карте';
    document.getElementById('gameScreen').appendChild(div);
  }

  // HUD: что под ногами
  if (!document.getElementById('tileUnderInfo')) {
    const div = document.createElement('div');
    div.id = 'tileUnderInfo';
    div.style.cssText = `
      position: absolute; bottom: 15px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75); color: #88ff88;
      padding: 8px 14px; border-radius: 6px;
      border: 1px solid #4a4aff; font-family: monospace;
      font-size: 13px; pointer-events: none; z-index: 100;
    `;
    div.textContent = '🌿 Стою на: —';
    document.getElementById('gameScreen').appendChild(div);
  }
}

function updateHUDs() {
  const me = players.get(myId) || character;
  if (!me) return;

  if (currentScene === 'world') {
    const tx = Math.floor(me.x / TILE_SIZE);
    const ty = Math.floor(me.y / TILE_SIZE);
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
      const tile = GAME_MAP[ty][tx];
      const cellId = ty * MAP_SIZE + tx;
      document.getElementById('tileUnderInfo').textContent =
        `${TILE_ICON[tile]} Стою на: ${TILE_NAME[tile]} (клетка #${cellId})`;
    }
  } else {
    document.getElementById('tileUnderInfo').textContent = '🏙️ Я в городе';
  }
}

// ============================================================
//  КНОПКА ВХОДА
// ============================================================

let enterBtnVisible = false;

function showEnterButton() {
  if (enterBtnVisible) return;
  enterBtnVisible = true;
  const btn = document.createElement('button');
  btn.id = 'enterCityBtn';
  btn.textContent = '🚪 Войти в город';
  btn.style.cssText = `
    position: absolute; bottom: 60px; left: 50%;
    transform: translateX(-50%);
    padding: 14px 28px;
    background: linear-gradient(135deg, #4a4aff, #8a2be2);
    color: white; font-size: 18px; font-weight: bold;
    border: 2px solid #ffd700; border-radius: 8px;
    cursor: pointer; box-shadow: 0 0 20px rgba(74, 74, 255, 0.7);
    z-index: 100;
  `;
  btn.onclick = enterCity;
  document.getElementById('gameScreen').appendChild(btn);
}

function hideEnterButton() {
  if (!enterBtnVisible) return;
  enterBtnVisible = false;
  const btn = document.getElementById('enterCityBtn');
  if (btn) btn.remove();
}

// ============================================================
//  ГОРОД: ВХОД/ВЫХОД
// ============================================================

function isOnGateTile(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return GAME_MAP[ty] && GAME_MAP[ty][tx] === TILE.GATE;
}

function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;

  // Найти город, к воротам которого мы стоим
  let city = null;
  for (const c of CITIES) {
    const half = Math.floor(c.size / 2);
    const gateY = c.tileY + half + 1;
    const tx = Math.floor(me.x / TILE_SIZE);
    const ty = Math.floor(me.y / TILE_SIZE);
    if (tx === c.tileX && ty === gateY) {
      city = c;
      break;
    }
  }

  if (!city) {
    console.warn('❌ Не на воротах');
    return;
  }

  currentCity = city;
  currentScene = 'city';
  me.cityX = canvas.width / 2;
  me.cityY = canvas.height / 2;
  me.targetCityX = me.cityX;
  me.targetCityY = me.cityY;
  hideEnterButton();
  console.log(`🏰 Вошли в ${city.name}`);
}

function exitCity() {
  const me = players.get(myId) || character;
  if (!me || !currentCity) return;

  const city = currentCity;
  const half = Math.floor(city.size / 2);
  me.x = city.tileX * TILE_SIZE + TILE_SIZE / 2;
  me.y = (city.tileY + half + 2) * TILE_SIZE + TILE_SIZE / 2;
  me.cityX = undefined;
  me.cityY = undefined;
  me.path = null;

  currentScene = 'world';
  currentCity = null;
  hideEnterButton();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
  console.log('🚪 Вышли из города');
}

// ============================================================
//  ВВОД
// ============================================================

function bindInput() {
  // Debug по G
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'g') {
      window.DEBUG_TILES = !window.DEBUG_TILES;
      console.log('Debug tiles:', window.DEBUG_TILES);
    }
  });

  // Клик по canvas
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (currentScene === 'city') {
      handleCityClick(mx, my);
      return;
    }

    handleWorldClick(mx, my);
  });
}

function handleWorldClick(mx, my) {
  const me = players.get(myId) || character;
  if (!me) return;

  const worldX = mx + camera.x;
  const worldY = my + camera.y;
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);

  if (tileX < 0 || tileX >= MAP_SIZE || tileY < 0 || tileY >= MAP_SIZE) return;

  const tile = GAME_MAP[tileY][tileX];
  const cellId = tileY * MAP_SIZE + tileX;

  // HUD клетки
  document.getElementById('cellInfo').textContent =
    `📍 Клетка #${cellId} (x:${tileX}, y:${tileY}) — ${TILE_NAME[tile]}`;

  // Проверка проходимости
  if (tile === TILE.WATER) {
    console.log('❌ Вода — непроходима');
    return;
  }
  if (tile === TILE.CITY_GROUND) {
    console.log('❌ В город нельзя — только через ворота');
    return;
  }

  // Строим путь
  const startX = Math.floor(me.x / TILE_SIZE);
  const startY = Math.floor(me.y / TILE_SIZE);
  const path = findPath(startX, startY, tileX, tileY);

  if (path && path.length > 0) {
    me.path = path;
    console.log(`🗺️ Путь: ${path.length} шагов`);
  } else if (path && path.length === 0) {
    console.log('📍 Уже там');
  } else {
    console.log('❌ Путь не найден');
  }
}

function handleCityClick(mx, my) {
  const me = players.get(myId) || character;
  if (!me) return;

  // Клик по нижней зоне = выход
  if (my > canvas.height - 40) {
    exitCity();
    return;
  }

  // Клик по зданию?
  let clickedBuilding = false;
  CITY_BUILDINGS.forEach(b => {
    const bx = b.tileX * TILE_SIZE;
    const by = b.tileY * TILE_SIZE;
    const bw = TILE_SIZE * 3;
    const bh = TILE_SIZE * 2.5;
    if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
      console.log(`🖱️ Клик по: ${b.name}`);
      alert(`${b.icon} ${b.name}\n\n(меню скоро будет)`);
      clickedBuilding = true;
    }
  });

  if (!clickedBuilding) {
    me.targetCityX = mx;
    me.targetCityY = my;
  }
}

// ============================================================
//  ИГРОВОЙ ЦИКЛ
// ============================================================

let lastT = 0;

function renderLoop(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;

  // === ДВИЖЕНИЕ ПО МАРШРУТУ (МИР) ===
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
        me.x = targetX;
        me.y = targetY;
        me.path.shift();
        if (me.path.length === 0) me.path = null;
      } else {
        const speed = 200 * dt;
        const step = Math.min(dist, speed);
        me.x += (dx / dist) * step;
        me.y += (dy / dist) * step;
        if (socket && Math.random() < 0.3) {
          socket.emit('move', { x: me.x, y: me.y });
        }
      }
    }

    // Камера
    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;

      // Кнопка «Войти» — только на воротах
      if (isOnGateTile(me.x, me.y)) showEnterButton();
      else hideEnterButton();
    }
  }

  // === ПЛАВНОЕ ДВИЖЕНИЕ В ГОРОДЕ ===
  if (currentScene === 'city') {
    const me = players.get(myId) || character;
    if (me && me.targetCityX !== undefined) {
      const dx = me.targetCityX - me.cityX;
      const dy = me.targetCityY - me.cityY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        me.cityX = me.targetCityX;
        me.cityY = me.targetCityY;
      } else {
        const speed = 400 * dt;
        const step = Math.min(dist, speed);
        me.cityX += (dx / dist) * step;
        me.cityY += (dy / dist) * step;
      }
    }
  }

  updateHUDs();
  draw();
  requestAnimationFrame(renderLoop);
}

function draw() {
  if (currentScene === 'world') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWorldMap(ctx, camera, canvas.width, canvas.height);

    // Другие игроки
    players.forEach(p => {
      if (p.id === myId) return;
      const px = p.x - camera.x - 10;
      const py = p.y - camera.y - 10;
      drawPlayer(ctx, px, py, false, p.name);
    });

    // Я
    const me = players.get(myId) || character;
    if (me) {
      const px = me.x - camera.x - 10;
      const py = me.y - camera.y - 10;
      drawPlayer(ctx, px, py, true, me.name);
    }
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCityInterior(ctx);

    const me = players.get(myId) || character;
    if (me) {
      const px = (me.cityX || canvas.width / 2) - 10;
      const py = (me.cityY || canvas.height / 2) - 10;
      drawPlayer(ctx, px, py, true, me.name);
    }
  }
}

// ============================================================
//  СОКЕТЫ
// ============================================================

function connectSocket() {
  socket = io();
  socket.on('connect', () => socket.emit('join', { token }));

  socket.on('init', ({ you, players: others }) => {
    myId = you.id;
    players.clear();
    players.set(you.id, you);
    others.forEach(p => players.set(p.id, p));
    character = { ...character, ...you };

    camera.x = character.x - canvas.width / 2;
    camera.y = character.y - canvas.height / 2;
    console.log('🎮 Зашли:', you.name, 'в', you.city);
  });

  socket.on('playerJoined', p => players.set(p.id, p));
  socket.on('playerMoved', ({ id, x, y }) => {
    const p = players.get(id);
    if (p) { p.x = x; p.y = y; }
  });
  socket.on('playerLeft', id => players.delete(id));
  socket.on('online', n => {
    document.getElementById('onlineInfo').textContent = `🟢 Онлайн: ${n}`;
  });
  socket.on('error', msg => console.error('Socket error:', msg));
}

// ============================================================
//  АВТОРИЗАЦИЯ
// ============================================================

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
  startGame();
}

// ============================================================
//  СТАРТ
// ============================================================

function startGame() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  document.getElementById('charInfo').textContent =
    `${character.name} [${character.class}] Ур.${character.level}`;
  document.getElementById('cityInfo').textContent = `🏰 ${character.city}`;

  createHUDs();
  connectSocket();
  bindInput();
  requestAnimationFrame(renderLoop);
}

// === Табы авторизации ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  };
});

window.doLogin = doLogin;
window.doRegister = doRegister;