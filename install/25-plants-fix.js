// install/25-plants-fix.js — Фикс сбора растений + инвентарь растений
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'plants-fix')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. ДОБАВЛЯЕМ ХРАНИЛИЩЕ РАСТЕНИЙ В ИНВЕНТАРЬ
  // ============================================================
  content = content.replace(
    `const inventory = { wood: 0, herb: 0, acorn: 0, flower: 0 };`,
    `const inventory = { wood: 0, herb: 0, acorn: 0, flower: 0 };
const plantInventory = {}; // { plantId: count }`
  );

  // ============================================================
  // 2. ФИКСИМ completeGathering — обрабатываем plants
  // ============================================================
  content = content.replace(
    `function completeGathering() {
  const type = gathering.type;
  gathering = null;
  lastGatherTime = Date.now();
  document.getElementById('gatherProgress').style.display = 'none';

  let gained = '';
  if (type === 'tree') {
    const wood = 1 + Math.floor(Math.random() * 3);
    inventory.wood += wood;
    gained = \`🪵 +\${wood} древесины\`;
    if (Math.random() < 0.05) { inventory.acorn += 1; gained += \`  🌰 +1 жёлудь!\`; }
  } else if (type === 'grass') {
    const herb = 1 + Math.floor(Math.random() * 2);
    inventory.herb += herb;
    gained = \`🌿 +\${herb} травы\`;
    if (Math.random() < 0.1) { inventory.flower += 1; gained += \`  🌸 +1 цветок!\`; }
  }

  updateInventoryHUD();
  setNavStatus(\`✅ \${gained}\`, '#88ff88');
  console.log(\`✅ Добыто: \${gained}\`);
  if (socket) socket.emit('inventory', inventory);
}`,
    `function completeGathering() {
  const type = gathering.type;
  const plantTile = gathering.plantTile;
  gathering = null;
  lastGatherTime = Date.now();
  document.getElementById('gatherProgress').style.display = 'none';

  let gained = '';
  if (type === 'tree') {
    const wood = 1 + Math.floor(Math.random() * 3);
    inventory.wood += wood;
    gained = \`🪵 +\${wood} древесины\`;
    if (Math.random() < 0.05) { inventory.acorn += 1; gained += \`  🌰 +1 жёлудь!\`; }
  } else if (type === 'grass') {
    const herb = 1 + Math.floor(Math.random() * 2);
    inventory.herb += herb;
    gained = \`🌿 +\${herb} травы\`;
    if (Math.random() < 0.1) { inventory.flower += 1; gained += \`  🌸 +1 цветок!\`; }
  } else if (type === 'plant' && plantTile) {
    // Собираем конкретное растение
    const plant = PLANTS[plantTile.plantId];
    if (plant) {
      // Количество зависит от редкости
      const count = plant.rarity === 'common' ? 1 + Math.floor(Math.random() * 2)
                  : plant.rarity === 'rare' ? 1 + Math.floor(Math.random() * 2)
                  : 1;
      plantInventory[plantTile.plantId] = (plantInventory[plantTile.plantId] || 0) + count;
      gained = \`\${plant.icon} +\${count}× \${plant.name}\`;

      // Опыт за сбор
      const expGain = plant.rarity === 'legendary' ? 100
                    : plant.rarity === 'epic' ? 50
                    : plant.rarity === 'rare' ? 20
                    : 10;
      if (character && character.stats) gainExp(expGain);

      // Убираем с карты + респавн через 2 минуты
      plantTile.alive = false;
      setTimeout(() => {
        if (plantTile) plantTile.alive = true;
      }, 120000);
    }
  }

  updateInventoryHUD();
  setNavStatus(\`✅ \${gained}\`, '#88ff88');
  console.log(\`✅ Добыто: \${gained}\`);

  // Отправляем на сервер
  if (socket) socket.emit('inventory', { ...inventory, ...plantInventory });
}`
  );

  // ============================================================
  // 3. ОБНОВЛЯЕМ updateInventoryHUD — показываем растения
  // ============================================================
  content = content.replace(
    `function updateInventoryHUD() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('invWood', inventory.wood);
  set('invHerb', inventory.herb);
  set('invAcorn', inventory.acorn);
  set('invFlower', inventory.flower);
}`,
    `function updateInventoryHUD() {
  // Мини-панель не обновляем, показываем только в полном инвентаре
  // Обновляем счётчики в большой панели
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('invWood', inventory.wood);
  set('invHerb', inventory.herb);
  set('invAcorn', inventory.acorn);
  set('invFlower', inventory.flower);

  // Обновляем рендер если открыт
  if (typeof invV2Open !== 'undefined' && invV2Open) {
    setTimeout(() => renderInventoryV2(), 50);
  }
}

// Сколько всего растений собрано
function getTotalPlants() {
  return Object.values(plantInventory).reduce((a, b) => a + b, 0);
}`
  );

  // ============================================================
  // 4. ОБНОВЛЯЕМ renderInventoryV2 — показываем все растения
  // ============================================================
  content = content.replace(
    `  // Собираем предметы
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
  });`,
    `  // Собираем предметы
  const allItems = [
    { id: 'wood', count: inventory.wood },
    { id: 'herb', count: inventory.herb },
    { id: 'acorn', count: inventory.acorn },
    { id: 'flower', count: inventory.flower },
    { id: 'planks', count: craftInventory.planks || 0 },
    { id: 'potion', count: craftInventory.potion || 0 },
    { id: 'torch', count: craftInventory.torch || 0 },
    { id: 'meal', count: craftInventory.meal || 0 }
  ];

  // Добавляем ВСЕ растения из plantInventory
  Object.entries(plantInventory).forEach(([plantId, count]) => {
    if (count > 0) {
      allItems.push({ id: plantId, count, isPlant: true });
    }
  });

  const filtered = allItems.filter(it => {
    if (it.count <= 0) return false;
    if (invTab === 'all') return true;
    if (invTab === 'plants' && (it.isPlant || ['wood','herb','acorn','flower'].includes(it.id))) return true;
    if (invTab === 'potions' && ['potion'].includes(it.id)) return true;
    if (invTab === 'weapons' && ['torch'].includes(it.id)) return true;
    if (invTab === 'misc' && ['planks','meal'].includes(it.id)) return true;
    return false;
  });`
  );

  // Подменяем allItems на filtered в рендере
  content = content.replace(
    `  const slotsHtml = allItems.length === 0 
    ? \`<div style="color:#666;text-align:center;padding:40px;">Пусто</div>\`
    : allItems.map(it => {
        const info = ITEM_INFO[it.id] || { name: it.id, icon: '❓' };
        return \`
          <div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:10px;text-align:center;">
            <div style="font-size:28px;">\${info.icon}</div>
            <div style="font-size:10px;color:#ccc;">\${info.name}</div>
            <div style="font-size:14px;color:#ffd700;font-weight:bold;">\${it.count}</div>
          </div>
        \`;
      }).join('');`,
    `  const slotsHtml = filtered.length === 0 
    ? \`<div style="color:#666;text-align:center;padding:40px;grid-column:1/-1;">Пусто</div>\`
    : filtered.map(it => {
        // Если это растение — берём инфо из PLANTS
        let info;
        if (it.isPlant && PLANTS[it.id]) {
          const p = PLANTS[it.id];
          info = { name: p.name, icon: p.icon, rarity: p.rarity, price: p.price };
        } else {
          info = ITEM_INFO[it.id] || { name: it.id, icon: '❓' };
        }
        // Цвет рамки по редкости
        const borderColor = info.rarity === 'legendary' ? '#ffd700'
                          : info.rarity === 'epic' ? '#a855f7'
                          : info.rarity === 'rare' ? '#4a8aff'
                          : '#4a4aff';
        return \`
          <div style="background:#1a1a3e;border:2px solid \${borderColor};border-radius:6px;padding:10px;text-align:center;" title="\${info.name}\${info.price ? ' — ' + info.price + '💰' : ''}">
            <div style="font-size:28px;">\${info.icon}</div>
            <div style="font-size:10px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${info.name}</div>
            <div style="font-size:14px;color:#ffd700;font-weight:bold;">\${it.count}</div>
          </div>
        \`;
      }).join('');`
  );

  // ============================================================
  // 5. КНОПКА СБОРА — работает для растений
  // ============================================================
  content = content.replace(
    `      if (!gathering && !me.path) {
        const tile = getCurrentTile();
        if (tile) {
          if (tile.type === TILE.TREE) showGatherButton('🌲 Рубить', 'tree');
          else if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK || tile.type === TILE.GRASS_LIGHT) showGatherButton('🌿 Собирать', 'grass');
          else hideGatherButton();
        }
      } else {
        hideGatherButton();
      }`,
    `      if (!gathering && !me.path) {
        // Сначала проверяем растение под ногами
        const plantUnder = findPlantAt(me.x, me.y);
        if (plantUnder) {
          const plant = PLANTS[plantUnder.plantId];
          if (plant) {
            showGatherButton(\`\${plant.icon} Собрать: \${plant.name}\`, 'plant');
          } else {
            hideGatherButton();
          }
        } else {
          const tile = getCurrentTile();
          if (tile) {
            if (tile.type === TILE.TREE) showGatherButton('🌲 Рубить', 'tree');
            else if (tile.type === TILE.GRASS || tile.type === TILE.GRASS_DARK || tile.type === TILE.GRASS_LIGHT) showGatherButton('🌿 Собирать', 'grass');
            else hideGatherButton();
          }
        }
      } else {
        hideGatherButton();
      }`
  );

  // startGathering — обрабатывает plant
  content = content.replace(
    `function startGathering() {
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
  console.log(\`⛏️ Начал добычу: \${type}\`);
}`,
    `function startGathering() {
  if (gathering) return;
  const now = Date.now();
  if (now - lastGatherTime < GATHER_COOLDOWN) return;

  // Сначала проверяем растение
  const me = players.get(myId) || character;
  const plantUnder = me ? findPlantAt(me.x, me.y) : null;
  if (plantUnder) {
    const plant = PLANTS[plantUnder.plantId];
    gathering = { startTime: now, duration: 3000, type: 'plant', plantTile: plantUnder };
    document.getElementById('gatherProgress').style.display = 'block';
    document.getElementById('gatherProgressFill').style.width = '0%';
    hideGatherButton();
    console.log(\`🌿 Начал сбор: \${plant.name}\`);
    return;
  }

  // Если нет растения — проверяем тайл
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
  console.log(\`⛏️ Начал добычу: \${type}\`);
}`
  );

  content = addMarker(content, 'plants-fix');
  writeFile(MAIN_FILE, content);
  return true;
}