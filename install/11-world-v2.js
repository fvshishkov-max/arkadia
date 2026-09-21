// install/11-world-v2.js — Карта v2: 11 биомов, 100×100
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'world-v2')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  // ⚠️ ВАЖНО: ЭТОТ МОДУЛЬ ЗАМЕНЯЕТ ЦЕЛЫЕ БЛОКИ В main.js
  // Меняем константы размера
  content = content.replace(
    'const TILE_SIZE = 32;\nconst MAP_SIZE = 50;',
    'const TILE_SIZE = 32;\nconst MAP_SIZE = 100;'
  );

  // Заменяем определение TILE
  content = content.replace(
    `const TILE = {
  GRASS: 0, GRASS_DARK: 1, GRASS_LIGHT: 2,
  TREE: 3, WATER: 4, ROAD: 5, SAND: 6,
  GATE: 7, CITY_GROUND: 8
};`,
    `const TILE = {
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
};`
  );

  // Заменяем цвета
  content = content.replace(
    `const TILE_COLORS = {
  [TILE.GRASS]: '#3a7a2a',
  [TILE.GRASS_DARK]: '#2e6522',
  [TILE.GRASS_LIGHT]: '#4a8a35',
  [TILE.TREE]: '#1a4a15',
  [TILE.WATER]: '#2a5a9a',
  [TILE.ROAD]: '#8a7a4a',
  [TILE.SAND]: '#c8b878',
  [TILE.GATE]: '#5a3a1a',
  [TILE.CITY_GROUND]: '#8a8a7a'
};`,
    `const TILE_COLORS = {
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
};`
  );

  // Заменяем CITIES
  content = content.replace(
    `const CITIES = [
  { id: 'valencia', name: 'Валенсия', tileX: 25, tileY: 25, size: 7, color: '#d4af37' },
  { id: 'dragon',   name: 'Драконье Логово', tileX: 25, tileY: 8,  size: 7, color: '#c0392b' },
  { id: 'elf',      name: 'Эльфийская Роща', tileX: 25, tileY: 42, size: 7, color: '#27ae60' }
];`,
    `const CITIES = [
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
}`
  );

  // Заменяем generateMap
  content = content.replace(
    /function generateMap\(\) \{[\s\S]*?return map;\n\}/,
    `function generateMap() {
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
}`
  );

  // Проверка уровня при входе в биом
  content = content.replace(
    `function handleWorldClick(mx, my) {`,
    `function checkBiomeAccess(tx, ty) {
  const biome = getBiomeAt(tx, ty);
  if (!biome) return { ok: true };
  const s = character && character.stats;
  const lvl = s ? s.level : 1;
  if (lvl < biome.level) {
    setNavStatus(\`🔒 Нужен ур. \${biome.level} для \${biome.name}\`, '#ff6666');
    return { ok: false, biome };
  }
  return { ok: true, biome };
}

function handleWorldClick(mx, my) {`
  );

  // Вставляем проверку в handleWorldClick
  content = content.replace(
    `  if (tile === TILE.WATER) { console.log('❌ Вода'); return; }`,
    `  // Проверка доступа к биому
  const access = checkBiomeAccess(tileX, tileY);
  if (!access.ok) return;

  if (tile === TILE.WATER) { console.log('❌ Вода'); return; }
  if (tile === TILE.LAVA) { console.log('❌ Лава'); return; }`
  );

  // LAVA непроходима
  content = content.replace(
    `  if (tile === TILE.WATER) return false;
  if (tile === TILE.CITY_GROUND) return false;
  return true;`,
    `  if (tile === TILE.WATER) return false;
  if (tile === TILE.LAVA) return false;
  if (tile === TILE.CITY_GROUND) return false;
  return true;`
  );

  // Названия биомов на карте
  content = content.replace(
    `  // Города: стены, башни, подписи
  CITIES.forEach(city => {`,
    `  // Биомы: подписи
  BIOMES.forEach(b => {
    const bx = b.cx * TILE_SIZE - camera.x;
    const by = b.cy * TILE_SIZE - camera.y;
    if (bx < -200 || bx > canvas.width + 200) return;
    if (by < -200 || by > canvas.height + 200) return;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.strokeText(b.name, bx, by);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(b.name, bx, by);
    // Уровень
    ctx.font = '12px Arial';
    ctx.strokeText(\`Ур. \${b.level}+\`, bx, by + 18);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(\`Ур. \${b.level}+\`, bx, by + 18);
  });

  // Города: стены, башни, подписи
  CITIES.forEach(city => {`
  );

  content = addMarker(content, 'world-v2');
  writeFile(MAIN_FILE, content);
  return true;
}