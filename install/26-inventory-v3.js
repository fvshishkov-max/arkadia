// install/26-inventory-v3.js — Инвентарь v3 в стиле Diablo
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'inventory-v3')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: INVENTORY V3 (Diablo-style)
// ============================================================

let invV3Open = false;
let invV3Tab = 'all';
let sellMode = false;
let sellSelection = {};

// Слоты экипировки: 11 штук
const EQUIP_SLOTS = [
  // левая колонка
  { id: 'head',    name: 'Шлем',     icon: '🪖', col: 0 },
  { id: 'amulet',  name: 'Амулет',   icon: '📿', col: 0 },
  { id: 'cloak',   name: 'Плащ',     icon: '🧥', col: 0 },
  // центр
  { id: 'weapon',  name: 'Оружие',   icon: '⚔️', col: 1 },
  { id: 'body',    name: 'Броня',    icon: '🛡️', col: 1 },
  { id: 'belt',    name: 'Пояс',     icon: '🎗️', col: 1 },
  // правая колонка
  { id: 'shield',  name: 'Щит',      icon: '🛡️', col: 2 },
  { id: 'ring',    name: 'Кольцо',   icon: '💍', col: 2 },
  { id: 'gloves',  name: 'Перчатки', icon: '🧤', col: 2 },
  // низ
  { id: 'legs',    name: 'Штаны',    icon: '👖', col: 'bottom' },
  { id: 'boots',   name: 'Сапоги',   icon: '🥾', col: 'bottom' }
];

// Инициализация экипировки с 11 слотами
function initEquipmentV3() {
  if (!character) return;
  character.equipment = character.equipment || {};
  EQUIP_SLOTS.forEach(slot => {
    if (!(slot.id in character.equipment)) {
      character.equipment[slot.id] = null;
    }
  });
}

// Открытие/закрытие
function toggleInventoryV3() {
  invV3Open = !invV3Open;
  const panel = document.getElementById('invV3Panel');
  if (panel) {
    panel.style.display = invV3Open ? 'flex' : 'none';
    if (invV3Open) renderInventoryV3();
  }
}

// Закрытие
function closeInventoryV3() {
  invV3Open = false;
  sellMode = false;
  sellSelection = {};
  const panel = document.getElementById('invV3Panel');
  if (panel) panel.style.display = 'none';
}

// Создание панели (один раз)
function createInventoryV3() {
  if (document.getElementById('invV3Panel')) return;
  const panel = document.createElement('div');
  panel.id = 'invV3Panel';
  panel.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1525 100%);
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 350; display: none;
    box-sizing: border-box;
    overflow: hidden;
    flex-direction: row;
    gap: 20px;
  \`;
  document.getElementById('gameScreen').appendChild(panel);
  renderInventoryV3();
}

// Классификация: категория предмета
function getInvV3Category(itemId, isPlant) {
  if (isPlant) return 'plants';
  if (['wood', 'herb', 'acorn', 'flower'].includes(itemId)) return 'plants';
  if (['potion'].includes(itemId)) return 'potions';
  if (['torch'].includes(itemId)) return 'weapons';
  if (['planks', 'meal'].includes(itemId)) return 'misc';
  return 'misc';
}

// Отрисовка
function renderInventoryV3() {
  const panel = document.getElementById('invV3Panel');
  if (!panel) return;
  if (!character || !character.equipment) return;

  const s = character.stats || { hp: 0, maxHp: 100, mp: 0, maxMp: 100, level: 1, gold: 0, str: 5, agi: 5, int: 5, vit: 5, luck: 5 };
  const eq = character.equipment;

  // Собираем все предметы
  const allItems = [];
  Object.entries(inventory).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: false });
  });
  Object.entries(craftInventory).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: false });
  });
  Object.entries(plantInventory).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: true });
  });

  // Фильтр по вкладке
  const filtered = allItems.filter(it => {
    if (invV3Tab === 'all') return true;
    return getInvV3Category(it.id, it.isPlant) === invV3Tab;
  });

  // Сортируем по редкости (легендарные сверху)
  filtered.sort((a, b) => {
    const pa = a.isPlant ? PLANTS[a.id] : null;
    const pb = b.isPlant ? PLANTS[b.id] : null;
    const ra = pa ? pa.rarity : 'common';
    const rb = pb ? pb.rarity : 'common';
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return (order[ra] || 3) - (order[rb] || 3);
  });

  // Левая панель
  const leftPanel = \`
    <div style="width:280px;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:15px;">
      <div style="text-align:center;">
        <div style="font-size:120px;line-height:1;">🧙</div>
        <div style="font-size:18px;color:#ffd700;font-weight:bold;margin-top:8px;">\${character.name}</div>
        <div style="font-size:14px;color:#aaa;">\${character.class} • Ур. \${s.level}</div>
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;">
        <div style="font-size:12px;color:#ccc;margin-bottom:4px;">❤️ HP: \${s.hp}/\${s.maxHp}</div>
        <div style="height:14px;background:#300;border:1px solid #000;border-radius:7px;overflow:hidden;margin-bottom:8px;">
          <div style="height:100%;width:\${(s.hp/s.maxHp*100)}%;background:linear-gradient(90deg,#c0392b,#e74c3c);"></div>
        </div>
        <div style="font-size:12px;color:#ccc;margin-bottom:4px;">🔵 MP: \${s.mp}/\${s.maxMp}</div>
        <div style="height:14px;background:#003;border:1px solid #000;border-radius:7px;overflow:hidden;">
          <div style="height:100%;width:\${(s.mp/s.maxMp*100)}%;background:linear-gradient(90deg,#2980b9,#3498db);"></div>
        </div>
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;font-size:13px;">
        <div style="margin-bottom:4px;">💰 <span style="color:#ffd700;font-weight:bold;">\${s.gold}</span> золота</div>
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;font-size:13px;">
        <div style="font-weight:bold;color:#ffd700;margin-bottom:6px;">📊 Статы</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>💪 STR</span><span style="color:#fff;">\${s.str}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>🏃 AGI</span><span style="color:#fff;">\${s.agi}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>🧠 INT</span><span style="color:#fff;">\${s.int}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>🛡️ VIT</span><span style="color:#fff;">\${s.vit}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span>🍀 LUCK</span><span style="color:#fff;">\${s.luck}</span></div>
        \${s.freePoints > 0 ? \`<div style="color:#ffd700;margin-top:6px;">✨ Очков: \${s.freePoints} (1-5)</div>\` : ''}
      </div>
    </div>
  \`;

  // Слоты экипировки — 3 колонки
  const renderEquipSlot = (slot) => {
    const item = eq[slot.id];
    const filled = !!item;
    return \`
      <div title="\${slot.name}" style="width:60px;height:60px;background:\${filled ? '#2a4a6a' : '#1a1a3e'};border:2px solid \${filled ? '#ffd700' : '#4a4aff'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;">
        \${filled ? slot.icon : \`<span style="opacity:0.3;font-size:24px;">\${slot.icon}</span>\`}
      </div>
    \`;
  };

  const leftCol = EQUIP_SLOTS.filter(s => s.col === 0).map(renderEquipSlot).join('');
  const centerCol = EQUIP_SLOTS.filter(s => s.col === 1).map(renderEquipSlot).join('');
  const rightCol = EQUIP_SLOTS.filter(s => s.col === 2).map(renderEquipSlot).join('');
  const bottomRow = EQUIP_SLOTS.filter(s => s.col === 'bottom').map(renderEquipSlot).join('');

  const centerPanel = \`
    <div style="width:260px;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;display:flex;flex-direction:column;gap:10px;align-items:center;">
      <div style="font-weight:bold;color:#ffd700;font-size:15px;">⚔️ Экипировка</div>
      <div style="display:flex;gap:15px;justify-content:center;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;gap:8px;">\${leftCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">\${centerCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">\${rightCol}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:5px;">\${bottomRow}</div>
    </div>
  \`;

  // Вкладки
  const tabs = [
    { id: 'all',      name: '📦 Всё' },
    { id: 'plants',   name: '🌿 Растения' },
    { id: 'potions',  name: '🧪 Зелья' },
    { id: 'weapons',  name: '⚔️ Оружие' },
    { id: 'misc',     name: '🎁 Разное' }
  ];
  const tabsHtml = tabs.map(t => 
    \`<button onclick="window.setInvV3Tab('\${t.id}')" style="padding:8px 14px;background:\${invV3Tab === t.id ? '#4a4aff' : '#1a1a3e'};color:white;border:1px solid #4a4aff;border-radius:6px;cursor:pointer;font-size:12px;">\${t.name}</button>\`
  ).join('');

  // Сетка 10×8 = 80 слотов
  const TOTAL_SLOTS = 80;
  let slotsHtml = '';
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const it = filtered[i];
    if (it) {
      // Есть предмет
      let info;
      if (it.isPlant && PLANTS[it.id]) {
        info = { name: PLANTS[it.id].name, icon: PLANTS[it.id].icon, rarity: PLANTS[it.id].rarity, price: PLANTS[it.id].price };
      } else {
        info = ITEM_INFO[it.id] || { name: it.id, icon: '❓', price: 1 };
      }
      const borderColor = info.rarity === 'legendary' ? '#ffd700'
                        : info.rarity === 'epic' ? '#a855f7'
                        : info.rarity === 'rare' ? '#4a8aff'
                        : '#4a4aff';
      
      const selected = sellSelection[it.id] ? 'box-shadow:0 0 0 3px #ff4444 inset;' : '';
      
      slotsHtml += \`
        <div onclick="window.clickInvSlot('\${it.id}', \${it.isPlant}, \${info.price})" 
          title="\${info.name}\${info.price ? ' — ' + info.price + '💰' : ''}" 
          style="position:relative;background:#1a1a3e;border:2px solid \${borderColor};border-radius:6px;padding:4px;text-align:center;cursor:pointer;\${selected}">
          <div style="font-size:22px;line-height:1;">\${info.icon}</div>
          <div style="font-size:9px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${info.name.substring(0, 10)}</div>
          <div style="position:absolute;bottom:2px;right:4px;font-size:11px;color:#ffd700;font-weight:bold;text-shadow:1px 1px 2px black;">\${it.count}</div>
        </div>
      \`;
    } else {
      // Пусто
      slotsHtml += \`<div style="background:#0a0a1a;border:1px solid #2a2a4a;border-radius:6px;"></div>\`;
    }
  }

  // Кнопки
  const sellBtn = sellMode 
    ? \`<button onclick="window.doSell()" style="padding:10px 20px;background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:13px;font-weight:bold;border:2px solid #ffd700;border-radius:6px;cursor:pointer;">💰 Продать выбранное (\${Object.keys(sellSelection).length})</button>
       <button onclick="window.toggleSellMode()" style="padding:10px 20px;background:#444;color:white;font-size:13px;border:1px solid #888;border-radius:6px;cursor:pointer;margin-left:8px;">Отмена</button>\`
    : \`<button onclick="window.toggleSellMode()" style="padding:10px 20px;background:linear-gradient(135deg,#2a6a2a,#4a8a35);color:white;font-size:13px;font-weight:bold;border:2px solid #88ff88;border-radius:6px;cursor:pointer;">💰 Продать предметы</button>
       <button onclick="window.toggleInventoryV3()" style="padding:10px 20px;background:#444;color:white;font-size:13px;border:1px solid #888;border-radius:6px;cursor:pointer;margin-left:8px;">Закрыть</button>\`;

  const rightPanel = \`
    <div style="flex:1;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;display:flex;flex-direction:column;">
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">\${tabsHtml}</div>
      <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(10,1fr);gap:5px;align-content:start;padding-right:5px;">
        \${slotsHtml}
      </div>
      <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #333;">
        <div style="font-size:12px;color:#888;">Слотов: \${filtered.length}/\${TOTAL_SLOTS}</div>
        <div>\${sellBtn}</div>
      </div>
    </div>
  \`;

  panel.innerHTML = leftPanel + centerPanel + rightPanel;
}

window.toggleInventoryV3 = toggleInventoryV3;
window.setInvV3Tab = (tab) => { invV3Tab = tab; renderInventoryV3(); };
window.toggleSellMode = () => { sellMode = !sellMode; sellSelection = {}; renderInventoryV3(); };

window.clickInvSlot = function(itemId, isPlant, price) {
  if (!sellMode) return;
  // В режиме продажи — выделение
  if (sellSelection[itemId]) {
    delete sellSelection[itemId];
  } else {
    sellSelection[itemId] = { isPlant, price };
  }
  renderInventoryV3();
};

window.doSell = function() {
  if (!character || !character.stats) return;
  let totalGold = 0;
  Object.entries(sellSelection).forEach(([itemId, data]) => {
    let count;
    if (data.isPlant) {
      count = plantInventory[itemId] || 0;
      delete plantInventory[itemId];
    } else if (craftInventory[itemId] !== undefined) {
      count = craftInventory[itemId] || 0;
      craftInventory[itemId] = 0;
    } else {
      count = inventory[itemId] || 0;
      inventory[itemId] = 0;
    }
    totalGold += count * data.price;
  });
  character.stats.gold += totalGold;
  updateStatsHUD();
  setNavStatus(\`💰 Продано на \${totalGold} золота\`, '#88ff88');
  sellMode = false;
  sellSelection = {};
  renderInventoryV3();
};

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — создаём v3 + вызываем initEquipmentV3
  content = content.replace(
    '  createInventoryV2();',
    `  createInventoryV2();
  createInventoryV3();
  initEquipmentV3();`
  );

  // Клавиша I — открывает V3 (вместо V2)
  content = content.replace(
    "    if (e.key.toLowerCase() === 'i') { toggleInventoryV2(); return; }\n    if (e.key === 'Escape' && inventoryOpen) { toggleInventory(); return; }",
    `    if (e.key.toLowerCase() === 'i') { toggleInventoryV3(); return; }
    if (e.key === 'Escape') { 
      if (invV3Open) { closeInventoryV3(); return; }
      if (inventoryOpen) { toggleInventory(); return; }
    }`
  );

  content = addMarker(content, 'inventory-v3');
  writeFile(MAIN_FILE, content);
  return true;
}