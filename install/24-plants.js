// install/24-plants.js — 66 растений по биомам
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'plants')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: PLANTS (66 растений по биомам)
// ============================================================

const PLANTS = {
  // === 🌱 Опушка ===
  plantain:   { name: 'Подорожник', icon: '🌿', biome: 'edge',     rarity: 'common',    price: 2 },
  chamomile:  { name: 'Ромашка',    icon: '🌼', biome: 'edge',     rarity: 'common',    price: 3 },
  dandelion:  { name: 'Одуванчик',  icon: '🌻', biome: 'edge',     rarity: 'common',    price: 2 },
  clover:     { name: 'Клевер',     icon: '🍀', biome: 'edge',     rarity: 'rare',      price: 8 },
  mint:       { name: 'Мята',       icon: '🌱', biome: 'edge',     rarity: 'rare',      price: 6 },
  lichen:     { name: 'Лишайник',   icon: '🍃', biome: 'edge',     rarity: 'common',    price: 1 },

  // === 🌸 Луг ===
  lavender:   { name: 'Лаванда',    icon: '💜', biome: 'meadow',   rarity: 'common',    price: 4 },
  melissa:    { name: 'Мелисса',    icon: '🍃', biome: 'meadow',   rarity: 'common',    price: 3 },
  cornflower: { name: 'Василёк',    icon: '🔵', biome: 'meadow',   rarity: 'common',    price: 4 },
  willowherb: { name: 'Иван-чай',   icon: '🌸', biome: 'meadow',   rarity: 'rare',      price: 10 },
  tansy:      { name: 'Пижма',      icon: '🌼', biome: 'meadow',   rarity: 'rare',      price: 7 },
  yarrow:     { name: 'Тысячелистник', icon: '🌿', biome: 'meadow', rarity: 'common',  price: 5 },

  // === 🌲 Тёмный бор ===
  flyagaric:  { name: 'Мухомор',    icon: '🍄', biome: 'forest',   rarity: 'rare',      price: 15 },
  fern:       { name: 'Папоротник', icon: '🌿', biome: 'forest',   rarity: 'common',    price: 6 },
  chanterelle:{ name: 'Лисичка',    icon: '🍄', biome: 'forest',   rarity: 'rare',      price: 12 },
  porcini:    { name: 'Белый гриб', icon: '🍄', biome: 'forest',   rarity: 'rare',      price: 18 },
  moss:       { name: 'Мох',        icon: '🍃', biome: 'forest',   rarity: 'common',    price: 3 },
  thistle:    { name: 'Чертополох', icon: '🌵', biome: 'forest',   rarity: 'rare',      price: 14 },

  // === 🏞️ Речная долина ===
  reed:       { name: 'Камыш',      icon: '🌾', biome: 'river',    rarity: 'common',    price: 4 },
  lotus:      { name: 'Лотос',      icon: '🪷', biome: 'river',    rarity: 'epic',      price: 35 },
  lily:       { name: 'Кувшинка',   icon: '🌸', biome: 'river',    rarity: 'rare',      price: 12 },
  cattail:    { name: 'Рогоз',      icon: '🌾', biome: 'river',    rarity: 'common',    price: 5 },
  willow:     { name: 'Ива',        icon: '🌳', biome: 'river',    rarity: 'common',    price: 6 },
  duckweed:   { name: 'Ряска',      icon: '🌿', biome: 'river',    rarity: 'common',    price: 2 },

  // === 🍄 Болото ===
  truffle:    { name: 'Трюфель',    icon: '🍄', biome: 'swamp',    rarity: 'epic',      price: 50 },
  moongrass:  { name: 'Лунная трава', icon: '🌙', biome: 'swamp',  rarity: 'epic',      price: 45 },
  marsh:      { name: 'Болотник',   icon: '🌿', biome: 'swamp',    rarity: 'rare',      price: 15 },
  ledum:      { name: 'Багульник',  icon: '🌸', biome: 'swamp',    rarity: 'rare',      price: 20 },
  cranberry:  { name: 'Клюква',     icon: '🫐', biome: 'swamp',    rarity: 'common',    price: 8 },
  sphagnum:   { name: 'Сфагнум',    icon: '🍃', biome: 'swamp',    rarity: 'common',    price: 4 },

  // === 🏜️ Пустошь ===
  cactus:     { name: 'Кактус',     icon: '🌵', biome: 'desert',   rarity: 'common',    price: 10 },
  aloe:       { name: 'Алоэ',       icon: '🪴', biome: 'desert',   rarity: 'rare',      price: 18 },
  camelthorn: { name: 'Верблюжья колючка', icon: '🌵', biome: 'desert', rarity: 'rare', price: 15 },
  wormwood:   { name: 'Полынь',     icon: '🌿', biome: 'desert',   rarity: 'common',    price: 8 },
  saxaul:     { name: 'Саксаул',    icon: '🌳', biome: 'desert',   rarity: 'rare',      price: 22 },
  sandflower: { name: 'Песчаный цветок', icon: '🌸', biome: 'desert', rarity: 'epic',    price: 40 },

  // === 🌴 Тропики ===
  bamboo:     { name: 'Бамбук',     icon: '🎋', biome: 'tropic',   rarity: 'common',    price: 12 },
  orchid:     { name: 'Орхидея',    icon: '🌺', biome: 'tropic',   rarity: 'epic',      price: 60 },
  coconut:    { name: 'Кокос',      icon: '🥥', biome: 'tropic',   rarity: 'rare',      price: 25 },
  mango:      { name: 'Манго',      icon: '🥭', biome: 'tropic',   rarity: 'rare',      price: 30 },
  pineapple:  { name: 'Ананас',     icon: '🍍', biome: 'tropic',   rarity: 'rare',      price: 28 },
  liana:      { name: 'Лиана',      icon: '🌿', biome: 'tropic',   rarity: 'common',    price: 10 },

  // === ❄️ Северный лес ===
  iceflower:  { name: 'Ледяник',    icon: '❄️', biome: 'north',    rarity: 'epic',      price: 70 },
  snowdrop:   { name: 'Снежник',    icon: '🌸', biome: 'north',    rarity: 'rare',      price: 35 },
  cloudberry: { name: 'Морошка',    icon: '🫐', biome: 'north',    rarity: 'rare',      price: 40 },
  cranberryN: { name: 'Клюква северная', icon: '🫐', biome: 'north', rarity: 'common',   price: 20 },
  spruce:     { name: 'Ель',        icon: '🌲', biome: 'north',    rarity: 'common',    price: 15 },
  reindeer:   { name: 'Ягель',      icon: '🍃', biome: 'north',    rarity: 'rare',      price: 30 },

  // === 🌋 Вулкан ===
  fireflower: { name: 'Огнецвет',   icon: '🔥', biome: 'volcano',  rarity: 'epic',      price: 90 },
  ashmoss:    { name: 'Пепельник',  icon: '🌫️', biome: 'volcano',  rarity: 'rare',      price: 50 },
  lavamush:   { name: 'Лавовый гриб', icon: '🍄', biome: 'volcano', rarity: 'epic',     price: 100 },
  firegrass:  { name: 'Огненная трава', icon: '🌿', biome: 'volcano', rarity: 'rare',   price: 60 },
  sulfurfl:   { name: 'Серный цветок', icon: '🌼', biome: 'volcano', rarity: 'rare',    price: 45 },
  flamemoss:  { name: 'Пламенник',  icon: '🔥', biome: 'volcano',  rarity: 'legendary', price: 200 },

  // === 🏔️ Горы ===
  edelweiss:  { name: 'Эдельвейс',  icon: '🌼', biome: 'mountain', rarity: 'legendary', price: 250 },
  stonemoss:  { name: 'Каменный мох', icon: '🍃', biome: 'mountain', rarity: 'rare',    price: 55 },
  gentian:    { name: 'Горечавка',  icon: '💙', biome: 'mountain', rarity: 'epic',      price: 110 },
  potentilla: { name: 'Лапчатка',   icon: '🌼', biome: 'mountain', rarity: 'rare',      price: 65 },
  rhododendron:{ name: 'Рододендрон', icon: '🌺', biome: 'mountain', rarity: 'epic',    price: 130 },
  saxifrage:  { name: 'Саксифрага', icon: '🌱', biome: 'mountain', rarity: 'rare',      price: 70 },

  // === 🌌 Волшебный сад ===
  starflower: { name: 'Звёздный цветок', icon: '⭐', biome: 'magic', rarity: 'legendary', price: 500 },
  moonrose:   { name: 'Лунная роза', icon: '🌹', biome: 'magic',   rarity: 'legendary', price: 450 },
  rainbowfl:  { name: 'Радужный цветок', icon: '🌈', biome: 'magic', rarity: 'legendary', price: 800 },
  cryslily:   { name: 'Кристальная лилия', icon: '💎', biome: 'magic', rarity: 'legendary', price: 600 },
  lifeseed:   { name: 'Семя жизни', icon: '🌱', biome: 'magic',    rarity: 'legendary', price: 1500 },
  ancientfl:  { name: 'Цветок Древних', icon: '🌺', biome: 'magic', rarity: 'legendary', price: 2000 }
};

// === СПАВН РАСТЕНИЙ ===
// Каждое растение живёт на своей клетке в своём биоме
const plantTiles = []; // { id, x, y, plantId, biome }
let plantRespawnTimes = {};

function spawnPlants() {
  plantTiles.length = 0;
  let seed = 98765;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // Для каждого биома — 30-50 растений
  Object.entries(PLANTS).forEach(([plantId, plant]) => {
    const biome = BIOMES.find(b => b.id === plant.biome);
    if (!biome) return;

    const count = plant.rarity === 'legendary' ? 3
                : plant.rarity === 'epic' ? 8
                : plant.rarity === 'rare' ? 20
                : 40;

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 20) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const dist = rand() * (biome.r - 1);
      const tx = Math.floor(biome.cx + Math.cos(angle) * dist);
      const ty = Math.floor(biome.cy + Math.sin(angle) * dist);
      if (tx < 1 || tx >= MAP_SIZE - 1 || ty < 1 || ty >= MAP_SIZE - 1) continue;
      const tile = GAME_MAP[ty][tx];
      if (tile === TILE.WATER || tile === TILE.CITY_GROUND || tile === TILE.GATE || tile === TILE.LAVA) continue;

      plantTiles.push({
        id: 'p_' + plantId + '_' + placed,
        plantId,
        x: tx * TILE_SIZE + TILE_SIZE / 2,
        y: ty * TILE_SIZE + TILE_SIZE / 2,
        biome: plant.biome,
        alive: true
      });
      placed++;
    }
  });

  console.log(\`🌿 Заспавнено растений: \${plantTiles.length}\`);
}

function drawPlants(ctx, camera) {
  plantTiles.forEach(p => {
    if (!p.alive) return;
    const px = p.x - camera.x;
    const py = p.y - camera.y;
    if (px < -TILE_SIZE || px > canvas.width + TILE_SIZE) return;
    if (py < -TILE_SIZE || py > canvas.height + TILE_SIZE) return;

    const plant = PLANTS[p.plantId];
    if (!plant) return;

    // Рамка по редкости
    const rarityColors = {
      common:    { border: '#88cc88', bg: 'rgba(50, 150, 50, 0.3)' },
      rare:      { border: '#4a8aff', bg: 'rgba(74, 138, 255, 0.3)' },
      epic:      { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.3)' },
      legendary: { border: '#ffd700', bg: 'rgba(255, 215, 0, 0.35)' }
    };
    const colors = rarityColors[plant.rarity];

    const half = TILE_SIZE / 2;
    // Квадрат редкости
    ctx.fillStyle = colors.bg;
    ctx.fillRect(px - half + 4, py - half + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(px - half + 4, py - half + 4, TILE_SIZE - 8, TILE_SIZE - 8);

    // Иконка растения
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(plant.icon, px, py - 5);

    // Имя
    ctx.font = 'bold 12px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(plant.name, px, py + half - 15);
    ctx.fillStyle = colors.border;
    ctx.fillText(plant.name, px, py + half - 15);
  });
}

function findPlantAt(worldX, worldY) {
  const half = TILE_SIZE / 2;
  for (const p of plantTiles) {
    if (!p.alive) continue;
    if (Math.abs(worldX - p.x) < half && Math.abs(worldY - p.y) < half) return p;
  }
  return null;
}

// Сбор растения
function gatherPlant(plantTile) {
  const me = players.get(myId) || character;
  if (!me || !plantTile || !plantTile.alive) return;

  const dist = Math.hypot(plantTile.x - me.x, plantTile.y - me.y);
  if (dist > TILE_SIZE) {
    // Идём к растению
    const startX = Math.floor(me.x / TILE_SIZE);
    const startY = Math.floor(me.y / TILE_SIZE);
    const tx = Math.floor(plantTile.x / TILE_SIZE);
    const ty = Math.floor(plantTile.y / TILE_SIZE);
    const path = findPath(startX, startY, tx, ty);
    if (path) {
      me.path = path;
      me.pendingPlantId = plantTile.id;
      setNavStatus(\`🌿 Иду собирать \${PLANTS[plantTile.plantId].name}\`, '#88ff88');
    }
    return;
  }

  // Начинаем сбор
  const plant = PLANTS[plantTile.plantId];
  gathering = {
    startTime: Date.now(),
    duration: 3000,
    type: 'plant',
    plantTile
  };
  document.getElementById('gatherProgress').style.display = 'block';
  document.getElementById('gatherProgressFill').style.width = '0%';
  hideGatherButton();
  console.log(\`🌿 Начал сбор: \${plant.name}\`);
}

`;

  // Вставляем перед блоком Сокетов
  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — вызываем spawnPlants
  content = content.replace(
    '  spawnMonsters();',
    `  spawnMonsters();
  spawnPlants();`
  );

  // В draw() — отрисовка растений перед мобами
  content = content.replace(
    '    drawTeleports(ctx, camera);\n    drawMonsters(ctx, camera);',
    '    drawTeleports(ctx, camera);\n    drawPlants(ctx, camera);\n    drawMonsters(ctx, camera);'
  );

  // В handleWorldClick — клик по растению
  content = content.replace(
    `  // Клик по мобу — теперь просто выделяем и ИДЁМ на его клетку`,
    `  // Клик по растению
  const clickedPlant = findPlantAt(worldX, worldY);
  if (clickedPlant) {
    gatherPlant(clickedPlant);
    return;
  }

  // Клик по мобу — теперь просто выделяем и ИДЁМ на его клетку`
  );

  content = addMarker(content, 'plants');
  writeFile(MAIN_FILE, content);
  return true;
}