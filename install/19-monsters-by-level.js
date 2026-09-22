// install/19-monsters-by-level.js — 30+ мобов по уровням 1-50 и биомам
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'monsters-level')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // Заменяем MONSTER_TYPES
  content = content.replace(
    /\/\/ Типы мобов\nconst MONSTER_TYPES = \{[\s\S]*?\};/,
    `// Типы мобов по уровням 1-50
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
};`
  );

  // Заменяем SPAWN_ZONES
  content = content.replace(
    /\/\/ Спавн-зоны \(вокруг городов\)\nconst SPAWN_ZONES = \[[\s\S]*?\];/,
    `// Спавн-зоны: мобы каждого биома
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
];`
  );

  // Обновляем spawnMonsters — используем биомы
  content = content.replace(
    /function spawnMonsters\(\) \{[\s\S]*?console\.log\(`👹 Заспавнено мобов: \$\{monsters\.length\}`\);\n\}/,
    `function spawnMonsters() {
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
        biome: zone.biome,
        alive: true,
        respawnAt: 0
      });
    }
  });
  console.log(\`👹 Заспавнено мобов: \${monsters.length} (по 11 биомам)\`);
}`
  );

  content = addMarker(content, 'monsters-level');
  writeFile(MAIN_FILE, content);
  return true;
}