// install/22-cities-spread.js — Города разнесены + уровни растут от городов
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'cities-spread')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. РАЗНОСИМ ГОРОДА
  // ============================================================
  content = content.replace(
    `const CITIES = [
  { id: 'valencia', name: 'Валенсия (Луг)',     tileX: 50, tileY: 50, size: 7, color: '#d4af37', biome: 'meadow' },
  { id: 'dragon',   name: 'Драконье Логово (Север)', tileX: 50, tileY: 18, size: 7, color: '#c0392b', biome: 'north' },
  { id: 'elf',      name: 'Эльфийская Роща (Бор)', tileX: 22, tileY: 65, size: 7, color: '#27ae60', biome: 'forest' }
];`,
    `const CITIES = [
  { id: 'valencia', name: 'Валенсия',          tileX: 20, tileY: 20, size: 9, color: '#d4af37', biome: 'meadow' },
  { id: 'dragon',   name: 'Драконье Логово',   tileX: 80, tileY: 20, size: 9, color: '#c0392b', biome: 'volcano' },
  { id: 'elf',      name: 'Эльфийская Роща',   tileX: 50, tileY: 80, size: 9, color: '#27ae60', biome: 'forest' }
];`
  );

  // ============================================================
  // 2. ФУНКЦИЯ: уровень моба по расстоянию от ближайшего города
  // ============================================================
  content = content.replace(
    `// Спавн-зоны: мобы каждого биома`,
    `// Уровень моба = расстояние от ближайшего города
// 0-5 клеток → ур. 1-5, 5-10 → ур. 5-9, 10-15 → ур. 9-13, и т.д.
function getLevelByDistance(tileX, tileY) {
  let minDist = Infinity;
  CITIES.forEach(city => {
    const d = Math.hypot(tileX - city.tileX, tileY - city.tileY);
    if (d < minDist) minDist = d;
  });
  // Градация: каждые 5 клеток +4-5 уровней
  // 0-5 → 1-5, 5-10 → 5-9, 10-15 → 9-13, ...
  const tier = Math.floor(minDist / 5);
  const baseLevel = 1 + tier * 4;
  return Math.min(50, baseLevel);
}

// Спавн-зоны: мобы каждого биома`
  );

  // ============================================================
  // 3. ЗАМЕНЯЕМ spawnMonsters — теперь уровень считается по расстоянию
  // ============================================================
  content = content.replace(
    /function spawnMonsters\(\) \{[\s\S]*?console\.log\(`👹 Заспавнено мобов: \$\{monsters\.length\} \(по 11 биомам\)`\);\n\}/,
    `function spawnMonsters() {
  monsters = [];
  let seed = 54321;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // Универсальный пул мобов (по типу)
  const MOB_POOL = [
    { type: 'wolf',      level: 1 },  { type: 'boar',      level: 3 },
    { type: 'goblin',    level: 5 },  { type: 'snake',     level: 7 },
    { type: 'orc',       level: 9 },  { type: 'spider',    level: 11 },
    { type: 'scorpion',  level: 13 }, { type: 'bandit',    level: 15 },
    { type: 'zombie',    level: 17 }, { type: 'kikimora',  level: 19 },
    { type: 'mummy',     level: 21 }, { type: 'vulture',   level: 23 },
    { type: 'lizard',    level: 25 }, { type: 'tiger',     level: 27 },
    { type: 'icewolf',   level: 30 }, { type: 'iceelem',   level: 33 },
    { type: 'fireelem',  level: 36 }, { type: 'youngdragon', level: 40 },
    { type: 'golem',     level: 44 }, { type: 'giant',     level: 47 },
    { type: 'fairy',     level: 49 }, { type: 'guardian',  level: 50 }
  ];

  // Спавним мобов по ВСЕЙ карте, уровень зависит от расстояния до города
  const TOTAL_MOBS = 300; // Больше мобов на большой карте
  let spawned = 0;
  let attempts = 0;

  while (spawned < TOTAL_MOBS && attempts < TOTAL_MOBS * 10) {
    attempts++;
    const tx = 2 + Math.floor(rand() * (MAP_SIZE - 4));
    const ty = 2 + Math.floor(rand() * (MAP_SIZE - 4));

    const tile = GAME_MAP[ty][tx];
    // Моб не спавнится в воде, городе, воротах, лаве, горах
    if (tile === TILE.WATER || tile === TILE.CITY_GROUND || tile === TILE.GATE) continue;
    if (tile === TILE.LAVA || tile === TILE.MOUNTAIN || tile === TILE.MOUNTAIN_DARK) continue;

    // Уровень по расстоянию от ближайшего города
    const targetLevel = getLevelByDistance(tx, ty);
    if (targetLevel < 1) continue;

    // Ищем моба из пула с ближайшим уровнем
    let bestMob = MOB_POOL[0];
    let bestDiff = Infinity;
    MOB_POOL.forEach(mp => {
      const diff = Math.abs(mp.level - targetLevel);
      if (diff < bestDiff) { bestDiff = diff; bestMob = mp; }
    });

    const type = MONSTER_TYPES[bestMob.type];
    if (!type) continue;

    // Уровень моба = targetLevel ± 2
    const levelMin = Math.max(1, targetLevel - 2);
    const levelMax = Math.min(50, targetLevel + 2);

    // HP/атака/опыт/золото масштабируются от уровня
    const lvl = targetLevel;
    const hp = Math.floor(30 + lvl * lvl * 0.8 + lvl * 10);
    const atk = Math.floor(5 + lvl * 4.5);
    const exp = Math.floor(15 + lvl * lvl * 1.2);
    const gold = Math.floor(3 + lvl * lvl * 0.4);

    monsters.push({
      id: 'm_' + bestMob.type + '_' + spawned,
      type: bestMob.type,
      name: type.name,
      icon: type.icon,
      color: type.color,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      hp, maxHp: hp,
      atk,
      def: Math.floor(lvl * 0.8),
      exp,
      gold,
      level: lvl,
      levelMin,
      levelMax,
      alive: true,
      respawnAt: 0
    });
    spawned++;
  }

  console.log(\`👹 Заспавнено мобов: \${monsters.length} (уровни 1-50, от городов)\`);
  console.log(\`📍 Города: Валенсия (\${CITIES[0].tileX},\${CITIES[0].tileY}), Драконье (\${CITIES[1].tileX},\${CITIES[1].tileY}), Эльфийская (\${CITIES[2].tileX},\${CITIES[2].tileY})\`);
}`
  );

  content = addMarker(content, 'cities-spread');
  writeFile(MAIN_FILE, content);
  return true;
}