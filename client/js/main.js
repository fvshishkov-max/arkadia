// ============================================================
//  АРКАДИЯ: ПОЛЕ БИТВЫ — Клиент v1.4
//  Мир + города + pathfinding + навигатор + добыча
// ============================================================

// === MODULE: stats ===
// === MODULE: monsters ===
// === MODULE: inventory ===
// === MODULE: city-menus ===
// === MODULE: minimap ===
// === MODULE: fix-stats ===
// === MODULE: world-v2 ===
// === MODULE: teleports ===
// === MODULE: biome-access ===
// === MODULE: camera-drag ===
// === MODULE: nav-popup ===
// === MODULE: inventory-v2 ===
// === MODULE: fix-inventory ===
// === MODULE: ui-overhaul ===
// === MODULE: battle-page ===
// === MODULE: group-attack ===
// === MODULE: tile-aggro ===
// === MODULE: monsters-level ===
// === MODULE: monster-text ===
// === API и состояние ===
let token = null;
let character = null;
let socket = null;
let players = new Map();
let myId = null;

// === Canvas ===
let canvas, ctx;

// === Мир ===
const TILE_SIZE = 96;
const MAP_SIZE = 100;
const WORLD_SIZE = TILE_SIZE * MAP_SIZE;

const TILE = {
  GRASS: 0, GRASS_DARK: 1, GRASS_LIGHT: 2,
  TREE: 3, WATER: 4, ROAD: 5, SAND: 6,
  GATE: 7, CITY_GROUND: 8,
  // Биомы
  SNOW: 10, SNOW_DARK: 11,
  LAVA: 12, LAVA_ROCK: 13,
  MOUNTAIN: 14, MOUNTAIN_DARK: 15,
  SWAMP: 16, SWAMP_DARK: 17,
  DESERT: 18, DESERT_DARK: 19,
  TROPIC: 20, TROPIC_DARK: 21,
  MAGIC: 22, MAGIC_LIGHT: 23
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
  [TILE.CITY_GROUND]: '#8a8a7a',
  // Биомы
  [TILE.SNOW]: '#d0d8e0',
  [TILE.SNOW_DARK]: '#b8c0c8',
  [TILE.LAVA]: '#e84a1a',
  [TILE.LAVA_ROCK]: '#4a2a1a',
  [TILE.MOUNTAIN]: '#7a7a7a',
  [TILE.MOUNTAIN_DARK]: '#5a5a5a',
  [TILE.SWAMP]: '#3a4a2a',
  [TILE.SWAMP_DARK]: '#2a3a1a',
  [TILE.DESERT]: '#e0c880',
  [TILE.DESERT_DARK]: '#c8b060',
  [TILE.TROPIC]: '#2a6a4a',
  [TILE.TROPIC_DARK]: '#1a5a3a',
  [TILE.MAGIC]: '#6a3a9a',
  [TILE.MAGIC_LIGHT]: '#8a5aba'
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
  { id: 'valencia', name: 'Валенсия (Луг)',     tileX: 50, tileY: 50, size: 7, color: '#d4af37', biome: 'meadow' },
  { id: 'dragon',   name: 'Драконье Логово (Север)', tileX: 50, tileY: 18, size: 7, color: '#c0392b', biome: 'north' },
  { id: 'elf',      name: 'Эльфийская Роща (Бор)', tileX: 22, tileY: 65, size: 7, color: '#27ae60', biome: 'forest' }
];

// === БИОМЫ ===
const BIOMES = [
  // id, name, centerX, centerY, radius, tile (основной), level (мин. ур.), icon
  { id: 'meadow',  name: '🌸 Луг',            cx: 50, cy: 50, r: 18, tile: TILE.GRASS,        level: 1,  icon: '🌸' },
  { id: 'edge',    name: '🌱 Опушка',         cx: 15, cy: 15, r: 12, tile: TILE.GRASS_LIGHT,  level: 1,  icon: '🌱' },
  { id: 'forest',  name: '🌲 Тёмный бор',     cx: 22, cy: 65, r: 16, tile: TILE.TREE,         level: 5,  icon: '🌲' },
  { id: 'river',   name: '🏞️ Речная долина',  cx: 50, cy: 75, r: 14, tile: TILE.GRASS,        level: 8,  icon: '🏞️' },
  { id: 'swamp',   name: '🍄 Болото',         cx: 15, cy: 85, r: 12, tile: TILE.SWAMP,        level: 10, icon: '🍄' },
  { id: 'desert',  name: '🏜️ Пустошь',        cx: 80, cy: 70, r: 14, tile: TILE.DESERT,       level: 12, icon: '🏜️' },
  { id: 'tropic',  name: '🌴 Тропики',        cx: 85, cy: 40, r: 14, tile: TILE.TROPIC,       level: 15, icon: '🌴' },
  { id: 'north',   name: '❄️ Северный лес',   cx: 50, cy: 15, r: 16, tile: TILE.SNOW,         level: 18, icon: '❄️' },
  { id: 'volcano', name: '🌋 Вулкан',         cx: 82, cy: 15, r: 12, tile: TILE.LAVA_ROCK,    level: 25, icon: '🌋' },
  { id: 'mountain',name: '🏔️ Горы',           cx: 15, cy: 45, r: 12, tile: TILE.MOUNTAIN,     level: 30, icon: '🏔️' },
  { id: 'magic',   name: '🌌 Волшебный сад',  cx: 50, cy: 35, r: 10, tile: TILE.MAGIC,        level: 35, icon: '🌌' }
];

// Определить биом по координатам тайла
function getBiomeAt(tx, ty) {
  let best = null;
  let bestDist = Infinity;
  BIOMES.forEach(b => {
    const d = Math.hypot(tx - b.cx, ty - b.cy);
    if (d < b.r && d < bestDist) {
      bestDist = d;
      best = b;
    }
  });
  return best;
}

// === Сцены ===
let currentScene = 'world';
let currentCity = null;

// === Камера ===
const camera = { x: 0, y: 0 };

// === Отладка ===
window.DEBUG_TILES = false;

// === Навигатор ===
let navTarget = null;

// === Инвентарь ===
const inventory = { wood: 0, herb: 0, acorn: 0, flower: 0 };

// === Добыча ===
let gathering = null;
let lastGatherTime = 0;
const GATHER_COOLDOWN = 1500;

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

  // База — трава Луга
  for (let y = 0; y < MAP_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const r = rand();
      if (r < 0.6) map[y][x] = TILE.GRASS;
      else if (r < 0.8) map[y][x] = TILE.GRASS_DARK;
      else map[y][x] = TILE.GRASS_LIGHT;
    }
  }

  // Накладываем биомы
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const biome = getBiomeAt(x, y);
      if (!biome) continue;
      const r = rand();
      const base = biome.tile;
      // Вариация внутри биома
      if (biome.id === 'north' || biome.id === 'mountain') {
        map[y][x] = r < 0.7 ? base : (base + 1);
      } else if (biome.id === 'volcano') {
        map[y][x] = r < 0.85 ? TILE.LAVA_ROCK : TILE.LAVA;
      } else if (biome.id === 'desert') {
        map[y][x] = r < 0.7 ? TILE.DESERT : TILE.DESERT_DARK;
      } else if (biome.id === 'swamp') {
        map[y][x] = r < 0.7 ? TILE.SWAMP : TILE.SWAMP_DARK;
      } else if (biome.id === 'tropic') {
        map[y][x] = r < 0.7 ? TILE.TROPIC : TILE.TROPIC_DARK;
      } else if (biome.id === 'magic') {
        map[y][x] = r < 0.6 ? TILE.MAGIC : TILE.MAGIC_LIGHT;
      } else if (biome.id === 'forest') {
        map[y][x] = r < 0.6 ? TILE.TREE : TILE.GRASS_DARK;
      }
    }
  }

  // Озеро в Луге
  for (let y = 45; y < 55; y++)
    for (let x = 55; x < 65; x++)
      map[y][x] = TILE.WATER;

  // Дороги от Валенсии
  for (let x = 5; x < 95; x++) map[50][x] = TILE.ROAD;
  for (let y = 5; y < 95; y++) map[y][50] = TILE.ROAD;

  // Города + ворота
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
//  ПРОХОДИМОСТЬ + A*
// ============================================================

function isWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
  const tile = GAME_MAP[ty][tx];
  if (tile === TILE.WATER) return false;
  if (tile === TILE.LAVA) return false;
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
//  ОТРИСОВКА ТАЙЛОВ
// ============================================================

function drawTile(ctx, tile, px, py, wx, wy) {
  ctx.fillStyle = TILE_COLORS[tile];
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  if (tile === TILE.TREE) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(px + 12, py + 20, 8, 12);
    ctx.fillStyle = '#2a6a20';
    ctx.fillRect(px + 4, py + 2, 24, 22);
    ctx.fillStyle = '#3a8a2a';
    ctx.fillRect(px + 6, py + 4, 20, 18);
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

  // Debug номера
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

  // Города
  CITIES.forEach(city => {
    const half = Math.floor(city.size / 2);
    const gx = (city.tileX - half) * TILE_SIZE - camera.x;
    const gy = (city.tileY - half) * TILE_SIZE - camera.y;
    const gw = city.size * TILE_SIZE;
    const gh = city.size * TILE_SIZE;

    ctx.fillStyle = city.color;
    ctx.fillRect(gx, gy, gw, 6);
    ctx.fillRect(gx, gy + gh - 6, gw, 6);
    ctx.fillRect(gx, gy, 6, gh);
    ctx.fillRect(gx + gw - 6, gy, 6, gh);

    const towerSize = 12;
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(gx - 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy - 3, towerSize, towerSize);
    ctx.fillRect(gx - 3, gy + gh - towerSize + 3, towerSize, towerSize);
    ctx.fillRect(gx + gw - towerSize + 3, gy + gh - towerSize + 3, towerSize, towerSize);

    ctx.fillStyle = TILE_COLORS[TILE.CITY_GROUND];
    ctx.fillRect(gx + gw / 2 - TILE_SIZE / 2, gy + gh - 6, TILE_SIZE, 6);

    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(city.name, gx + gw / 2, gy - 10);
    ctx.fillStyle = city.color;
    ctx.fillText(city.name, gx + gw / 2, gy - 10);
  });

  // Подсветка цели навигатора
  if (navTarget) {
    const tx = navTarget.x * TILE_SIZE - camera.x;
    const ty = navTarget.y * TILE_SIZE - camera.y;
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + pulse * 0.3})`;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯', tx + TILE_SIZE / 2, ty - 4);
  }

  // Маршрут
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

  const wallThick = 16;
  ctx.fillStyle = city.color;
  ctx.fillRect(0, 0, cw, wallThick);
  ctx.fillRect(0, ch - wallThick, cw, wallThick);
  ctx.fillRect(0, 0, wallThick, ch);
  ctx.fillRect(cw - wallThick, 0, wallThick, ch);

  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.strokeText(city.name, cw / 2, 40);
  ctx.fillStyle = city.color;
  ctx.fillText(city.name, cw / 2, 40);

  const gateX = cw / 2 - TILE_SIZE;
  const gateY = ch - wallThick - 4;
  ctx.fillStyle = '#3a1a0a';
  ctx.fillRect(gateX, gateY, TILE_SIZE * 2, wallThick + 4);
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('ВЫХОД', cw / 2, ch - 10);

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
//  НАВИГАТОР
// ============================================================

function createNavigatorPanel() {
  if (document.getElementById('navPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'navPanel';
  panel.style.cssText = `
    position: absolute; top: 15px; right: 15px; width: 220px;
    background: rgba(15, 15, 30, 0.92); border: 2px solid #4a4aff;
    border-radius: 8px; padding: 12px; color: #eee;
    font-family: Arial, sans-serif; font-size: 13px;
    z-index: 150; box-shadow: 0 0 20px rgba(74, 74, 255, 0.4);
  `;
  panel.innerHTML = `
    <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px; font-size: 14px;">
      🧭 Навигатор
    </div>
    <div style="margin-bottom: 8px;">
      <input id="navCellInput" type="number" placeholder="ID клетки..." 
        style="width: 100%; padding: 6px; background: #1a1a3e; 
        border: 1px solid #4a4aff; border-radius: 4px; color: #eee; 
        font-size: 12px; box-sizing: border-box;" />
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
      <button id="navFindGrass" style="padding: 6px; background: #2a6a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">🌿 Траву</button>
      <button id="navFindTree" style="padding: 6px; background: #3a5a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">🌲 Дерево</button>
      <button id="navFindBot" style="padding: 6px; background: #6a2a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">👹 Бота</button>
      <button id="navReset" style="padding: 6px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">❌ Сброс</button>
    </div>
    <div id="navStatus" style="font-size: 11px; color: #888; padding-top: 6px; border-top: 1px solid #333; min-height: 16px;">Готов к поиску</div>
  `;
  document.getElementById('gameScreen').appendChild(panel);

  document.getElementById('navCellInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const id = parseInt(e.target.value);
      if (isNaN(id) || id < 0 || id >= MAP_SIZE * MAP_SIZE) {
        setNavStatus('❌ Неверный ID', '#ff6666'); return;
      }
      const tx = id % MAP_SIZE;
      const ty = Math.floor(id / MAP_SIZE);
      goToTile(tx, ty, `Клетка #${id}`);
    }
  });
  document.getElementById('navFindGrass').onclick = () => findNearest('grass');
  document.getElementById('navFindTree').onclick = () => findNearest('tree');
  document.getElementById('navFindBot').onclick = () => setNavStatus('👹 Боты скоро!', '#ffaa44');
  document.getElementById('navReset').onclick = () => resetNav();
}

function setNavStatus(text, color = '#888') {
  const el = document.getElementById('navStatus');
  if (el) { el.textContent = text; el.style.color = color; }
}

function resetNav() {
  navTarget = null;
  const me = players.get(myId) || character;
  if (me) me.path = null;
  setNavStatus('Сброшено', '#888');
  const inp = document.getElementById('navCellInput');
  if (inp) inp.value = '';
}

function goToTile(tx, ty, label) {
  if (currentScene !== 'world') {
    setNavStatus('❌ Сначала выйди из города', '#ff6666'); return;
  }
  if (!isWalkable(tx, ty)) {
    setNavStatus('❌ Клетка непроходима', '#ff6666'); return;
  }
  const me = players.get(myId) || character;
  if (!me) return;
  const startX = Math.floor(me.x / TILE_SIZE);
  const startY = Math.floor(me.y / TILE_SIZE);
  const path = findPath(startX, startY, tx, ty);
  if (!path) { setNavStatus('❌ Путь не найден', '#ff6666'); return; }
  if (path.length === 0) { setNavStatus('📍 Уже там', '#88ff88'); return; }
  me.path = path;
  navTarget = { x: tx, y: ty, label };
  const cellId = ty * MAP_SIZE + tx;
  setNavStatus(`🎯 ${label} (#${cellId}) — ${path.length} шагов`, '#88ff88');
}

function findNearest(type) {
  if (currentScene !== 'world') {
    setNavStatus('❌ Сначала выйди из города', '#ff6666'); return;
  }
  const me = players.get(myId) || character;
  if (!me) return;
  const startX = Math.floor(me.x / TILE_SIZE);
  const startY = Math.floor(me.y / TILE_SIZE);
  let best = null, bestDist = Infinity;
  for (let ty = 0; ty < MAP_SIZE; ty++) {
    for (let tx = 0; tx < MAP_SIZE; tx++) {
      const tile = GAME_MAP[ty][tx];
      let match = false;
      if (type === 'grass') match = (tile === TILE.GRASS || tile === TILE.GRASS_DARK || tile === TILE.GRASS_LIGHT);
      else if (type === 'tree') match = (tile === TILE.TREE);
      if (!match) continue;
      const dist = Math.abs(tx - startX) + Math.abs(ty - startY);
      if (dist < bestDist && dist > 0) { bestDist = dist; best = { x: tx, y: ty }; }
    }
  }
  if (!best) { setNavStatus('❌ Ничего не найдено', '#ff6666'); return; }
  const label = type === 'grass' ? '🌿 Трава' : '🌲 Дерево';
  goToTile(best.x, best.y, label);
}

// ============================================================
//  ДОБЫЧА
// ============================================================

function createGatherButtons() {
  if (document.getElementById('gatherBtn')) return;

  const btn = document.createElement('button');
  btn.id = 'gatherBtn';
  btn.style.cssText = `
    position: absolute; bottom: 100px; left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: linear-gradient(135deg, #2a6a2a, #4a8a35);
    color: white; font-size: 16px; font-weight: bold;
    border: 2px solid #88ff88; border-radius: 8px;
    cursor: pointer; box-shadow: 0 0 15px rgba(74, 255, 74, 0.5);
    z-index: 100; display: none;
  `;
  btn.onclick = startGathering;
  document.getElementById('gameScreen').appendChild(btn);

  const bar = document.createElement('div');
  bar.id = 'gatherProgress';
  bar.style.cssText = `
    position: absolute; bottom: 155px; left: 50%;
    transform: translateX(-50%);
    width: 200px; height: 20px;
    background: rgba(0,0,0,0.7);
    border: 2px solid #88ff88; border-radius: 10px;
    overflow: hidden; z-index: 100; display: none;
  `;
  const fill = document.createElement('div');
  fill.id = 'gatherProgressFill';
  fill.style.cssText = `
    width: 0%; height: 100%;
    background: linear-gradient(90deg, #4a8a35, #88ff88);
    transition: width 0.1s linear;
  `;
  bar.appendChild(fill);
  document.getElementById('gameScreen').appendChild(bar);
}

function createInventoryPanel() {
  if (document.getElementById('invPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'invPanel';
  panel.style.cssText = `
    position: absolute; top: 15px; left: 170px;
    background: rgba(15, 15, 30, 0.92);
    border: 2px solid #4a4aff; border-radius: 8px;
    padding: 10px 14px; color: #eee;
    font-family: Arial, sans-serif; font-size: 12px;
    z-index: 150; min-width: 130px;
    box-shadow: 0 0 15px rgba(74, 74, 255, 0.3);
  `;
  panel.innerHTML = `
    <div style="font-weight: bold; color: #ffd700; margin-bottom: 6px; font-size: 13px;">📦 Инвентарь</div>
    <div style="line-height: 1.6;">
      <div>🪵 Древесина: <span id="invWood">0</span></div>
      <div>🌿 Травы: <span id="invHerb">0</span></div>
      <div>🌰 Жёлудь: <span id="invAcorn">0</span></div>
      <div>🌸 Цветок: <span id="invFlower">0</span></div>
    </div>
  `;
  document.getElementById('gameScreen').appendChild(panel);
}

function updateInventoryHUD() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('invWood', inventory.wood);
  set('invHerb', inventory.herb);
  set('invAcorn', inventory.acorn);
  set('invFlower', inventory.flower);
}

function showGatherButton(text, type) {
  const btn = document.getElementById('gatherBtn');
  if (!btn) return;
  btn.textContent = text;
  btn.dataset.type = type;
  btn.style.display = 'block';
}

function hideGatherButton() {
  const btn = document.getElementById('gatherBtn');
  if (btn) btn.style.display = 'none';
}

function getCurrentTile() {
  const me = players.get(myId) || character;
  if (!me) return null;
  const tx = Math.floor(me.x / TILE_SIZE);
  const ty = Math.floor(me.y / TILE_SIZE);
  if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return null;
  return { x: tx, y: ty, type: GAME_MAP[ty][tx] };
}

function startGathering() {
  if (gathering) return;
  const now = Date.now();
  if (now - lastGatherTime < GATHER_COOLDOWN) return;

  const tile = getCurrentTile();
  if (!tile) return;

  let type = null, duration = 2000;
  if (tile.type === TILE.TREE) { type = 'tree'; duration = 2500; }
  else if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK || tile.type === TILE.GRASS_LIGHT) { type = 'grass'; duration = 1500; }

  if (!type) return;

  gathering = { startTime: now, duration, type };
  document.getElementById('gatherProgress').style.display = 'block';
  document.getElementById('gatherProgressFill').style.width = '0%';
  hideGatherButton();
  console.log(`⛏️ Начал добычу: ${type}`);
}

function updateGathering() {
  if (!gathering) return;
  const elapsed = Date.now() - gathering.startTime;
  const progress = Math.min(elapsed / gathering.duration, 1);
  document.getElementById('gatherProgressFill').style.width = (progress * 100) + '%';
  if (progress >= 1) completeGathering();
}

function completeGathering() {
  const type = gathering.type;
  gathering = null;
  lastGatherTime = Date.now();
  document.getElementById('gatherProgress').style.display = 'none';

  let gained = '';
  if (type === 'tree') {
    const wood = 1 + Math.floor(Math.random() * 3);
    inventory.wood += wood;
    gained = `🪵 +${wood} древесины`;
    if (Math.random() < 0.05) { inventory.acorn += 1; gained += `  🌰 +1 жёлудь!`; }
  } else if (type === 'grass') {
    const herb = 1 + Math.floor(Math.random() * 2);
    inventory.herb += herb;
    gained = `🌿 +${herb} травы`;
    if (Math.random() < 0.1) { inventory.flower += 1; gained += `  🌸 +1 цветок!`; }
  }

  updateInventoryHUD();
  setNavStatus(`✅ ${gained}`, '#88ff88');
  console.log(`✅ Добыто: ${gained}`);
  if (socket) socket.emit('inventory', inventory);
}

// ============================================================
//  КНОПКА ВХОДА В ГОРОД
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

function isOnGateTile(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  return GAME_MAP[ty] && GAME_MAP[ty][tx] === TILE.GATE;
}

function enterCity() {
  const me = players.get(myId) || character;
  if (!me) return;
  let city = null;
  for (const c of CITIES) {
    const half = Math.floor(c.size / 2);
    const gateY = c.tileY + half + 1;
    const tx = Math.floor(me.x / TILE_SIZE);
    const ty = Math.floor(me.y / TILE_SIZE);
    if (tx === c.tileX && ty === gateY) { city = c; break; }
  }
  if (!city) { console.warn('❌ Не на воротах'); return; }
  currentCity = city;
  currentScene = 'city';
  me.cityX = canvas.width / 2;
  me.cityY = canvas.height / 2;
  me.targetCityX = me.cityX;
  me.targetCityY = me.cityY;
  hideEnterButton();
  hideGatherButton();
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
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'i') { toggleInventoryV2(); return; }
    if (e.key === 'Escape' && inventoryOpen) { toggleInventory(); return; }
    if (character && character.stats && character.stats.freePoints > 0) {
      const s = character.stats;
      let stat = null;
      if (e.key === '1') stat = 'str';
      else if (e.key === '2') stat = 'agi';
      else if (e.key === '3') stat = 'int';
      else if (e.key === '4') stat = 'vit';
      else if (e.key === '5') stat = 'luck';
      if (stat) {
        s[stat]++;
        s.freePoints--;
        recalcMaxHP();
        updateStatsHUD();
        console.log(`${stat} → ${s[stat]}`);
      }
    }
    if (e.key.toLowerCase() === 'g') {
      window.DEBUG_TILES = !window.DEBUG_TILES;
      console.log('Debug tiles:', window.DEBUG_TILES);
    }
  });

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (currentScene === 'city') { handleCityClick(mx, my); return; }
    handleWorldClick(mx, my);
  });
}

function checkBiomeAccess(tx, ty) {
  const biome = getBiomeAt(tx, ty);
  if (!biome) return { ok: true };
  const s = character && character.stats;
  const lvl = s ? s.level : 1;
  // Блокировка отключена — можно ходить везде, но показываем предупреждение
  if (lvl < biome.level) {
    setNavStatus(`⚠️ ${biome.name}: рекомендован ур. ${biome.level}+`, '#ffaa44');
  }
  return { ok: true, biome };
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
  document.getElementById('cellInfo').textContent =
    `📍 Клетка #${cellId} (x:${tileX}, y:${tileY}) — ${TILE_NAME[tile]}`;

  // Клик по мобу — теперь просто подсветка, бой начнётся сам при сближении
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    setNavStatus(`⚔️ ${clickedMonster.name} — подойди ближе для боя`, '#ffaa44');
    return;
  }

  // Клик по телепорту?
  const tp = findTeleportAt(worldX, worldY);
  if (tp) {
    openTeleportMenu(tp);
    return;
  }

  // Проверка доступа к биому
  const access = checkBiomeAccess(tileX, tileY);
  if (!access.ok) return;

  if (tile === TILE.WATER) { console.log('❌ Вода'); return; }
  if (tile === TILE.LAVA) { console.log('❌ Лава'); return; }
  if (tile === TILE.CITY_GROUND) { console.log('❌ Город — только через ворота'); return; }

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
  if (my > canvas.height - 40) { exitCity(); return; }

  let clickedBuilding = false;
  CITY_BUILDINGS.forEach(b => {
    const bx = b.tileX * TILE_SIZE;
    const by = b.tileY * TILE_SIZE;
    const bw = TILE_SIZE * 3;
    const bh = TILE_SIZE * 2.5;
    if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
      console.log(`🖱️ Клик по: ${b.name}`);
      openBuildingMenu(b.id);
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
        if (me.path.length === 0) {
          me.path = null;
          if (navTarget) {
            setNavStatus(`✅ Дошли: ${navTarget.label}`, '#88ff88');
            navTarget = null;
          }
        }
      } else {
        const speed = 200 * dt;
        const step = Math.min(dist, speed);
        me.x += (dx / dist) * step;
        me.y += (dy / dist) * step;
        if (socket && Math.random() < 0.3) socket.emit('move', { x: me.x, y: me.y });
      }
    }

    if (me && !cameraFree) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;

      if (isOnGateTile(me.x, me.y)) showEnterButton();
      else hideEnterButton();

      if (!gathering && !me.path) {
        const tile = getCurrentTile();
        if (tile) {
          if (tile.type === TILE.TREE) showGatherButton('🌲 Рубить', 'tree');
          else if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK || tile.type === TILE.GRASS_LIGHT) showGatherButton('🌿 Собирать', 'grass');
          else hideGatherButton();
        }
      } else {
        hideGatherButton();
      }
      updateGathering();
    }
  }

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

    drawTeleports(ctx, camera);
    drawMonsters(ctx, camera);

    players.forEach(p => {
      if (p.id === myId) return;
      const px = p.x - camera.x - 10;
      const py = p.y - camera.y - 10;
      drawPlayer(ctx, px, py, false, p.name);
    });

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
//  МОДУЛЬ: STATS (HP/MP/опыт/статы/смерть)
// ============================================================

// Статы инициализируются в startGame() после логина
function initStats() {
  character.stats = character.stats || {
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    exp: 0,
    expNext: 100,
    level: 1,
    str: 5, agi: 5, int: 5, vit: 5, luck: 5,
    freePoints: 0,
    gold: 0
  };
}

// Пересчёт максимальных HP/MP от статов
function recalcMaxHP() {
  if (!character || !character.stats) return;
  const s = character.stats;
  s.maxHp = 100 + s.vit * 10 + s.str * 2;
  s.maxMp = 50 + s.int * 8;
}

// Опыт за уровень
function expForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.5, lvl - 1));
}

// Получение опыта
function gainExp(amount) {
  if (!character || !character.stats) return;
  const s = character.stats;
  s.exp += amount;
  console.log(`+ ${amount} опыта`);
  while (s.exp >= s.expNext) {
    s.exp -= s.expNext;
    s.level++;
    s.freePoints += 5;
    s.expNext = expForLevel(s.level);
    recalcMaxHP();
    s.hp = s.maxHp;
    s.mp = s.maxMp;
    setNavStatus(`🎉 Уровень ${s.level}!`, '#ffd700');
    console.log(`🎉 LEVEL UP! Уровень ${s.level}`);
  }
  updateStatsHUD();
}

// Урон
function takeDamage(amount) {
  if (!character || !character.stats) return;
  const s = character.stats;
  s.hp = Math.max(0, s.hp - amount);
  updateStatsHUD();
  if (s.hp <= 0) die();
}

function die() {
  setNavStatus('💀 Вы погибли! Респавн...', '#ff4444');
  console.log('💀 Смерть');
  const s = character.stats;
  s.hp = Math.floor(s.maxHp * 0.5);
  s.mp = Math.floor(s.maxMp * 0.5);
  // Телепорт в ближайший город
  const me = players.get(myId) || character;
  if (me) {
    me.path = null;
    me.x = CITIES[0].tileX * TILE_SIZE + TILE_SIZE / 2;
    me.y = (CITIES[0].tileY + Math.floor(CITIES[0].size / 2) + 2) * TILE_SIZE;
    camera.x = me.x - canvas.width / 2;
    camera.y = me.y - canvas.height / 2;
    if (socket) socket.emit('move', { x: me.x, y: me.y });
  }
  updateStatsHUD();
}

// HUD со статами
function createStatsHUD() {
  if (document.getElementById('statsPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'statsPanel';
  panel.style.cssText = `
    position: absolute; top: 60px; left: 15px;
    background: rgba(15, 15, 30, 0.92);
    border: 2px solid #4a4aff; border-radius: 8px;
    padding: 10px 14px; color: #eee;
    font-family: Arial, sans-serif; font-size: 12px;
    z-index: 150; min-width: 180px;
  `;
  panel.innerHTML = `
    <div style="font-weight:bold;color:#ffd700;margin-bottom:6px;">❤️ HP / 🔵 MP</div>
    <div style="margin-bottom:4px;">
      <div style="font-size:10px;color:#ccc;">HP: <span id="hpText">100/100</span></div>
      <div style="width:100%;height:10px;background:#300;border-radius:5px;overflow:hidden;">
        <div id="hpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:10px;color:#ccc;">MP: <span id="mpText">50/50</span></div>
      <div style="width:100%;height:10px;background:#003;border-radius:5px;overflow:hidden;">
        <div id="mpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#2980b9,#3498db);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:10px;color:#ccc;">EXP: <span id="expText">0/100</span></div>
      <div style="width:100%;height:8px;background:#330;border-radius:4px;overflow:hidden;">
        <div id="expBar" style="height:100%;width:0%;background:linear-gradient(90deg,#f39c12,#ffd700);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="border-top:1px solid #333;padding-top:6px;font-size:11px;">
      <div>💰 Золото: <span id="goldText">0</span></div>
      <div>💪 STR: <span id="strText">5</span></div>
      <div>🏃 AGI: <span id="agiText">5</span></div>
      <div>🧠 INT: <span id="intText">5</span></div>
      <div>🛡️ VIT: <span id="vitText">5</span></div>
      <div>🍀 LUCK: <span id="luckText">5</span></div>
      <div id="freePoints" style="color:#ffd700;margin-top:4px;display:none;">
        ✨ Очков: <span id="fpText">0</span>
      </div>
    </div>
  `;
  document.getElementById('gameScreen').appendChild(panel);
}

function updateStatsHUD() {
  if (!character || !character.stats) return;
  const s = character.stats;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('hpText', `${s.hp}/${s.maxHp}`);
  set('mpText', `${s.mp}/${s.maxMp}`);
  set('expText', `${s.exp}/${s.expNext}`);
  set('goldText', s.gold);
  set('strText', s.str);
  set('agiText', s.agi);
  set('intText', s.int);
  set('vitText', s.vit);
  set('luckText', s.luck);
  set('fpText', s.freePoints);

  const hpBar = document.getElementById('hpBar');
  const mpBar = document.getElementById('mpBar');
  const expBar = document.getElementById('expBar');
  if (hpBar) hpBar.style.width = (s.hp / s.maxHp * 100) + '%';
  if (mpBar) mpBar.style.width = (s.mp / s.maxMp * 100) + '%';
  if (expBar) expBar.style.width = (s.exp / s.expNext * 100) + '%';

  const fp = document.getElementById('freePoints');
  if (fp) fp.style.display = s.freePoints > 0 ? 'block' : 'none';
}

// Регенерация
setInterval(() => {
  if (!character || !character.stats) return;
  const s = character.stats;
  if (s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + 1);
  if (s.mp < s.maxMp) s.mp = Math.min(s.maxMp, s.mp + 1);
  updateStatsHUD();
}, 3000);




// ============================================================
//  МОДУЛЬ: MONSTERS (мобы + бой)
// ============================================================

// Типы мобов по уровням 1-50
const MONSTER_TYPES = {
  // === 1-3: Опушка ===
  wolf:      { name: 'Волк',              icon: '🐺', hp: 30,   atk: 5,   def: 1,  exp: 15,   gold: 3,    color: '#666',    level: 1,  biome: 'edge' },
  boar:      { name: 'Кабан',             icon: '🐗', hp: 35,   atk: 6,   def: 2,  exp: 18,   gold: 4,    color: '#6a4a3a', level: 3,  biome: 'edge' },

  // === 4-6: Луг ===
  goblin:    { name: 'Гоблин',            icon: '👹', hp: 60,   atk: 10,  def: 3,  exp: 35,   gold: 8,    color: '#7a4a2a', level: 4,  biome: 'meadow' },
  snake:     { name: 'Змея',              icon: '🐍', hp: 70,   atk: 12,  def: 2,  exp: 42,   gold: 10,   color: '#2a6a2a', level: 6,  biome: 'meadow' },

  // === 7-10: Тёмный бор ===
  orc:       { name: 'Орк',               icon: '👺', hp: 120,  atk: 18,  def: 5,  exp: 80,   gold: 20,   color: '#4a6a2a', level: 7,  biome: 'forest' },
  spider:    { name: 'Паук',              icon: '🕷️', hp: 100,  atk: 22,  def: 3,  exp: 90,   gold: 25,   color: '#1a1a1a', level: 10, biome: 'forest' },

  // === 11-15: Речная долина ===
  scorpion:  { name: 'Скорпион',          icon: '🦂', hp: 200,  atk: 30,  def: 8,  exp: 150,  gold: 45,   color: '#8a6a2a', level: 11, biome: 'river' },
  bandit:    { name: 'Бандит',            icon: '🏴‍☠️', hp: 220,  atk: 35,  def: 10, exp: 170,  gold: 60,   color: '#3a3a5a', level: 15, biome: 'river' },

  // === 16-20: Болото ===
  zombie:    { name: 'Зомби',             icon: '🧟', hp: 350,  atk: 50,  def: 12, exp: 300,  gold: 90,   color: '#4a5a3a', level: 16, biome: 'swamp' },
  kikimora:  { name: 'Кикимора',          icon: '🧙‍♀️', hp: 320,  atk: 60,  def: 8,  exp: 340,  gold: 110,  color: '#5a3a5a', level: 20, biome: 'swamp' },

  // === 21-25: Пустошь ===
  mummy:     { name: 'Мумия',             icon: '🧟‍♂️', hp: 550,  atk: 75,  def: 18, exp: 550,  gold: 180,  color: '#c8a870', level: 21, biome: 'desert' },
  vulture:   { name: 'Гриф',              icon: '🦅', hp: 500,  atk: 85,  def: 15, exp: 600,  gold: 200,  color: '#4a3a2a', level: 25, biome: 'desert' },

  // === 26-30: Тропики ===
  lizard:    { name: 'Ящер',              icon: '🦎', hp: 800,  atk: 110, def: 25, exp: 900,  gold: 300,  color: '#2a8a3a', level: 26, biome: 'tropic' },
  tiger:     { name: 'Тигр',              icon: '🐅', hp: 900,  atk: 130, def: 22, exp: 1100, gold: 380,  color: '#d4a020', level: 30, biome: 'tropic' },

  // === 31-35: Северный лес ===
  icewolf:   { name: 'Ледяной волк',      icon: '🐺', hp: 1200, atk: 160, def: 35, exp: 1500, gold: 500,  color: '#a8d8e8', level: 31, biome: 'north' },
  iceelem:   { name: 'Ледяной элементаль',icon: '❄️', hp: 1400, atk: 180, def: 40, exp: 1800, gold: 620,  color: '#88c8ff', level: 35, biome: 'north' },

  // === 36-42: Вулкан ===
  fireelem:  { name: 'Огненный элементаль',icon: '🔥', hp: 1800, atk: 230, def: 50, exp: 2400, gold: 800,  color: '#e84a1a', level: 36, biome: 'volcano' },
  youngdragon:{name: 'Младший дракон',    icon: '🐉', hp: 2200, atk: 280, def: 60, exp: 3000, gold: 1100, color: '#8a1a1a', level: 42, biome: 'volcano' },

  // === 43-48: Горы ===
  golem:     { name: 'Каменный голем',    icon: '🗿', hp: 2800, atk: 320, def: 80, exp: 4000, gold: 1300, color: '#7a7a7a', level: 43, biome: 'mountain' },
  giant:     { name: 'Горный гигант',     icon: '👹', hp: 3200, atk: 360, def: 75, exp: 4600, gold: 1500, color: '#5a4a3a', level: 48, biome: 'mountain' },

  // === 49-50: Волшебный сад ===
  fairy:     { name: 'Фея',               icon: '🧚', hp: 4000, atk: 450, def: 90, exp: 6000, gold: 2000, color: '#e8a8ff', level: 49, biome: 'magic' },
  guardian:  { name: 'Хранитель сада',    icon: '🌳', hp: 5000, atk: 500, def: 100, exp: 8000, gold: 2500, color: '#3a8a4a', level: 50, biome: 'magic' }
};

// Спавн-зоны: мобы каждого биома
const SPAWN_ZONES = [
  // Опушка (1-3)
  { biome: 'edge',     monster: 'wolf',       count: 8 },
  { biome: 'edge',     monster: 'boar',       count: 6 },

  // Луг (4-6)
  { biome: 'meadow',   monster: 'goblin',     count: 10 },
  { biome: 'meadow',   monster: 'snake',      count: 6 },

  // Тёмный бор (7-10)
  { biome: 'forest',   monster: 'orc',        count: 10 },
  { biome: 'forest',   monster: 'spider',     count: 6 },

  // Речная долина (11-15)
  { biome: 'river',    monster: 'scorpion',   count: 8 },
  { biome: 'river',    monster: 'bandit',     count: 5 },

  // Болото (16-20)
  { biome: 'swamp',    monster: 'zombie',     count: 8 },
  { biome: 'swamp',    monster: 'kikimora',   count: 5 },

  // Пустошь (21-25)
  { biome: 'desert',   monster: 'mummy',      count: 8 },
  { biome: 'desert',   monster: 'vulture',    count: 5 },

  // Тропики (26-30)
  { biome: 'tropic',   monster: 'lizard',     count: 8 },
  { biome: 'tropic',   monster: 'tiger',      count: 4 },

  // Северный лес (31-35)
  { biome: 'north',    monster: 'icewolf',    count: 8 },
  { biome: 'north',    monster: 'iceelem',    count: 4 },

  // Вулкан (36-42)
  { biome: 'volcano',  monster: 'fireelem',   count: 8 },
  { biome: 'volcano',  monster: 'youngdragon',count: 3 },

  // Горы (43-48)
  { biome: 'mountain', monster: 'golem',      count: 6 },
  { biome: 'mountain', monster: 'giant',      count: 3 },

  // Волшебный сад (49-50)
  { biome: 'magic',    monster: 'fairy',      count: 4 },
  { biome: 'magic',    monster: 'guardian',   count: 2 }
];

// Список живых мобов
let monsters = [];
let selectedMonster = null;
let autoFight = false;
let lastAutoAttack = 0;

function spawnMonsters() {
  monsters = [];
  let seed = 54321;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  SPAWN_ZONES.forEach(zone => {
    const biome = BIOMES.find(b => b.id === zone.biome);
    if (!biome) return;
    const type = MONSTER_TYPES[zone.monster];

    for (let i = 0; i < zone.count; i++) {
      // Случайная точка внутри радиуса биома
      let attempts = 0;
      let tx, ty;
      while (attempts < 50) {
        attempts++;
        const angle = rand() * Math.PI * 2;
        const dist = rand() * (biome.r - 1);
        tx = Math.floor(biome.cx + Math.cos(angle) * dist);
        ty = Math.floor(biome.cy + Math.sin(angle) * dist);
        if (tx < 1 || tx >= MAP_SIZE - 1 || ty < 1 || ty >= MAP_SIZE - 1) continue;
        const tile = GAME_MAP[ty][tx];
        if (tile === TILE.WATER || tile === TILE.CITY_GROUND || tile === TILE.GATE || tile === TILE.LAVA) continue;
        if (tile === TILE.MOUNTAIN || tile === TILE.MOUNTAIN_DARK) continue;
        break;
      }
      if (attempts >= 50) continue;

      // Уровень моба ± 4-5 от базового
      const levelMin = Math.max(1, type.level - 4);
      const levelMax = type.level + 5;

      monsters.push({
        id: 'm_' + zone.monster + '_' + i,
        type: zone.monster,
        name: type.name,
        icon: type.icon,
        color: type.color,
        x: tx * TILE_SIZE + TILE_SIZE / 2,
        y: ty * TILE_SIZE + TILE_SIZE / 2,
        hp: type.hp,
        maxHp: type.hp,
        atk: type.atk,
        def: type.def,
        exp: type.exp,
        gold: type.gold,
        level: type.level,
        levelMin,
        levelMax,
        biome: zone.biome,
        alive: true,
        respawnAt: 0
      });
    }
  });
  console.log(`👹 Заспавнено мобов: ${monsters.length} (по 11 биомам)`);
}

// Цвет по уровню моба
function getLevelColor(level) {
  if (level <= 5)   return { bg: 'rgba(50, 150, 50, 0.55)',  border: '#4ade80', text: '#aaffaa' };
  if (level <= 8)   return { bg: 'rgba(70, 170, 60, 0.55)',  border: '#84cc16', text: '#c8ff88' };
  if (level <= 12)  return { bg: 'rgba(140, 180, 50, 0.55)', border: '#a3e635', text: '#e8ff88' };
  if (level <= 16)  return { bg: 'rgba(200, 180, 50, 0.55)', border: '#facc15', text: '#ffea88' };
  if (level <= 20)  return { bg: 'rgba(220, 140, 40, 0.55)', border: '#f59e0b', text: '#ffcc88' };
  if (level <= 25)  return { bg: 'rgba(220, 80, 40, 0.55)',  border: '#ef4444', text: '#ff9988' };
  if (level <= 30)  return { bg: 'rgba(200, 40, 40, 0.55)',  border: '#dc2626', text: '#ff8888' };
  if (level <= 35)  return { bg: 'rgba(130, 60, 180, 0.55)', border: '#a855f7', text: '#e0b8ff' };
  if (level <= 42)  return { bg: 'rgba(90, 40, 140, 0.55)',  border: '#7c3aed', text: '#c8a8ff' };
  if (level <= 48)  return { bg: 'rgba(50, 40, 60, 0.7)',    border: '#4a4a5a', text: '#c0c0c0' };
  return              { bg: 'rgba(200, 160, 40, 0.65)', border: '#ffd700', text: '#fff4b0' };
}

function drawMonsters(ctx, camera) {
  monsters.forEach(m => {
    if (!m.alive) return;
    const px = m.x - camera.x;
    const py = m.y - camera.y;
    if (px < -TILE_SIZE || px > canvas.width + TILE_SIZE) return;
    if (py < -TILE_SIZE || py > canvas.height + TILE_SIZE) return;

    const half = TILE_SIZE / 2;
    const colors = getLevelColor(m.level);

    // Цветной квадрат на клетке
    ctx.fillStyle = colors.bg;
    ctx.fillRect(px - half + 2, py - half + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Рамка
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(px - half + 2, py - half + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Подпись: диапазон уровней (или один уровень если min == max)
    const lvlText = m.levelMin === m.levelMax 
      ? `Ур. ${m.levelMin}` 
      : `Ур. ${m.levelMin}-${m.levelMax}`;

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Обводка
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(lvlText, px, py);

    // Основной текст
    ctx.fillStyle = colors.text;
    ctx.fillText(lvlText, px, py);

    // HP-бар (тонкий, снизу клетки)
    const hpW = TILE_SIZE - 8;
    const hpY = py + half - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px - hpW / 2, hpY, hpW, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - hpW / 2, hpY, hpW * (m.hp / m.maxHp), 5);

    // Иконка только если биом особый (боссы)
    // Обычные мобы — без иконок
  });
}

function findMonsterAt(worldX, worldY) {
  const half = TILE_SIZE / 2;
  for (const m of monsters) {
    if (!m.alive) continue;
    if (Math.abs(worldX - m.x) < half && Math.abs(worldY - m.y) < half) return m;
  }
  return null;
}

function attackMonster(m) {
  const me = players.get(myId) || character;
  if (!me || !m || !m.alive) return;

  // Проверка дистанции
  const dist = Math.hypot(m.x - me.x, m.y - me.y);
  if (dist > 60) {
    // Идём к мобу
    const startX = Math.floor(me.x / TILE_SIZE);
    const startY = Math.floor(me.y / TILE_SIZE);
    const tx = Math.floor(m.x / TILE_SIZE);
    const ty = Math.floor(m.y / TILE_SIZE);
    const path = findPath(startX, startY, tx, ty);
    if (path) {
      me.path = path;
      selectedMonster = m;
      setNavStatus(`⚔️ Иду к ${m.name}`, '#ffaa44');
    }
    return;
  }

  // Урон
  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));
  m.hp -= dmg;

  console.log(`⚔️ Удар ${m.name}: ${dmg}${crit ? ' КРИТ!' : ''}`);

  // Моб бьёт в ответ
  if (m.hp > 0 && Math.random() < 0.7) {
    const mobDmg = Math.max(1, m.atk - Math.floor(s.vit * 0.5));
    takeDamage(mobDmg);
    console.log(`💥 ${m.name} бьёт в ответ: ${mobDmg}`);
  }

  if (m.hp <= 0) killMonster(m);
}

function killMonster(m) {
  m.alive = false;
  m.hp = 0;
  m.respawnAt = Date.now() + 30000; // респавн через 30 сек
  const s = character.stats;
  gainExp(m.exp);
  s.gold += m.gold;
  setNavStatus(`☠️ ${m.name} убит! +${m.exp} опыта, +${m.gold} золота`, '#88ff88');
  updateStatsHUD();
  console.log(`☠️ ${m.name} убит`);
  if (selectedMonster === m) selectedMonster = null;
}

function respawnMonsters() {
  monsters.forEach(m => {
    if (!m.alive && Date.now() >= m.respawnAt) {
      m.alive = true;
      m.hp = m.maxHp;
    }
  });
}

setInterval(respawnMonsters, 3000);

// === ДВИЖЕНИЕ МОБОВ ===
// Каждый моб имеет патрулирование вокруг своей точки спавна
function updateMonstersDisabled(dt) {
  const me = players.get(myId) || character;
  monsters.forEach(m => {
    if (!m.alive) return;

    // Сохраняем "домашнюю" точку
    if (!m.homeX) { m.homeX = m.x; m.homeY = m.y; }
    if (!m.wanderAngle) m.wanderAngle = Math.random() * Math.PI * 2;
    if (!m.wanderTimer) m.wanderTimer = 0;
    if (!m.dir) m.dir = { x: 0, y: 0 };
    if (!m.dirTimer) m.dirTimer = 0;

    // Агро: если игрок близко (< 150px) — идём к нему
    if (me) {
      const distToPlayer = Math.hypot(me.x - m.x, me.y - m.y);
      if (distToPlayer < 150 && distToPlayer > 30) {
        const dx = (me.x - m.x) / distToPlayer;
        const dy = (me.y - m.y) / distToPlayer;
        const speed = 40 * dt;
        m.x += dx * speed;
        m.y += dy * speed;
        return;
      }
    }

    // Патрулирование (wander)
    m.wanderTimer -= dt;
    if (m.wanderTimer <= 0) {
      // Меняем направление
      m.wanderAngle += (Math.random() - 0.5) * Math.PI;
      m.wanderTimer = 1 + Math.random() * 2;
    }

    // Двигаемся от дома не дальше чем 100px
    const distFromHome = Math.hypot(m.x - m.homeX, m.y - m.homeY);
    let moveAngle = m.wanderAngle;
    if (distFromHome > 100) {
      // Возвращаемся домой
      moveAngle = Math.atan2(m.homeY - m.y, m.homeX - m.x);
    }

    const speed = 25 * dt;
    const nx = m.x + Math.cos(moveAngle) * speed;
    const ny = m.y + Math.sin(moveAngle) * speed;

    // Проверяем проходимость
    const tx = Math.floor(nx / TILE_SIZE);
    const ty = Math.floor(ny / TILE_SIZE);
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
      const tile = GAME_MAP[ty][tx];
      if (tile !== TILE.WATER && tile !== TILE.CITY_GROUND && tile !== TILE.LAVA) {
        m.x = nx;
        m.y = ny;
      } else {
        // Отскок — меняем угол
        m.wanderAngle += Math.PI * 0.7;
        m.wanderTimer = 0;
      }
    }
  });
}

// Автобой
function toggleAutoFight() {
  autoFight = !autoFight;
  setNavStatus(autoFight ? '🤖 Автобой ВКЛ' : '🤖 Автобой ВЫКЛ', autoFight ? '#88ff88' : '#888');
}

function updateAutoFight() {
  if (!autoFight) return;
  const me = players.get(myId) || character;
  if (!me) return;
  const now = Date.now();
  if (now - lastAutoAttack < 1200) return;

  // Ищем ближайшего моба
  let nearest = null, bestDist = Infinity;
  monsters.forEach(m => {
    if (!m.alive) return;
    const d = Math.hypot(m.x - me.x, m.y - me.y);
    if (d < bestDist && d < 400) { bestDist = d; nearest = m; }
  });

  if (nearest) {
    lastAutoAttack = now;
    if (bestDist > 50) {
      // Идём к нему
      const startX = Math.floor(me.x / TILE_SIZE);
      const startY = Math.floor(me.y / TILE_SIZE);
      const tx = Math.floor(nearest.x / TILE_SIZE);
      const ty = Math.floor(nearest.y / TILE_SIZE);
      const path = findPath(startX, startY, tx, ty);
      if (path) me.path = path;
    } else {
      attackMonster(nearest);
    }
  }
}

// Кнопка автобоя
function createAutoFightButton() {
  if (document.getElementById('autoFightBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'autoFightBtn';
  btn.textContent = '🤖 Автобой';
  btn.style.cssText = `
    position: absolute; bottom: 60px; right: 15px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #8a2be2, #4a4aff);
    color: white; font-size: 14px; font-weight: bold;
    border: 2px solid #ffd700; border-radius: 8px;
    cursor: pointer; z-index: 100;
  `;
  btn.onclick = toggleAutoFight;
  document.getElementById('gameScreen').appendChild(btn);
}




// ============================================================
//  МОДУЛЬ: INVENTORY (инвентарь-UI + крафт)
// ============================================================

// Рецепты крафта
const RECIPES = [
  { id: 'planks', name: 'Доски', icon: '🪵', need: { wood: 3 }, gives: { planks: 1 } },
  { id: 'herb_potion', name: 'Зелье HP', icon: '🧪', need: { herb: 3 }, gives: { potion: 1 } },
  { id: 'torch', name: 'Факел', icon: '🔥', need: { wood: 1, herb: 1 }, gives: { torch: 1 } },
  { id: 'acorn_meal', name: 'Жёлудевая мука', icon: '🌰', need: { acorn: 2 }, gives: { meal: 1 } }
];

let inventoryOpen = false;
let craftInventory = { planks: 0, potion: 0, torch: 0, meal: 0 };

function toggleInventory() {
  inventoryOpen = !inventoryOpen;
  const panel = document.getElementById('inventoryFullPanel');
  if (panel) panel.style.display = inventoryOpen ? 'block' : 'none';
  if (inventoryOpen) renderInventory();
}

function renderInventory() {
  const panel = document.getElementById('inventoryFullPanel');
  if (!panel) return;

  const allItems = [
    { id: 'wood', name: 'Древесина', icon: '🪵', count: inventory.wood },
    { id: 'herb', name: 'Трава', icon: '🌿', count: inventory.herb },
    { id: 'acorn', name: 'Жёлудь', icon: '🌰', count: inventory.acorn },
    { id: 'flower', name: 'Цветок', icon: '🌸', count: inventory.flower },
    { id: 'planks', name: 'Доски', icon: '🪵', count: craftInventory.planks },
    { id: 'potion', name: 'Зелье HP', icon: '🧪', count: craftInventory.potion },
    { id: 'torch', name: 'Факел', icon: '🔥', count: craftInventory.torch },
    { id: 'meal', name: 'Мука', icon: '🌰', count: craftInventory.meal }
  ];

  let itemsHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">';
  allItems.forEach(it => {
    itemsHtml += `
      <div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:8px;text-align:center;min-height:60px;">
        <div style="font-size:24px;">${it.icon}</div>
        <div style="font-size:10px;color:#ccc;">${it.name}</div>
        <div style="font-size:14px;color:#ffd700;font-weight:bold;">${it.count}</div>
      </div>
    `;
  });
  itemsHtml += '</div>';

  let recipesHtml = '<div style="font-weight:bold;color:#ffd700;margin-bottom:8px;">⚗️ Крафт</div>';
  RECIPES.forEach(r => {
    const canCraft = Object.keys(r.need).every(k => inventory[k] >= r.need[k]);
    const needText = Object.entries(r.need).map(([k, v]) => {
      const names = { wood: '🪵', herb: '🌿', acorn: '🌰', flower: '🌸' };
      return `${names[k]}×${v}`;
    }).join(' ');
    recipesHtml += `
      <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1a3e;border:1px solid #4a4aff;border-radius:6px;padding:8px;margin-bottom:6px;">
        <div>
          <div style="font-size:13px;">${r.icon} ${r.name}</div>
          <div style="font-size:10px;color:#888;">Нужно: ${needText}</div>
        </div>
        <button ${canCraft ? '' : 'disabled'} style="padding:6px 12px;background:${canCraft ? '#2a6a2a' : '#333'};color:white;border:none;border-radius:4px;cursor:${canCraft ? 'pointer' : 'not-allowed'};" onclick="window.craftItem('${r.id}')">Создать</button>
      </div>
    `;
  });

  panel.innerHTML = `
    <div style="font-weight:bold;color:#ffd700;margin-bottom:10px;font-size:16px;">🎒 Инвентарь</div>
    ${itemsHtml}
    ${recipesHtml}
    <div style="font-size:11px;color:#888;margin-top:12px;">Закрыть: клавиша <b>I</b> или Esc</div>
  `;
}

window.craftItem = function(id) {
  const r = RECIPES.find(x => x.id === id);
  if (!r) return;
  const canCraft = Object.keys(r.need).every(k => inventory[k] >= r.need[k]);
  if (!canCraft) return;
  Object.entries(r.need).forEach(([k, v]) => { inventory[k] -= v; });
  Object.entries(r.gives).forEach(([k, v]) => { craftInventory[k] = (craftInventory[k] || 0) + v; });
  updateInventoryHUD();
  renderInventory();
  setNavStatus(`⚗️ Создано: ${r.icon} ${r.name}`, '#88ff88');
  if (socket) socket.emit('inventory', { ...inventory, ...craftInventory });
};

function createInventoryFullPanel() {
  if (document.getElementById('inventoryFullPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'inventoryFullPanel';
  panel.style.cssText = `
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; max-height: 80vh; overflow-y: auto;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #4a4aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-shadow: 0 0 40px rgba(74, 74, 255, 0.6);
  `;
  document.getElementById('gameScreen').appendChild(panel);
}




// ============================================================
//  МОДУЛЬ: CITY MENUS (магазин / больница / арена / ремонт / таверна)
// ============================================================

function openBuildingMenu(buildingId) {
  const s = character.stats;
  if (!s) { alert('Статы не загружены'); return; }

  if (buildingId === 'shop') {
    // Магазин: продать ресурсы
    const woodPrice = 2, herbPrice = 3, acornPrice = 15, flowerPrice = 20;
    const woodValue = inventory.wood * woodPrice;
    const herbValue = inventory.herb * herbPrice;
    const acornValue = inventory.acorn * acornPrice;
    const flowerValue = inventory.flower * flowerPrice;
    const totalValue = woodValue + herbValue + acornValue + flowerValue;

    const msg = `🛒 ТОРГОВЕЦ\n\nВаши ресурсы:\n🪵 Древесина: ${inventory.wood} × ${woodPrice} = ${woodValue}💰\n🌿 Трава: ${inventory.herb} × ${herbPrice} = ${herbValue}💰\n🌰 Жёлудь: ${inventory.acorn} × ${acornPrice} = ${acornValue}💰\n🌸 Цветок: ${inventory.flower} × ${flowerPrice} = ${flowerValue}💰\n\nВсего: ${totalValue}💰\n\nПродать всё?`;

    if (totalValue > 0 && confirm(msg)) {
      s.gold += totalValue;
      inventory.wood = 0;
      inventory.herb = 0;
      inventory.acorn = 0;
      inventory.flower = 0;
      updateInventoryHUD();
      updateStatsHUD();
      setNavStatus(`🛒 Продано за ${totalValue}💰`, '#88ff88');
      if (socket) socket.emit('inventory', inventory);
    }
  } else if (buildingId === 'hospital') {
    const cost = 5;
    if (s.hp >= s.maxHp) {
      alert('🏥 Больница\n\nВы полностью здоровы!');
      return;
    }
    if (s.gold < cost) {
      alert(`🏥 Больница\n\nНе хватает золота.\nНужно: ${cost}💰\nУ вас: ${s.gold}💰`);
      return;
    }
    if (confirm(`🏥 Больница\n\nВосстановить HP за ${cost}💰?`)) {
      s.gold -= cost;
      s.hp = s.maxHp;
      s.mp = s.maxMp;
      updateStatsHUD();
      setNavStatus('🏥 Здоровье восстановлено', '#88ff88');
    }
  } else if (buildingId === 'arena') {
    alert('⚔️ АРЕНА\n\nГрупповые бои скоро!\n\nСкоро можно будет сражаться с другими игроками и NPC.');
  } else if (buildingId === 'repair') {
    alert('🔨 РЕМОНТ\n\nЗдесь можно будет улучшать снаряжение.\n\nФункция в разработке.');
  } else if (buildingId === 'tavern') {
    alert('🍺 ТАВЕРНА\n\nОтдых восстанавливает HP/MP.\n\nСкоро будет доступно.');
  }
}




// ============================================================
//  МОДУЛЬ: MINIMAP
// ============================================================

function createMinimap() {
  if (document.getElementById('minimapContainer')) return;
  const container = document.createElement('div');
  container.id = 'minimapContainer';
  container.style.cssText = `
    position: absolute; bottom: 15px; right: 15px;
    width: 200px; height: 200px;
    background: rgba(10, 10, 25, 0.9);
    border: 2px solid #4a4aff; border-radius: 8px;
    overflow: hidden; z-index: 100;
  `;
  const cv = document.createElement('canvas');
  cv.id = 'minimapCanvas';
  cv.width = 200;
  cv.height = 200;
  cv.style.cssText = 'display:block;';
  container.appendChild(cv);
  document.getElementById('gameScreen').appendChild(container);
}

function drawMinimap() {
  const cv = document.getElementById('minimapCanvas');
  if (!cv) return;
  const mctx = cv.getContext('2d');
  const scale = 200 / (MAP_SIZE * TILE_SIZE); // 200px / мир

  // Фон
  mctx.fillStyle = '#0a0a1a';
  mctx.fillRect(0, 0, 200, 200);

  // Тайлы (каждый 4-й для скорости)
  for (let ty = 0; ty < MAP_SIZE; ty += 2) {
    for (let tx = 0; tx < MAP_SIZE; tx += 2) {
      const tile = GAME_MAP[ty][tx];
      const col = TILE_COLORS[tile];
      mctx.fillStyle = col;
      mctx.fillRect(
        tx * TILE_SIZE * scale,
        ty * TILE_SIZE * scale,
        TILE_SIZE * scale * 2 + 1,
        TILE_SIZE * scale * 2 + 1
      );
    }
  }

  // Города — метки
  CITIES.forEach(city => {
    mctx.fillStyle = city.color;
    mctx.beginPath();
    mctx.arc(
      city.tileX * TILE_SIZE * scale,
      city.tileY * TILE_SIZE * scale,
      4, 0, Math.PI * 2
    );
    mctx.fill();
    mctx.strokeStyle = 'black';
    mctx.lineWidth = 1;
    mctx.stroke();
  });

  // Мобы (если модуль установлен)
  if (typeof monsters !== 'undefined' && monsters) {
    mctx.fillStyle = '#ff4444';
    monsters.forEach(m => {
      if (!m.alive) return;
      mctx.fillRect(
        m.x * scale - 1, m.y * scale - 1, 2, 2
      );
    });
  }

  // Игрок
  const me = players.get(myId) || character;
  if (me) {
    mctx.fillStyle = '#ffd700';
    mctx.beginPath();
    mctx.arc(me.x * scale, me.y * scale, 3, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 1;
    mctx.stroke();
  }

  // Цель навигатора
  if (navTarget) {
    mctx.strokeStyle = '#00ff00';
    mctx.lineWidth = 2;
    mctx.strokeRect(
      navTarget.x * TILE_SIZE * scale - 2,
      navTarget.y * TILE_SIZE * scale - 2,
      6, 6
    );
  }

  // Обводка
  mctx.strokeStyle = '#4a4aff';
  mctx.lineWidth = 2;
  mctx.strokeRect(0, 0, 200, 200);
}

// Обновляем миникарту каждые 200 мс
setInterval(drawMinimap, 200);




// ============================================================
//  МОДУЛЬ: TELEPORTS (порталы между биомами)
// ============================================================

// Портал в каждом биоме
const TELEPORTS = [
  { id: 'meadow',  name: '🌸 Луг',             biome: 'meadow',   tileX: 45, tileY: 45, cost: 0,    icon: '🌸' },
  { id: 'edge',    name: '🌱 Опушка',          biome: 'edge',     tileX: 15, tileY: 15, cost: 10,   icon: '🌱' },
  { id: 'forest',  name: '🌲 Тёмный бор',      biome: 'forest',   tileX: 22, tileY: 65, cost: 25,   icon: '🌲' },
  { id: 'river',   name: '🏞️ Речная долина',   biome: 'river',    tileX: 50, tileY: 75, cost: 50,   icon: '🏞️' },
  { id: 'swamp',   name: '🍄 Болото',          biome: 'swamp',    tileX: 15, tileY: 85, cost: 100,  icon: '🍄' },
  { id: 'desert',  name: '🏜️ Пустошь',         biome: 'desert',   tileX: 80, tileY: 70, cost: 150,  icon: '🏜️' },
  { id: 'tropic',  name: '🌴 Тропики',         biome: 'tropic',   tileX: 85, tileY: 40, cost: 250,  icon: '🌴' },
  { id: 'north',   name: '❄️ Северный лес',    biome: 'north',    tileX: 50, tileY: 15, cost: 400,  icon: '❄️' },
  { id: 'volcano', name: '🌋 Вулкан',          biome: 'volcano',  tileX: 82, tileY: 15, cost: 600,  icon: '🌋' },
  { id: 'mountain',name: '🏔️ Горы',            biome: 'mountain', tileX: 15, tileY: 45, cost: 900,  icon: '🏔️' },
  { id: 'magic',   name: '🌌 Волшебный сад',   biome: 'magic',    tileX: 50, tileY: 35, cost: 1500, icon: '🌌' }
];

let teleportMenuOpen = false;

function findTeleportAt(worldX, worldY) {
  for (const t of TELEPORTS) {
    const px = t.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = t.tileY * TILE_SIZE + TILE_SIZE / 2;
    if (Math.abs(worldX - px) < 20 && Math.abs(worldY - py) < 20) return t;
  }
  return null;
}

function drawTeleports(ctx, camera) {
  TELEPORTS.forEach(t => {
    const px = t.tileX * TILE_SIZE - camera.x;
    const py = t.tileY * TILE_SIZE - camera.y;
    if (px < -60 || px > canvas.width + 60) return;
    if (py < -60 || py > canvas.height + 60) return;

    // Вращающийся круг
    const t2 = Date.now() / 500;
    const pulse = (Math.sin(t2) + 1) / 2;

    // Внешнее кольцо
    ctx.strokeStyle = `rgba(138, 90, 255, ${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 14 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Внутреннее кольцо
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Ядро
    ctx.fillStyle = `rgba(200, 150, 255, ${0.5 + pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Иконка
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t.icon, px + 16, py - 6);

    // Стоимость
    if (t.cost > 0) {
      ctx.font = 'bold 10px Arial';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.strokeText(`${t.cost}💰`, px + 16, py + 40);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`${t.cost}💰`, px + 16, py + 40);
    }
  });
}

function openTeleportMenu(fromTeleport) {
  if (teleportMenuOpen) return;
  teleportMenuOpen = true;

  const panel = document.createElement('div');
  panel.id = 'teleportMenu';
  panel.style.cssText = `
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; max-height: 80vh; overflow-y: auto;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #8a5aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif; font-size: 14px;
    z-index: 300;
    box-shadow: 0 0 50px rgba(138, 90, 255, 0.7);
  `;

  const s = character.stats;
  let html = `<div style="font-weight:bold;color:#8a5aff;margin-bottom:12px;font-size:18px;">🌀 Телепорт: ${fromTeleport.name}</div>`;
  html += `<div style="font-size:12px;color:#888;margin-bottom:12px;">У вас: <span style="color:#ffd700">${s.gold}💰</span></div>`;
  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">`;

  TELEPORTS.forEach(t => {
    if (t.id === fromTeleport.id) return;
    const canAfford = s.gold >= t.cost;
    const bg = canAfford ? '#2a4a6a' : '#333';
    const cursor = canAfford ? 'pointer' : 'not-allowed';
    const color = canAfford ? 'white' : '#666';
    html += `
      <div onclick="${canAfford ? `window.doTeleport('${t.id}')` : ''}" 
        style="background:${bg};border:1px solid #4a4aff;border-radius:6px;padding:10px;cursor:${cursor};color:${color};">
        <div style="font-size:16px;">${t.icon} ${t.name}</div>
        <div style="font-size:11px;color:#ffd700;">${t.cost === 0 ? 'Бесплатно' : t.cost + '💰'}</div>
      </div>
    `;
  });

  html += `</div>`;
  html += `<div style="margin-top:16px;text-align:center;font-size:11px;color:#888;">
    <button onclick="window.closeTeleportMenu()" style="padding:8px 20px;background:#444;color:white;border:none;border-radius:6px;cursor:pointer;">Закрыть</button>
  </div>`;

  panel.innerHTML = html;
  document.getElementById('gameScreen').appendChild(panel);
}

window.closeTeleportMenu = function() {
  teleportMenuOpen = false;
  const el = document.getElementById('teleportMenu');
  if (el) el.remove();
};

window.doTeleport = function(targetId) {
  const me = players.get(myId) || character;
  if (!me) return;
  const fromT = findTeleportAt(me.x, me.y);
  const toT = TELEPORTS.find(t => t.id === targetId);
  if (!toT) return;
  const s = character.stats;

  if (s.gold < toT.cost) {
    setNavStatus('❌ Не хватает золота', '#ff6666');
    window.closeTeleportMenu();
    return;
  }

  s.gold -= toT.cost;
  updateStatsHUD();
  me.x = toT.tileX * TILE_SIZE + TILE_SIZE / 2;
  me.y = toT.tileY * TILE_SIZE + TILE_SIZE / 2;
  me.path = null;
  camera.x = me.x - canvas.width / 2;
  camera.y = me.y - canvas.height / 2;
  if (socket) socket.emit('move', { x: me.x, y: me.y });
  setNavStatus(`🌀 Телепорт: ${toT.name}`, '#8a5aff');
  window.closeTeleportMenu();
  console.log(`🌀 Телепорт в ${toT.name}, потрачено ${toT.cost}💰`);
};



// ============================================================
//  МОДУЛЬ: CAMERA DRAG (перетаскивание карты мышью)
// ============================================================

let dragState = { active: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0, moved: false };
let cameraFree = false;   // камера отвязана от игрока
let cameraReturnTimer = null;

function setupCameraDrag() {
  if (!canvas) return;

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 2) return; // только правая кнопка мыши
    e.preventDefault();
    dragState.active = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.camStartX = camera.x;
    dragState.camStartY = camera.y;
    dragState.moved = false;
    cameraFree = true;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!dragState.active) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
    camera.x = dragState.camStartX - dx;
    camera.y = dragState.camStartY - dy;
    // Ограничения
    camera.x = Math.max(-100, Math.min(WORLD_SIZE - canvas.width + 100, camera.x));
    camera.y = Math.max(-100, Math.min(WORLD_SIZE - canvas.height + 100, camera.y));
  });

  window.addEventListener('mouseup', e => {
    if (e.button !== 2) return;
    dragState.active = false;
    canvas.style.cursor = 'default';
    // Возврат к игроку через 3 сек
    if (cameraReturnTimer) clearTimeout(cameraReturnTimer);
    cameraReturnTimer = setTimeout(() => {
      cameraFree = false;
    }, 3000);
  });

  // Блокируем контекстное меню на правую кнопку
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Левая кнопка — если была drag (сдвиг) — не кликаем
  canvas.addEventListener('click', e => {
    if (dragState.moved) {
      dragState.moved = false;
      e.stopPropagation();
      return;
    }
  }, true);
}

// В renderLoop — если камера свободна, не следуем за игроком


// ============================================================
//  МОДУЛЬ: NAV POPUP (навигатор как всплывающее окно)
// ============================================================

let navPopupOpen = false;

function createNavButton() {
  if (document.getElementById('navToggleBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'navToggleBtn';
  btn.textContent = '🧭';
  btn.style.cssText = `
    position: absolute; top: 15px; right: 15px;
    width: 50px; height: 50px;
    background: linear-gradient(135deg, #4a4aff, #8a2be2);
    color: white; font-size: 24px;
    border: 2px solid #ffd700; border-radius: 8px;
    cursor: pointer; z-index: 160;
    box-shadow: 0 0 15px rgba(74, 74, 255, 0.6);
  `;
  btn.onclick = toggleNavPopup;
  document.getElementById('gameScreen').appendChild(btn);
}

function toggleNavPopup() {
  navPopupOpen = !navPopupOpen;
  const panel = document.getElementById('navPanel');
  if (panel) panel.style.display = navPopupOpen ? 'block' : 'none';
}

// Скрываем панель по умолчанию
function setupNavPopup() {
  const panel = document.getElementById('navPanel');
  if (panel) {
    panel.style.display = 'none';
    // Добавляем кнопку закрытия в панель
    if (!document.getElementById('navCloseBtn')) {
      const closeBtn = document.createElement('button');
      closeBtn.id = 'navCloseBtn';
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = `
        position: absolute; top: 5px; right: 5px;
        width: 20px; height: 20px;
        background: transparent; color: #888;
        border: none; cursor: pointer; font-size: 14px;
      `;
      closeBtn.onclick = () => { navPopupOpen = false; panel.style.display = 'none'; };
      panel.style.position = 'absolute';
      panel.appendChild(closeBtn);
    }
  }
  createNavButton();
}



// ============================================================
//  МОДУЛЬ: INVENTORY V2 (персонаж + снаряжение + сетка)
// ============================================================

let invV2Open = false;
let invTab = 'all'; // all / plants / potions / weapons / misc

// Экипировка инициализируется в startGame() после логина
function initEquipment() {
  if (!character) return;
  character.equipment = character.equipment || {
    head: null, body: null, legs: null, boots: null,
    weapon: null, shield: null, ring: null, amulet: null
  };
}

// Категории инвентаря
const INV_CATEGORIES = {
  all:     { name: '📦 Всё',         icon: '📦' },
  plants:  { name: '🌿 Растения',    icon: '🌿' },
  potions: { name: '🧪 Зелья',       icon: '🧪' },
  weapons: { name: '⚔️ Оружие',      icon: '⚔️' },
  misc:    { name: '🎁 Разное',      icon: '🎁' }
};

// Классификация предметов
function getItemCategory(itemId) {
  if (['wood', 'herb', 'acorn', 'flower'].includes(itemId)) return 'plants';
  if (['potion', 'planks', 'meal', 'torch'].includes(itemId)) return 'misc';
  return 'misc';
}

const ITEM_INFO = {
  wood:   { name: 'Древесина', icon: '🪵' },
  herb:   { name: 'Трава',     icon: '🌿' },
  acorn:  { name: 'Жёлудь',    icon: '🌰' },
  flower: { name: 'Цветок',    icon: '🌸' },
  planks: { name: 'Доски',     icon: '🪵' },
  potion: { name: 'Зелье HP',  icon: '🧪' },
  torch:  { name: 'Факел',     icon: '🔥' },
  meal:   { name: 'Мука',      icon: '🌰' }
};

function createInventoryV2() {
  if (document.getElementById('invV2Panel')) return;
  const panel = document.createElement('div');
  panel.id = 'invV2Panel';
  panel.style.cssText = `
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #0a0a1a 0%, #15152e 100%);
    padding: 30px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-sizing: border-box;
    overflow-y: auto;
  `;
  document.getElementById('gameScreen').appendChild(panel);
  renderInventoryV2();
}

function toggleInventoryV2() {
  invV2Open = !invV2Open;
  const panel = document.getElementById('invV2Panel');
  if (!panel) return;
  panel.style.display = invV2Open ? 'block' : 'none';
  if (invV2Open) renderInventoryV2();
}

function renderInventoryV2() {
  const panel = document.getElementById('invV2Panel');
  if (!panel) return;
  if (!character || !character.equipment) return;

  const s = character.stats || { hp: 0, maxHp: 100, level: 1, gold: 0 };
  const eq = character.equipment;

  // Левая часть — персонаж + снаряжение
  const leftPart = `
    <div style="display:flex;gap:20px;">
      <div style="width:200px;">
        <div style="font-weight:bold;color:#ffd700;margin-bottom:10px;font-size:16px;">👤 ${character.name}</div>
        <div style="background:linear-gradient(135deg,#1a1a3e,#2a2a5e);border:2px solid #4a4aff;border-radius:8px;height:220px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;position:relative;">
          <div style="font-size:60px;">🧙</div>
          <div style="position:absolute;top:5px;left:5px;font-size:11px;color:#ffd700;">Ур. ${s.level}</div>
        </div>
        <div style="font-size:12px;">
          <div>❤️ HP: ${s.hp}/${s.maxHp}</div>
          <div>💰 Золото: ${s.gold}</div>
        </div>
      </div>

      <div style="width:80px;display:flex;flex-direction:column;justify-content:space-around;">
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Шлем">${eq.head ? '🪖' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Броня">${eq.body ? '🛡️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Штаны">${eq.legs ? '👖' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Сапоги">${eq.boots ? '🥾' : '⬜'}</div>
      </div>

      <div style="width:80px;display:flex;flex-direction:column;justify-content:space-around;">
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Оружие">${eq.weapon ? '⚔️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Щит">${eq.shield ? '🛡️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Кольцо">${eq.ring ? '💍' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Амулет">${eq.amulet ? '📿' : '⬜'}</div>
      </div>
    </div>
  `;

  // Правая часть — инвентарь с вкладками
  const tabsHtml = Object.entries(INV_CATEGORIES).map(([id, cat]) => 
    `<button onclick="window.setInvTab('${id}')" style="padding:6px 12px;background:${invTab === id ? '#4a4aff' : '#1a1a3e'};color:white;border:1px solid #4a4aff;border-radius:6px;cursor:pointer;font-size:12px;">${cat.name}</button>`
  ).join('');

  // Собираем предметы
  const allItems = [
    { id: 'wood', count: inventory.wood },
    { id: 'herb', count: inventory.herb },
    { id: 'acorn', count: inventory.acorn },
    { id: 'flower', count: inventory.flower },
    { id: 'planks', count: craftInventory.planks || 0 },
    { id: 'potion', count: craftInventory.potion || 0 },
    { id: 'torch', count: craftInventory.torch || 0 },
    { id: 'meal', count: craftInventory.meal || 0 }
  ].filter(it => {
    if (it.count <= 0) return false;
    if (invTab === 'all') return true;
    return getItemCategory(it.id) === invTab;
  });

  const slotsHtml = allItems.length === 0 
    ? `<div style="color:#666;text-align:center;padding:40px;">Пусто</div>`
    : allItems.map(it => {
        const info = ITEM_INFO[it.id] || { name: it.id, icon: '❓' };
        return `
          <div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:10px;text-align:center;">
            <div style="font-size:28px;">${info.icon}</div>
            <div style="font-size:10px;color:#ccc;">${info.name}</div>
            <div style="font-size:14px;color:#ffd700;font-weight:bold;">${it.count}</div>
          </div>
        `;
      }).join('');

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
      <div style="font-weight:bold;color:#ffd700;font-size:18px;">🎒 Инвентарь</div>
      <button onclick="window.toggleInventoryV2()" style="background:transparent;border:none;color:#888;font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div style="display:flex;gap:20px;height:calc(100% - 60px);">
      <div style="width:380px;">${leftPart}</div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">${tabsHtml}</div>
        <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-content:start;">
          ${slotsHtml}
        </div>
      </div>
    </div>
  `;
}

window.setInvTab = function(tab) {
  invTab = tab;
  renderInventoryV2();
};

window.toggleInventoryV2 = toggleInventoryV2;



// ============================================================
//  МОДУЛЬ: BATTLE PAGE (бой как отдельная страница)
// ============================================================

// Состояние боя
let battle = null;
// battle = {
//   monster,      — текущий моб
//   myHp, myMaxHp,
//   log,          — массив строк
//   turn,         — 'player' | 'monster' | 'idle'
//   auto: false,
//   onWin, onLose — колбэки
// }

// Количество мобов по уровню игрока
function getMonsterCount() {
  const s = character.stats;
  const lvl = s ? s.level : 1;
  return Math.min(10, 1 + Math.floor((lvl - 1) / 3));
}

function startBattle(monster) {
  const me = players.get(myId) || character;
  if (!me || !monster || !monster.alive) return;
  if (battle) return;

  const s = character.stats;
  const count = getMonsterCount();

  // Собираем группу: текущий моб + ближайшие того же типа
  const group = [monster];
  const candidates = monsters
    .filter(m => m.alive && m !== monster && m.type === monster.type)
    .map(m => ({ m, d: Math.hypot(m.x - monster.x, m.y - monster.y) }))
    .sort((a, b) => a.d - b.d);
  for (const c of candidates) {
    if (group.length >= count) break;
    if (c.d < TILE_SIZE * 8) group.push(c.m); // в радиусе 8 клеток
  }

  // Итоговые статы группы — суммируем HP и атаку
  const totalHp = group.reduce((sum, m) => sum + m.maxHp, 0);
  const totalAtk = group.reduce((sum, m) => sum + m.atk, 0);
  const totalExp = group.reduce((sum, m) => sum + m.exp, 0);
  const totalGold = group.reduce((sum, m) => sum + m.gold, 0);

  battle = {
    monsters: group,
    monster: group[0], // первый для отображения иконки
    groupCount: group.length,
    myHp: s.hp,
    myMaxHp: s.maxHp,
    monsterHp: totalHp,
    monsterMaxHp: totalHp,
    totalExp,
    totalGold,
    log: [`⚔️ Бой начался: ${group.length}× ${monster.name} (ур. ${monster.level})`],
    turn: 'player',
    auto: false,
    lastPlayerAttack: 0
  };

  me.path = null;
  autoFight = false;

  renderBattlePage();
  console.log(`⚔️ Бой с ${group.length}× ${monster.name}`);
}

function endBattle(win) {
  if (!battle) return;
  const me = players.get(myId) || character;
  const s = character.stats;

  if (win) {
    s.hp = battle.myHp;
    // Убиваем всех
    battle.monsters.forEach(m => {
      m.alive = false;
      m.respawnAt = Date.now() + 30000;
    });
    gainExp(battle.totalExp);
    s.gold += battle.totalGold;
    setNavStatus(
      `☠️ Победа! ${battle.groupCount}× ${battle.monster.name} — +${battle.totalExp} опыта, +${battle.totalGold} золота`,
      '#88ff88'
    );
  } else {
    s.hp = 1;
    setNavStatus('💀 Вы проиграли бой', '#ff4444');
  }

  updateStatsHUD();
  battle = null;
  closeBattlePage();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
}

function closeBattlePage() {
  const el = document.getElementById('battlePage');
  if (el) el.remove();
}

function renderBattlePage() {
  if (!battle) return;
  closeBattlePage();

  const me = players.get(myId) || character;
  const m = battle.monster;
  const s = character.stats;

  const page = document.createElement('div');
  page.id = 'battlePage';
  page.style.cssText = `
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(180deg, #1a0a2a 0%, #0a0510 100%);
    color: #eee;
    font-family: Arial, sans-serif;
    z-index: 400;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  `;

  // HP % для баров
  const myPct = (battle.myHp / battle.myMaxHp) * 100;
  const mobPct = (battle.monsterHp / battle.monsterMaxHp) * 100;

  // Строки лога
  const logHtml = battle.log.slice(-6).map(line => `<div style="margin: 2px 0;">${line}</div>`).join('');

  page.innerHTML = `
    <!-- Верхняя полоса: HP/MP игрока и моба -->
    <div style="display:flex;justify-content:space-between;padding:15px 30px;background:rgba(0,0,0,0.5);border-bottom:2px solid #8a5aff;">
      <div style="width:35%;">
        <div style="font-size:14px;color:#ffd700;font-weight:bold;">${me.name} • Ур. ${s.level}</div>
        <div style="font-size:11px;color:#ccc;">❤️ ${battle.myHp} / ${battle.myMaxHp}</div>
        <div style="height:16px;background:#300;border:2px solid #000;border-radius:8px;overflow:hidden;margin-top:4px;">
          <div style="height:100%;width:${myPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
        </div>
      </div>
      <div style="font-size:24px;color:#ff4444;align-self:center;">⚔️ VS ⚔️</div>
      <div style="width:35%;text-align:right;">
        <div style="font-size:14px;color:#ffaa44;font-weight:bold;">${battle.groupCount}× ${m.name} • Ур. ${m.level}</div>
        <div style="font-size:11px;color:#ccc;">❤️ ${battle.monsterHp} / ${battle.monsterMaxHp}</div>
        <div style="height:16px;background:#300;border:2px solid #000;border-radius:8px;overflow:hidden;margin-top:4px;">
          <div style="height:100%;width:${mobPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;margin-left:auto;"></div>
        </div>
      </div>
    </div>

    <!-- Основная сцена боя -->
    <div style="flex:1;display:flex;justify-content:space-around;align-items:center;padding:20px;">
      <!-- Игрок -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ffd700);">🧙</div>
        <div style="font-size:16px;color:#ffd700;margin-top:10px;">${me.name}</div>
        <div style="font-size:12px;color:#888;">HP: ${battle.myHp}/${battle.myMaxHp}</div>
      </div>

      <!-- Мобы (группа) -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ff4444);">
          ${battle.monster.icon}${battle.groupCount > 1 ? `<span style="font-size:40px;color:#ffd700;vertical-align:top;">×${battle.groupCount}</span>` : ''}
        </div>
        <div style="font-size:16px;color:#ffaa44;margin-top:10px;">${battle.groupCount}× ${battle.monster.name}</div>
        <div style="font-size:12px;color:#888;">HP группы: ${battle.monsterHp}/${battle.monsterMaxHp}</div>
      </div>
    </div>

    <!-- Лог боя -->
    <div style="margin:0 30px;background:rgba(0,0,0,0.6);border:2px solid #4a4aff;border-radius:8px;padding:10px;height:140px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;">
      ${logHtml}
    </div>

    <!-- Панель действий -->
    <div style="display:flex;justify-content:center;gap:15px;padding:20px;background:rgba(0,0,0,0.5);border-top:2px solid #8a5aff;">
      <button onclick="window.battleAttack()" style="padding:14px 28px;background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:16px;font-weight:bold;border:2px solid #ffd700;border-radius:8px;cursor:pointer;">⚔️ Атака</button>
      <button onclick="window.battleAuto()" id="battleAutoBtn" style="padding:14px 28px;background:linear-gradient(135deg,#4a4aff,#8a2be2);color:white;font-size:16px;font-weight:bold;border:2px solid #ffd700;border-radius:8px;cursor:pointer;">🤖 Авто</button>
      <button onclick="window.battleFlee()" style="padding:14px 28px;background:linear-gradient(135deg,#555,#333);color:white;font-size:16px;font-weight:bold;border:2px solid #888;border-radius:8px;cursor:pointer;">🏃 Побег</button>
    </div>
  `;

  document.getElementById('gameScreen').appendChild(page);
}

function battleLog(text) {
  if (!battle) return;
  battle.log.push(text);
  renderBattlePage();
}

window.battleAttack = function() {
  if (!battle || battle.turn !== 'player') return;
  const now = Date.now();
  if (now - battle.lastPlayerAttack < 800) return;
  battle.lastPlayerAttack = now;

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  battle.monsterHp -= dmg;
  battle.log.push(`⚔️ Ты бьёшь ${battle.monster.name}×${battle.groupCount}: ${dmg}${crit ? ' 💥 КРИТ!' : ''}`);

  if (battle.monsterHp <= 0) {
    battle.log.push(`☠️ Вся группа побеждена!`);
    renderBattlePage();
    setTimeout(() => endBattle(true), 800);
    return;
  }

  // Группа бьёт в ответ — каждый моб
  renderBattlePage();
  setTimeout(() => {
    if (!battle) return;
    let totalMobDmg = 0;
    for (let i = 0; i < battle.groupCount; i++) {
      // Каждый моб бьёт с шансом 70%
      if (Math.random() < 0.7) {
        totalMobDmg += Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      }
    }
    if (totalMobDmg > 0) {
      battle.myHp -= totalMobDmg;
      battle.log.push(`💥 Группа бьёт в ответ: ${totalMobDmg}`);
    }

    if (battle.myHp <= 0) {
      battle.log.push('💀 Ты побеждён...');
      renderBattlePage();
      setTimeout(() => endBattle(false), 800);
      return;
    }
    renderBattlePage();
  }, 500);
};

window.battleAuto = function() {
  if (!battle) return;
  battle.auto = !battle.auto;
  const btn = document.getElementById('battleAutoBtn');
  if (btn) {
    btn.textContent = battle.auto ? '🤖 Авто ВКЛ' : '🤖 Авто';
    btn.style.background = battle.auto 
      ? 'linear-gradient(135deg,#2a8a35,#4ade80)' 
      : 'linear-gradient(135deg,#4a4aff,#8a2be2)';
  }
  battle.log.push(battle.auto ? '🤖 Автобой включён' : '⏸️ Автобой выключен');
  renderBattlePage();
};

window.battleFlee = function() {
  if (!battle) return;
  if (Math.random() < 0.5) {
    battle.log.push('🏃 Ты сбежал!');
    renderBattlePage();
    setTimeout(() => {
      const me = players.get(myId) || character;
      const s = character.stats;
      s.hp = battle.myHp;
      updateStatsHUD();
      battle = null;
      closeBattlePage();
    }, 600);
  } else {
    battle.log.push('❌ Побег не удался!');
    renderBattlePage();
    setTimeout(() => {
      if (!battle) return;
      const s = character.stats;
      let mobDmg = 0;
      for (let i = 0; i < battle.groupCount; i++) {
        if (Math.random() < 0.7) mobDmg += Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      }
      battle.myHp -= mobDmg;
      battle.log.push(`💥 Группа бьёт: ${mobDmg}`);
      if (battle.myHp <= 0) {
        battle.log.push('💀 Ты побеждён...');
        renderBattlePage();
        setTimeout(() => endBattle(false), 800);
        return;
      }
      renderBattlePage();
    }, 500);
  }
};

// Авто-атака в бою
setInterval(() => {
  if (!battle || !battle.auto) return;
  if (battle.turn !== 'player') return;
  window.battleAttack();
}, 900);

// ============================================================
//  АГРЕССИВНЫЕ МОБЫ
// ============================================================

// === АГРО: моб атакует только если игрок стоит на ТОЙ ЖЕ клетке ===
// + проверка раз в 2-5 минут рандомно, чтобы не грузить сервер

let lastAggroCheck = 0;
let nextAggroDelay = 120000 + Math.random() * 180000; // 2-5 минут

function checkTileAggro() {
  if (battle) return;
  if (currentScene !== 'world') return;
  const me = players.get(myId) || character;
  if (!me) return;

  const now = Date.now();
  if (now - lastAggroCheck < nextAggroDelay) return;
  lastAggroCheck = now;
  // Пересчитываем следующую задержку (2-5 мин)
  nextAggroDelay = 120000 + Math.random() * 180000;

  // Клетка игрока
  const myTileX = Math.floor(me.x / TILE_SIZE);
  const myTileY = Math.floor(me.y / TILE_SIZE);

  // Ищем мобов на ТОЙ ЖЕ клетке
  const sameTileMonsters = monsters.filter(m => {
    if (!m.alive) return false;
    const mTileX = Math.floor(m.x / TILE_SIZE);
    const mTileY = Math.floor(m.y / TILE_SIZE);
    return mTileX === myTileX && mTileY === myTileY;
  });

  if (sameTileMonsters.length > 0) {
    console.log(`⚔️ Проверка агрессии: на клетке ${sameTileMonsters.length} моб(ов)`);
    startBattle(sameTileMonsters[0]);
  }
}

setInterval(checkTileAggro, 10000); // проверяем раз в 10 сек, но сработает раз в 2-5 мин


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

    if (you.inventory) {
      Object.assign(inventory, you.inventory);
      updateInventoryHUD();
    }

    camera.x = character.x - canvas.width / 2;
    camera.y = character.y - canvas.height / 2;
    console.log('🎮 Зашли:', you.name);
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
  } catch (e) { err.textContent = 'Ошибка соединения'; }
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
  } catch (e) { err.textContent = 'Ошибка соединения'; }
}

function onAuthSuccess(data) {
  token = data.token;
  character = data.character;
  startGame();
}

// ============================================================
//  СТАРТ
// ============================================================

function applyFullscreenStyles() {
  const gs = document.getElementById('gameScreen');
  if (gs) {
    gs.style.cssText = 'position:absolute;top:0;left:0;width:100vw;height:100vh;background:#000;';
  }
  const cv = document.getElementById('gameCanvas');
  if (cv) {
    cv.style.cssText = 'display:block;background:#1a3a1a;image-rendering:pixelated;';
  }
}

function startGame() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  applyFullscreenStyles();

  canvas = document.getElementById('gameCanvas');
  // Растягиваем canvas на всё окно
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  ctx = canvas.getContext('2d');

  initStats();  // инициализация статов после логина
  initEquipment();  // инициализация экипировки

  document.getElementById('charInfo').textContent =
    `${character.name} [${character.class}] Ур.${character.level}`;
  document.getElementById('cityInfo').textContent = `🏰 ${character.city}`;

  createHUDs();
  setupCameraDrag();
  createMinimap();
  createInventoryFullPanel();
  createInventoryV2();
  spawnMonsters();
  createAutoFightButton();
  recalcMaxHP();
  createStatsHUD();
  updateStatsHUD();
  createNavigatorPanel();
  setupNavPopup();
  createGatherButtons();
  createInventoryPanel();
  updateInventoryHUD();
  connectSocket();
  bindInput();
  requestAnimationFrame(renderLoop);
}

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