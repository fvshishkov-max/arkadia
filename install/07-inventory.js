// install/07-inventory.js — Инвентарь UI + крафт
export default async function install({ readFile, writeFile, backup, insertBefore, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'inventory')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
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
    itemsHtml += \`
      <div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:8px;text-align:center;min-height:60px;">
        <div style="font-size:24px;">\${it.icon}</div>
        <div style="font-size:10px;color:#ccc;">\${it.name}</div>
        <div style="font-size:14px;color:#ffd700;font-weight:bold;">\${it.count}</div>
      </div>
    \`;
  });
  itemsHtml += '</div>';

  let recipesHtml = '<div style="font-weight:bold;color:#ffd700;margin-bottom:8px;">⚗️ Крафт</div>';
  RECIPES.forEach(r => {
    const canCraft = Object.keys(r.need).every(k => inventory[k] >= r.need[k]);
    const needText = Object.entries(r.need).map(([k, v]) => {
      const names = { wood: '🪵', herb: '🌿', acorn: '🌰', flower: '🌸' };
      return \`\${names[k]}×\${v}\`;
    }).join(' ');
    recipesHtml += \`
      <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1a3e;border:1px solid #4a4aff;border-radius:6px;padding:8px;margin-bottom:6px;">
        <div>
          <div style="font-size:13px;">\${r.icon} \${r.name}</div>
          <div style="font-size:10px;color:#888;">Нужно: \${needText}</div>
        </div>
        <button \${canCraft ? '' : 'disabled'} style="padding:6px 12px;background:\${canCraft ? '#2a6a2a' : '#333'};color:white;border:none;border-radius:4px;cursor:\${canCraft ? 'pointer' : 'not-allowed'};" onclick="window.craftItem('\${r.id}')">Создать</button>
      </div>
    \`;
  });

  panel.innerHTML = \`
    <div style="font-weight:bold;color:#ffd700;margin-bottom:10px;font-size:16px;">🎒 Инвентарь</div>
    \${itemsHtml}
    \${recipesHtml}
    <div style="font-size:11px;color:#888;margin-top:12px;">Закрыть: клавиша <b>I</b> или Esc</div>
  \`;
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
  setNavStatus(\`⚗️ Создано: \${r.icon} \${r.name}\`, '#88ff88');
  if (socket) socket.emit('inventory', { ...inventory, ...craftInventory });
};

function createInventoryFullPanel() {
  if (document.getElementById('inventoryFullPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'inventoryFullPanel';
  panel.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; max-height: 80vh; overflow-y: auto;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #4a4aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-shadow: 0 0 40px rgba(74, 74, 255, 0.6);
  \`;
  document.getElementById('gameScreen').appendChild(panel);
}

`;

  content = insertBefore(content, '// ============================================================\n//  СОКЕТЫ', code, 'inventory');

  content = content.replace(
    '  createHUDs();',
    `  createHUDs();
  createInventoryFullPanel();`
  );

  // Клавиша I
  content = content.replace(
    "  window.addEventListener('keydown', e => {",
    `  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'i') { toggleInventory(); return; }
    if (e.key === 'Escape' && inventoryOpen) { toggleInventory(); return; }`
  );

  content = addMarker(content, 'inventory');
  writeFile(MAIN_FILE, content);
  return true;
}