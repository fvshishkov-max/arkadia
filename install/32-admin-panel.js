// install/32-admin-panel.js — Админ-панель для тестирования
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'admin-panel')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: ADMIN PANEL (для тестирования)
// ============================================================

let adminOpen = false;

// Полный список всех предметов для выдачи
function getAllItemsList() {
  const items = [];
  
  // Ресурсы
  items.push({ id: 'wood',   name: 'Древесина', icon: '🪵', cat: 'resource' });
  items.push({ id: 'herb',   name: 'Трава',     icon: '🌿', cat: 'resource' });
  items.push({ id: 'acorn',  name: 'Жёлудь',    icon: '🌰', cat: 'resource' });
  items.push({ id: 'flower', name: 'Цветок',    icon: '🌸', cat: 'resource' });
  
  // Растения
  Object.entries(PLANTS).forEach(([id, p]) => {
    items.push({ id, name: p.name, icon: p.icon, cat: 'plant', rarity: p.rarity });
  });
  
  // Зелья
  Object.entries(POTIONS).forEach(([id, p]) => {
    items.push({ id, name: p.name, icon: p.icon, cat: 'potion' });
  });
  
  // Еда
  Object.entries(FOODS).forEach(([id, f]) => {
    items.push({ id, name: f.name, icon: f.icon, cat: 'food' });
  });
  
  // Оружие
  Object.entries(WEAPONS).forEach(([id, w]) => {
    items.push({ id, name: w.name, icon: w.icon, cat: 'weapon', rarity: w.rarity });
  });
  
  // Броня
  Object.entries(ARMORS).forEach(([id, a]) => {
    items.push({ id, name: a.name, icon: a.icon, cat: 'armor', rarity: a.rarity });
  });
  
  // Аксессуары
  Object.entries(ACCESSORIES).forEach(([id, acc]) => {
    items.push({ id, name: acc.name, icon: acc.icon, cat: 'accessory', rarity: acc.rarity });
  });
  
  return items;
}

// Создание админ-панели
function createAdminPanel() {
  if (document.getElementById('adminPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'adminPanel';
  panel.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(5, 5, 15, 0.97);
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 500; display: none;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  \`;
  document.getElementById('gameScreen').appendChild(panel);
}

// Переключение
function toggleAdmin() {
  adminOpen = !adminOpen;
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  panel.style.display = adminOpen ? 'flex' : 'none';
  if (adminOpen) renderAdmin();
}

// Открытие/закрытие
function renderAdmin() {
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  const s = character.stats;
  const allItems = getAllItemsList();

  // Фильтр
  const categories = [
    { id: 'resource',  name: '📦 Ресурсы' },
    { id: 'plant',     name: '🌿 Растения' },
    { id: 'potion',    name: '🧪 Зелья' },
    { id: 'food',      name: '🍞 Еда' },
    { id: 'weapon',    name: '⚔️ Оружие' },
    { id: 'armor',     name: '🛡️ Броня' },
    { id: 'accessory', name: '💍 Аксессуары' }
  ];

  // Статы
  const statRow = (label, key, icon) => \`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;background:#1a1a3e;border-radius:6px;margin-bottom:4px;">
      <span>\${icon} \${label}</span>
      <div style="display:flex;gap:5px;">
        <button onclick="window.adminSetStat('\${key}', -100)" style="padding:3px 10px;background:#5a2a2a;color:white;border:none;border-radius:4px;cursor:pointer;">−100</button>
        <button onclick="window.adminSetStat('\${key}', -10)" style="padding:3px 10px;background:#5a2a2a;color:white;border:none;border-radius:4px;cursor:pointer;">−10</button>
        <span style="min-width:50px;text-align:center;color:#ffd700;font-weight:bold;">\${s[key]}</span>
        <button onclick="window.adminSetStat('\${key}', 10)" style="padding:3px 10px;background:#2a5a2a;color:white;border:none;border-radius:4px;cursor:pointer;">+10</button>
        <button onclick="window.adminSetStat('\${key}', 100)" style="padding:3px 10px;background:#2a5a2a;color:white;border:none;border-radius:4px;cursor:pointer;">+100</button>
      </div>
    </div>
  \`;

  panel.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
      <div style="font-size:24px;font-weight:bold;color:#ff4444;">🛠️ АДМИН-ПАНЕЛЬ (P)</div>
      <button onclick="window.toggleAdmin()" style="background:transparent;border:none;color:#888;font-size:24px;cursor:pointer;">✕</button>
    </div>

    <div style="display:flex;gap:20px;flex:1;overflow:hidden;">
      
      <!-- ЛЕВАЯ: статы -->
      <div style="width:350px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;">
        <div style="background:#0a0a1a;border:2px solid #ff4444;border-radius:10px;padding:15px;">
          <div style="font-size:16px;color:#ff4444;font-weight:bold;margin-bottom:10px;">⚡ Быстрые действия</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button onclick="window.adminSetStat('level', 70)" style="padding:8px;background:#8a2be2;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Ур. 70</button>
            <button onclick="window.adminSetStat('gold', 1000000)" style="padding:8px;background:#8a6a00;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">💰 1.000.000</button>
            <button onclick="window.adminSetStat('hp', 99999)" style="padding:8px;background:#8a1a1a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">❤️ 99.999 HP</button>
            <button onclick="window.adminSetStat('mp', 99999)" style="padding:8px;background:#1a4a8a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🔵 99.999 MP</button>
            <button onclick="window.adminSetStat('str', 999)" style="padding:8px;background:#5a3a1a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">💪 STR 999</button>
            <button onclick="window.adminSetStat('luck', 999)" style="padding:8px;background:#5a5a1a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🍀 LUCK 999</button>
            <button onclick="window.adminResetStats()" style="padding:8px;background:#444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;grid-column:1/-1;">🔄 Сбросить статы</button>
          </div>
        </div>

        <div style="background:#0a0a1a;border:2px solid #4a4aff;border-radius:10px;padding:15px;">
          <div style="font-size:16px;color:#4a4aff;font-weight:bold;margin-bottom:10px;">📊 Статы</div>
          \${statRow('STR', 'str', '💪')}
          \${statRow('AGI', 'agi', '🏃')}
          \${statRow('INT', 'int', '🧠')}
          \${statRow('VIT', 'vit', '🛡️')}
          \${statRow('LUCK', 'luck', '🍀')}
          \${statRow('Уровень', 'level', '⭐')}
          \${statRow('HP', 'hp', '❤️')}
          \${statRow('MaxHP', 'maxHp', '💗')}
          \${statRow('MP', 'mp', '🔵')}
          \${statRow('Gold', 'gold', '💰')}
        </div>

        <div style="background:#0a0a1a;border:2px solid #ffd700;border-radius:10px;padding:15px;">
          <div style="font-size:16px;color:#ffd700;font-weight:bold;margin-bottom:10px;">🎁 Особое</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button onclick="window.adminGiveAllPlants()" style="padding:8px;background:#2a6a2a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;grid-column:1/-1;">🌿 Все 66 растений (×10)</button>
            <button onclick="window.adminGiveAllPotions()" style="padding:8px;background:#4a2a8a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;grid-column:1/-1;">🧪 Все зелья (×10)</button>
            <button onclick="window.adminGiveAllWeapons()" style="padding:8px;background:#8a2a2a;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;grid-column:1/-1;">⚔️ Всё оружие и броня</button>
            <button onclick="window.adminUnlockRecipes()" style="padding:8px;background:#8a6a00;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;grid-column:1/-1;">📜 Все рецепты (ур. 70)</button>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ: предметы -->
      <div style="flex:1;background:#0a0a1a;border:2px solid #4a4aff;border-radius:10px;padding:15px;display:flex;flex-direction:column;">
        <div style="font-size:16px;color:#4a4aff;font-weight:bold;margin-bottom:10px;">📦 Выдать предмет</div>
        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
          \${categories.map(c => \`
            <button onclick="window.adminFilterCat('\${c.id}')" id="adminCat_\${c.id}" style="padding:6px 12px;background:#1a1a3e;border:1px solid #4a4aff;color:white;border-radius:6px;cursor:pointer;font-size:12px;">\${c.name}</button>
          \`).join('')}
        </div>
        <div id="adminItemsList" style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;align-content:start;padding-right:5px;">
          \${renderAdminItems(allItems, null)}
        </div>
      </div>
    </div>
  \`;
}

function renderAdminItems(items, filter) {
  const filtered = filter ? items.filter(it => it.cat === filter) : items;
  return filtered.map(it => {
    const borderColor = it.rarity === 'legendary' ? '#ffd700'
                      : it.rarity === 'epic' ? '#a855f7'
                      : it.rarity === 'rare' ? '#4a8aff'
                      : '#4a4aff';
    return \`
      <div onclick="window.adminGiveItem('\${it.id}', '\${it.cat}', 10)" 
        title="Кликни чтобы получить ×10" 
        style="background:#1a1a3e;border:2px solid \${borderColor};border-radius:6px;padding:8px;text-align:center;cursor:pointer;transition:0.2s;"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:24px;">\${it.icon}</div>
        <div style="font-size:10px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">\${it.name}</div>
      </div>
    \`;
  }).join('');
}

window.adminFilterCat = function(cat) {
  const allItems = getAllItemsList();
  document.querySelectorAll('[id^="adminCat_"]').forEach(el => {
    el.style.background = '#1a1a3e';
    el.style.borderColor = '#4a4aff';
  });
  const active = document.getElementById('adminCat_' + cat);
  if (active) {
    active.style.background = '#4a4aff';
    active.style.borderColor = '#ffd700';
  }
  const list = document.getElementById('adminItemsList');
  if (list) list.innerHTML = renderAdminItems(allItems, cat);
};

window.adminSetStat = function(key, delta) {
  if (!character || !character.stats) return;
  const s = character.stats;
  if (delta === 0) {
    s[key] = 0;
  } else {
    s[key] = Math.max(0, (s[key] || 0) + delta);
    // Максимальные лимиты
    if (key === 'level') s.level = Math.min(70, Math.max(1, s.level));
    if (key === 'str' || key === 'agi' || key === 'int' || key === 'vit' || key === 'luck') {
      s[key] = Math.min(9999, Math.max(1, s[key]));
    }
  }
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderAdmin();
};

window.adminResetStats = function() {
  if (!character || !character.stats) return;
  const s = character.stats;
  s.str = 5; s.agi = 5; s.int = 5; s.vit = 5; s.luck = 5;
  s.level = 1;
  s.hp = 100; s.maxHp = 100;
  s.mp = 50; s.maxMp = 50;
  s.gold = 0;
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderAdmin();
};

window.adminGiveItem = function(itemId, cat, amount) {
  amount = amount || 1;
  if (cat === 'resource') {
    if (inventory[itemId] !== undefined) inventory[itemId] += amount;
  } else if (cat === 'plant') {
    plantInventory[itemId] = (plantInventory[itemId] || 0) + amount;
  } else {
    // potion / food / weapon / armor / accessory
    craftInventory[itemId] = (craftInventory[itemId] || 0) + amount;
  }
  setNavStatus(\`🛠️ Выдано ×\${amount}\`, '#ffd700');
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  if (typeof updateInventoryHUD === 'function') updateInventoryHUD();
  console.log(\`🛠️ Admin: +\${amount}× \${itemId}\`);
};

window.adminGiveAllPlants = function() {
  Object.keys(PLANTS).forEach(id => {
    plantInventory[id] = (plantInventory[id] || 0) + 10;
  });
  setNavStatus('🛠️ Все 66 растений ×10', '#ffd700');
};

window.adminGiveAllPotions = function() {
  Object.keys(POTIONS).forEach(id => {
    craftInventory[id] = (craftInventory[id] || 0) + 10;
  });
  setNavStatus('🛠️ Все зелья ×10', '#ffd700');
};

window.adminGiveAllWeapons = function() {
  Object.keys(WEAPONS).forEach(id => craftInventory[id] = (craftInventory[id] || 0) + 1);
  Object.keys(ARMORS).forEach(id => craftInventory[id] = (craftInventory[id] || 0) + 1);
  Object.keys(ACCESSORIES).forEach(id => craftInventory[id] = (craftInventory[id] || 0) + 1);
  setNavStatus('🛠️ Всё оружие и броня выдано', '#ffd700');
};

window.adminUnlockRecipes = function() {
  // Просто ставим уровень 70 — все рецепты открыты
  if (character && character.stats) {
    character.stats.level = 70;
    if (typeof recalcMaxHP === 'function') recalcMaxHP();
    if (typeof updateStatsHUD === 'function') updateStatsHUD();
  }
  setNavStatus('🛠️ Уровень 70 — все рецепты открыты', '#ffd700');
  renderAdmin();
};

// Переключение через P
window.toggleAdmin = toggleAdmin;

// Горячая клавиша
window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // Игнорируем если открыт чат или input в фокусе
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (typeof battle !== 'undefined' && battle) return;  // не в бою
    if (typeof bossBattle !== 'undefined' && bossBattle) return;
    e.preventDefault();
    toggleAdmin();
  }
});

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — создаём панель
  content = content.replace(
    '  createQuestsPanel();',
    `  createQuestsPanel();
  createAdminPanel();`
  );

  content = addMarker(content, 'admin-panel');
  writeFile(MAIN_FILE, content);
  return true;
}