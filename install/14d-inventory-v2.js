// install/14d-inventory-v2.js — Инвентарь с персонажем и снаряжением
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'inventory-v2')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: INVENTORY V2 (персонаж + снаряжение + сетка)
// ============================================================

let invV2Open = false;
let invTab = 'all'; // all / plants / potions / weapons / misc

// Экипировка
character.equipment = character.equipment || {
  head: null, body: null, legs: null, boots: null,
  weapon: null, shield: null, ring: null, amulet: null
};

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
  panel.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 720px; height: 520px;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #4a4aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-shadow: 0 0 50px rgba(74, 74, 255, 0.7);
  \`;
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

  const s = character.stats || { hp: 0, maxHp: 100, level: 1, gold: 0 };
  const eq = character.equipment;

  // Левая часть — персонаж + снаряжение
  const leftPart = \`
    <div style="display:flex;gap:20px;">
      <div style="width:200px;">
        <div style="font-weight:bold;color:#ffd700;margin-bottom:10px;font-size:16px;">👤 \${character.name}</div>
        <div style="background:linear-gradient(135deg,#1a1a3e,#2a2a5e);border:2px solid #4a4aff;border-radius:8px;height:220px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;position:relative;">
          <div style="font-size:60px;">🧙</div>
          <div style="position:absolute;top:5px;left:5px;font-size:11px;color:#ffd700;">Ур. \${s.level}</div>
        </div>
        <div style="font-size:12px;">
          <div>❤️ HP: \${s.hp}/\${s.maxHp}</div>
          <div>💰 Золото: \${s.gold}</div>
        </div>
      </div>

      <div style="width:80px;display:flex;flex-direction:column;justify-content:space-around;">
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Шлем">\${eq.head ? '🪖' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Броня">\${eq.body ? '🛡️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Штаны">\${eq.legs ? '👖' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Сапоги">\${eq.boots ? '🥾' : '⬜'}</div>
      </div>

      <div style="width:80px;display:flex;flex-direction:column;justify-content:space-around;">
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Оружие">\${eq.weapon ? '⚔️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Щит">\${eq.shield ? '🛡️' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Кольцо">\${eq.ring ? '💍' : '⬜'}</div>
        <div style="height:60px;background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;" title="Амулет">\${eq.amulet ? '📿' : '⬜'}</div>
      </div>
    </div>
  \`;

  // Правая часть — инвентарь с вкладками
  const tabsHtml = Object.entries(INV_CATEGORIES).map(([id, cat]) => 
    \`<button onclick="window.setInvTab('\${id}')" style="padding:6px 12px;background:\${invTab === id ? '#4a4aff' : '#1a1a3e'};color:white;border:1px solid #4a4aff;border-radius:6px;cursor:pointer;font-size:12px;">\${cat.name}</button>\`
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
      }).join('');

  panel.innerHTML = \`
    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
      <div style="font-weight:bold;color:#ffd700;font-size:18px;">🎒 Инвентарь</div>
      <button onclick="window.toggleInventoryV2()" style="background:transparent;border:none;color:#888;font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div style="display:flex;gap:20px;height:calc(100% - 60px);">
      <div style="width:380px;">\${leftPart}</div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">\${tabsHtml}</div>
        <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-content:start;">
          \${slotsHtml}
        </div>
      </div>
    </div>
  \`;
}

window.setInvTab = function(tab) {
  invTab = tab;
  renderInventoryV2();
};

window.toggleInventoryV2 = toggleInventoryV2;

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) return false;
  content = content.replace(anchor, code + '\n' + anchor);

  // Заменяем старый обработчик I
  content = content.replace(
    "    if (e.key.toLowerCase() === 'i') { toggleInventory(); return; }",
    "    if (e.key.toLowerCase() === 'i') { toggleInventoryV2(); return; }"
  );

  // В startGame — создаём панель
  content = content.replace(
    '  createInventoryFullPanel();',
    `  createInventoryFullPanel();
  createInventoryV2();`
  );

  content = addMarker(content, 'inventory-v2');
  writeFile(MAIN_FILE, content);
  return true;
}