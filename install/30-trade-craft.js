// install/30-trade-craft.js — Торговля, крафт v2, экипировка
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'trade-craft')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: TRADE & CRAFT V2
// ============================================================

// ============================================================
//  НОВЫЕ ПРЕДМЕТЫ: ЗЕЛЬЯ
// ============================================================
const POTIONS = {
  hp_small:   { name: 'Малое зелье HP',  icon: '🧪', type: 'hp',    value: 0.30, level: 1,  price: 25,  stack: 99 },
  hp_large:   { name: 'Большое зелье HP',icon: '❤️', type: 'hp',    value: 0.60, level: 5,  price: 75,  stack: 99 },
  hp_great:   { name: 'Великое зелье HP',icon: '💖', type: 'hp',    value: 1.00, level: 20, price: 250, stack: 99 },
  mp_small:   { name: 'Малое зелье MP',  icon: '🔵', type: 'mp',    value: 0.50, level: 3,  price: 30,  stack: 99 },
  mp_large:   { name: 'Большое зелье MP',icon: '💙', type: 'mp',    value: 1.00, level: 12, price: 100, stack: 99 },
  elixir_str: { name: 'Эликсир силы',    icon: '✨', type: 'buff_str', value: 10, level: 8,  price: 150, stack: 10 },
  elixir_agi: { name: 'Эликсир ловкости',icon: '💨', type: 'buff_agi', value: 10, level: 10, price: 150, stack: 10 },
  elixir_imm: { name: 'Эликсир бессмертия', icon: '👑', type: 'buff_all', value: 20, level: 30, price: 2000, stack: 5 },
  regen:      { name: 'Зелье регенерации', icon: '💚', type: 'regen', value: 5, level: 15, price: 200, stack: 20 }
};

// ============================================================
//  ЕДА
// ============================================================
const FOODS = {
  bread:    { name: 'Хлеб',      icon: '🍞', hp: 20, mp: 0,  level: 1,  price: 10 },
  soup:     { name: 'Похлёбка',  icon: '🍲', hp: 40, mp: 10, level: 3,  price: 25 },
  roast:    { name: 'Жаркое',    icon: '🍖', hp: 80, mp: 0,  level: 8,  price: 60 },
  fish:     { name: 'Рыба',      icon: '🐟', hp: 30, mp: 20, level: 5,  price: 40 },
  pie:      { name: 'Пирог',     icon: '🥧', hp: 60, mp: 30, level: 10, price: 80 }
};

// ============================================================
//  ОРУЖИЕ (полная система)
// ============================================================
const WEAPONS = {
  iron_sword:   { name: 'Железный меч',    icon: '⚔️', slot: 'weapon', damage: 8,  speed: 0,  crit: 0,  slots: 1, level: 1,  reqStr: 5,  price: 100, rarity: 'common' },
  steel_sword:  { name: 'Стальной меч',    icon: '🗡️', slot: 'weapon', damage: 15, speed: 5,  crit: 2,  slots: 2, level: 5,  reqStr: 10, price: 500, rarity: 'rare' },
  iron_axe:     { name: 'Железный топор',  icon: '🪓', slot: 'weapon', damage: 12, speed: -5, crit: 3,  slots: 1, level: 3,  reqStr: 8,  price: 250, rarity: 'common' },
  berserker_axe:{ name: 'Топор берсерка',  icon: '🪓', slot: 'weapon', damage: 25, speed: -10,crit: 10, slots: 2, level: 15, reqStr: 20, price: 2000, rarity: 'epic' },
  magic_staff:  { name: 'Посох магии',     icon: '🪄', slot: 'weapon', damage: 10, speed: 0,  crit: 5,  slots: 2, level: 20, reqInt: 15, price: 3000, rarity: 'epic' },
  magic_bow:    { name: 'Магический лук',  icon: '🏹', slot: 'weapon', damage: 22, speed: 15, crit: 10, slots: 2, level: 25, reqAgi: 15, reqLuck: 10, price: 5000, rarity: 'legendary' },
  mithril_sword:{ name: 'Мифрильный меч',  icon: '⚔️', slot: 'weapon', damage: 35, speed: 10, crit: 8,  slots: 3, level: 30, reqStr: 25, price: 10000, rarity: 'legendary' },
  dragon_sword: { name: 'Драконий меч',    icon: '🐉', slot: 'weapon', damage: 60, speed: 15, crit: 15, slots: 3, level: 40, reqStr: 40, price: 25000, rarity: 'legendary' }
};

// ============================================================
//  БРОНЯ
// ============================================================
const ARMORS = {
  leather_helm: { name: 'Кожаный шлем', icon: '🪖', slot: 'head', armor: 3,  hp: 10,  level: 3,  price: 50,   rarity: 'common' },
  iron_helm:    { name: 'Железный шлем',icon: '⛑️', slot: 'head', armor: 8,  hp: 25,  level: 10, price: 500,  rarity: 'rare' },
  leather_body: { name: 'Кожаная броня',icon: '🥋', slot: 'body', armor: 5,  hp: 20,  level: 5,  price: 100,  rarity: 'common' },
  iron_body:    { name: 'Железная броня',icon:'🛡️', slot: 'body', armor: 15, hp: 50,  level: 12, price: 1000, rarity: 'rare' },
  mithril_body: { name: 'Мифрильная броня',icon:'✨',slot:'body', armor: 30, hp: 120, level: 30, price: 8000, rarity: 'legendary' },
  leather_legs: { name: 'Кожаные штаны',icon: '👖', slot: 'legs', armor: 3,  hp: 10,  level: 3,  price: 50,   rarity: 'common' },
  iron_legs:    { name: 'Железные поножи',icon:'🦿',slot: 'legs', armor: 10, hp: 30,  level: 10, price: 700,  rarity: 'rare' },
  leather_boots:{ name: 'Кожаные сапоги',icon:'🥾', slot: 'boots',armor: 2,  hp: 5,   level: 2,  price: 30,   rarity: 'common' },
  swift_boots:  { name: 'Сапоги скорости',icon:'👟',slot: 'boots',armor: 5,  hp: 15,  speed: 10, level: 15, price: 1500, rarity: 'epic' }
};

// ============================================================
//  АКСЕССУАРЫ
// ============================================================
const ACCESSORIES = {
  copper_ring:  { name: 'Медное кольцо',  icon: '💍', slot: 'ring',   str: 2,  level: 5,  price: 200,  rarity: 'common' },
  silver_ring:  { name: 'Серебряное кольцо',icon:'💍',slot: 'ring',   int: 5,  crit: 3, level: 15, price: 1500, rarity: 'rare' },
  gold_amulet:  { name: 'Золотой амулет', icon: '📿', slot: 'amulet', hp: 30,  mp: 20,  level: 10, price: 1000, rarity: 'rare' },
  dark_cloak:   { name: 'Тёмный плащ',    icon: '🧥', slot: 'cloak',  agi: 5,  luck: 3, level: 12, price: 1200, rarity: 'epic' },
  silver_belt:  { name: 'Серебряный пояс',icon: '🎗️', slot: 'belt',   hp: 40,  level: 8,  price: 600,  rarity: 'rare' },
  leather_gloves:{name: 'Кожаные перчатки',icon:'🧤', slot: 'gloves', str: 3,  agi: 2,  level: 6,  price: 300,  rarity: 'common' }
};

// ============================================================
//  РЕЦЕПТЫ
// ============================================================
const RECIPES_V2 = [
  // Зелья (Алхимик)
  { id: 'r_hp_small',  result: 'hp_small',  type: 'potion', level: 1,  need: { herb: 3, chamomile: 1 },      table: 'alchemist' },
  { id: 'r_mp_small',  result: 'mp_small',  type: 'potion', level: 3,  need: { herb: 3, clover: 1 },         table: 'alchemist' },
  { id: 'r_hp_large',  result: 'hp_large',  type: 'potion', level: 5,  need: { herb: 5, mint: 2, truffle: 1 }, table: 'alchemist' },
  { id: 'r_elixir_str',result: 'elixir_str',type: 'potion', level: 8,  need: { mint: 3, acorn: 1 },          table: 'alchemist' },
  { id: 'r_elixir_agi',result: 'elixir_agi',type: 'potion', level: 10, need: { lavender: 3, flower: 2 },     table: 'alchemist' },
  { id: 'r_mp_large',  result: 'mp_large',  type: 'potion', level: 12, need: { herb: 8, clover: 3, moongrass: 1 }, table: 'alchemist' },
  { id: 'r_regen',     result: 'regen',     type: 'potion', level: 15, need: { moongrass: 2, lotus: 1 },     table: 'alchemist' },
  { id: 'r_hp_great',  result: 'hp_great',  type: 'potion', level: 20, need: { truffle: 3, lotus: 2, orchid: 1 }, table: 'alchemist' },
  { id: 'r_elixir_imm',result: 'elixir_imm',type: 'potion', level: 30, need: { lifeseed: 1, rainbowfl: 1, starflower: 1 }, table: 'alchemist' },

  // Еда (Таверна)
  { id: 'r_bread',  result: 'bread', type: 'food', level: 1,  need: { herb: 2, chamomile: 1 }, table: 'tavern' },
  { id: 'r_soup',   result: 'soup',  type: 'food', level: 3,  need: { herb: 3, mint: 1 },      table: 'tavern' },
  { id: 'r_fish',   result: 'fish',  type: 'food', level: 5,  need: { reed: 2, herb: 2 },      table: 'tavern' },
  { id: 'r_roast',  result: 'roast', type: 'food', level: 8,  need: { acorn: 3, mushroom: 1 }, table: 'tavern' },
  { id: 'r_pie',    result: 'pie',   type: 'food', level: 10, need: { acorn: 2, coconut: 1, herb: 3 }, table: 'tavern' },

  // Оружие (Кузнец)
  { id: 'r_iron_sword',  result: 'iron_sword',  type: 'weapon', level: 1,  need: { wood: 5, gold: 10 },  table: 'blacksmith' },
  { id: 'r_iron_axe',    result: 'iron_axe',    type: 'weapon', level: 3,  need: { wood: 8, gold: 20 },  table: 'blacksmith' },
  { id: 'r_steel_sword', result: 'steel_sword', type: 'weapon', level: 5,  need: { wood: 10, gold: 50, stone: 5 }, table: 'blacksmith' },
  { id: 'r_berserker_axe',result:'berserker_axe',type:'weapon',level: 15, need: { wood: 20, gold: 200, lavamush: 1 }, table: 'blacksmith' },
  { id: 'r_magic_staff', result: 'magic_staff', type: 'weapon', level: 20, need: { bamboo: 5, moongrass: 3, gold: 300 }, table: 'blacksmith' },
  { id: 'r_magic_bow',   result: 'magic_bow',   type: 'weapon', level: 25, need: { bamboo: 10, liana: 5, orchid: 2, gold: 500 }, table: 'blacksmith' },
  { id: 'r_mithril_sword',result:'mithril_sword',type:'weapon',level: 30, need: { stonemoss: 5, gold: 1000, crystal: 1 }, table: 'blacksmith' },
  { id: 'r_dragon_sword',result: 'dragon_sword',type: 'weapon',level: 40, need: { youngdragon: 1, flamemoss: 5, gold: 5000 }, table: 'blacksmith' },

  // Броня (Кузнец)
  { id: 'r_leather_helm',result:'leather_helm',type:'armor', level: 3,  need: { wood: 3, gold: 5 },   table: 'blacksmith' },
  { id: 'r_leather_body',result:'leather_body',type:'armor', level: 5,  need: { wood: 5, gold: 10 },  table: 'blacksmith' },
  { id: 'r_iron_helm',   result:'iron_helm',   type:'armor', level: 10, need: { wood: 8, gold: 50 },  table: 'blacksmith' },
  { id: 'r_iron_body',   result:'iron_body',   type:'armor', level: 12, need: { wood: 12, gold: 100, stone: 10 }, table: 'blacksmith' },
  { id: 'r_mithril_body',result:'mithril_body',type:'armor', level: 30, need: { stonemoss: 10, gold: 2000, crystal: 2 }, table: 'blacksmith' }
];

// ============================================================
//  ПРОВЕРКА УРОВНЯ РЕЦЕПТА
// ============================================================
function canCraftRecipe(recipe) {
  if (!character || !character.stats) return false;
  return character.stats.level >= recipe.level;
}

function canUseItem(item) {
  if (!character || !character.stats) return false;
  return character.stats.level >= (item.level || 1);
}

// ============================================================
//  ИСПОЛЬЗОВАНИЕ ЗЕЛИЙ
// ============================================================
function usePotion(potionId) {
  const p = POTIONS[potionId];
  if (!p || !character || !character.stats) return false;
  if (!craftInventory[potionId] || craftInventory[potionId] <= 0) return false;

  const s = character.stats;
  if (p.type === 'hp') {
    const heal = Math.floor(s.maxHp * p.value);
    s.hp = Math.min(s.maxHp, s.hp + heal);
    setNavStatus(\`🧪 +\${heal} HP\`, '#88ff88');
  } else if (p.type === 'mp') {
    const heal = Math.floor(s.maxMp * p.value);
    s.mp = Math.min(s.maxMp, s.mp + heal);
    setNavStatus(\`🔵 +\${heal} MP\`, '#4a8aff');
  } else if (p.type === 'buff_str') {
    s.str += p.value;
    setNavStatus(\`✨ +\${p.value} STR (постоянно)\`, '#ffd700');
  } else if (p.type === 'buff_agi') {
    s.agi += p.value;
    setNavStatus(\`💨 +\${p.value} AGI (постоянно)\`, '#ffd700');
  } else if (p.type === 'buff_all') {
    s.str += p.value; s.agi += p.value; s.int += p.value; s.vit += p.value; s.luck += p.value;
    setNavStatus(\`👑 +\${p.value} ко всем статам!\`, '#ffd700');
  }

  craftInventory[potionId]--;
  updateStatsHUD();
  return true;
}

// ============================================================
//  ОКНА ТОРГОВЦЕВ
// ============================================================

function openShopWindow() {
  if (document.getElementById('shopWindow')) return;

  const s = character.stats;
  const win = document.createElement('div');
  win.id = 'shopWindow';
  win.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 700px; max-height: 80vh;
    background: rgba(10, 5, 20, 0.98);
    border: 3px solid #ffd700; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 400; overflow-y: auto;
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.6);
  \`;

  let content = \`
    <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
      <div style="font-size:22px;font-weight:bold;color:#ffd700;">🛒 Торговец</div>
      <div style="font-size:18px;color:#ffd700;">💰 \${s.gold}</div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:15px;">
      <button onclick="window.shopTab('sell')" id="shopSellBtn" style="flex:1;padding:10px;background:#2a4a2a;border:2px solid #88ff88;border-radius:6px;color:#fff;cursor:pointer;font-size:14px;font-weight:bold;">📤 Продать</button>
      <button onclick="window.shopTab('buy')" id="shopBuyBtn" style="flex:1;padding:10px;background:#4a4a2a;border:2px solid #ffd700;border-radius:6px;color:#fff;cursor:pointer;font-size:14px;font-weight:bold;">📥 Купить</button>
      <button onclick="window.closeShop()" style="padding:10px 20px;background:#333;border:2px solid #666;border-radius:6px;color:#fff;cursor:pointer;">✕</button>
    </div>
    <div id="shopContent"></div>
  \`;

  win.innerHTML = content;
  document.getElementById('gameScreen').appendChild(win);
  window.shopTab('sell');
}

window.shopTab = function(tab) {
  const content = document.getElementById('shopContent');
  if (!content) return;

  if (tab === 'sell') {
    // Продажа: все ресурсы + растения
    let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';

    // Базовые ресурсы
    const basics = [
      { id: 'wood', name: 'Древесина', icon: '🪵', price: 2, count: inventory.wood },
      { id: 'herb', name: 'Трава', icon: '🌿', price: 3, count: inventory.herb },
      { id: 'acorn', name: 'Жёлудь', icon: '🌰', price: 15, count: inventory.acorn },
      { id: 'flower', name: 'Цветок', icon: '🌸', price: 20, count: inventory.flower }
    ];
    basics.forEach(b => {
      if (b.count > 0) {
        html += \`<div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:10px;text-align:center;cursor:pointer;" onclick="window.sellItem('\${b.id}', \${b.price})">
          <div style="font-size:24px;">\${b.icon}</div>
          <div style="font-size:11px;">\${b.name}</div>
          <div style="color:#ffd700;font-weight:bold;">\${b.count} × \${b.price}💰</div>
        </div>\`;
      }
    });

    // Все растения
    Object.entries(plantInventory).forEach(([plantId, count]) => {
      if (count <= 0) return;
      const plant = PLANTS[plantId];
      if (!plant) return;
      html += \`<div style="background:#1a1a3e;border:2px solid #4a4aff;border-radius:6px;padding:10px;text-align:center;cursor:pointer;" onclick="window.sellItem('\${plantId}', \${plant.price}, true)">
        <div style="font-size:24px;">\${plant.icon}</div>
        <div style="font-size:10px;">\${plant.name}</div>
        <div style="color:#ffd700;font-weight:bold;">\${count} × \${plant.price}💰</div>
      </div>\`;
    });

    html += '</div>';
    content.innerHTML = html;
  } else {
    // Покупка: зелья, еда, оружие, броня
    let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';

    // Зелья
    Object.entries(POTIONS).forEach(([id, p]) => {
      if (p.level > character.stats.level) return;
      html += \`<div style="background:#1a1a3e;border:2px solid #8a2be2;border-radius:6px;padding:10px;text-align:center;cursor:pointer;" onclick="window.buyItem('\${id}', \${p.price}, 'potion')">
        <div style="font-size:24px;">\${p.icon}</div>
        <div style="font-size:10px;">\${p.name}</div>
        <div style="color:#ffd700;font-weight:bold;">\${p.price}💰</div>
      </div>\`;
    });

    // Еда
    Object.entries(FOODS).forEach(([id, f]) => {
      if (f.level > character.stats.level) return;
      html += \`<div style="background:#1a1a3e;border:2px solid #4a8aff;border-radius:6px;padding:10px;text-align:center;cursor:pointer;" onclick="window.buyItem('\${id}', \${f.price}, 'food')">
        <div style="font-size:24px;">\${f.icon}</div>
        <div style="font-size:10px;">\${f.name}</div>
        <div style="color:#ffd700;font-weight:bold;">\${f.price}💰</div>
      </div>\`;
    });

    html += '</div>';
    content.innerHTML = html;
  }
};

window.sellItem = function(itemId, price, isPlant = false) {
  const s = character.stats;
  let count;
  if (isPlant) {
    count = plantInventory[itemId] || 0;
    if (count <= 0) return;
    plantInventory[itemId] = 0;
  } else {
    count = inventory[itemId] || 0;
    if (count <= 0) return;
    inventory[itemId] = 0;
  }
  const total = count * price;
  s.gold += total;
  setNavStatus(\`💰 Продано \${count}× за \${total} золота\`, '#88ff88');
  updateStatsHUD();
  updateInventoryHUD();
  window.shopTab('sell');
};

window.buyItem = function(itemId, price, type) {
  const s = character.stats;
  if (s.gold < price) {
    setNavStatus('❌ Не хватает золота', '#ff6666');
    return;
  }
  s.gold -= price;
  if (!craftInventory[itemId]) craftInventory[itemId] = 0;
  craftInventory[itemId]++;
  setNavStatus(\`📥 Куплено за \${price}💰\`, '#88ff88');
  updateStatsHUD();
};

window.closeShop = function() {
  const el = document.getElementById('shopWindow');
  if (el) el.remove();
};

// ============================================================
//  ОКНО КРАФТА (Алхимик / Кузнец / Таверна)
// ============================================================

function openCraftWindow(table) {
  if (document.getElementById('craftWindow')) return;

  const s = character.stats;
  const tableNames = { alchemist: '🧪 Алхимик', blacksmith: '🔨 Кузнец', tavern: '🍺 Таверна' };
  const win = document.createElement('div');
  win.id = 'craftWindow';
  win.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 720px; max-height: 80vh;
    background: rgba(10, 5, 20, 0.98);
    border: 3px solid #8a2be2; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 400; overflow-y: auto;
    box-shadow: 0 0 50px rgba(138, 43, 226, 0.6);
  \`;

  const recipes = RECIPES_V2.filter(r => r.table === table);
  let html = \`
    <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
      <div style="font-size:22px;font-weight:bold;color:#8a2be2;">\${tableNames[table]} — Крафт</div>
      <button onclick="window.closeCraft()" style="padding:6px 14px;background:#333;border:2px solid #666;border-radius:6px;color:#fff;cursor:pointer;">✕</button>
    </div>
  \`;

  recipes.forEach(r => {
    const unlocked = canCraftRecipe(r);
    const canCraft = unlocked && Object.entries(r.need).every(([k, v]) => {
      if (k === 'gold') return s.gold >= v;
      return (inventory[k] || 0) >= v || (plantInventory[k] || 0) >= v;
    });

    const resultItem = POTIONS[r.result] || FOODS[r.result] || WEAPONS[r.result] || ARMORS[r.result] || ACCESSORIES[r.result];
    if (!resultItem) return;

    const needText = Object.entries(r.need).map(([k, v]) => {
      let icon = '❓', name = k;
      if (k === 'gold') { icon = '💰'; name = ''; }
      else if (inventory[k] !== undefined) { icon = ITEM_INFO[k]?.icon || '📦'; }
      else if (PLANTS[k]) { icon = PLANTS[k].icon; name = ''; }
      const have = k === 'gold' ? s.gold : (inventory[k] || 0) + (plantInventory[k] || 0);
      const ok = have >= v;
      return \`<span style="color:\${ok ? '#88ff88' : '#ff6666'};">\${icon} \${have}/\${v}</span>\`;
    }).join(' ');

    html += \`
      <div style="background:\${unlocked ? '#1a1a3e' : '#0a0a1a'};border:2px solid \${unlocked ? '#4a4aff' : '#333'};border-radius:8px;padding:12px;margin-bottom:8px;opacity:\${unlocked ? 1 : 0.5};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:bold;color:#ffd700;">\${resultItem.icon} \${resultItem.name}</div>
            <div style="font-size:11px;color:#aaa;margin:4px 0;">Ур. \${r.level} • Нужно: \${needText}</div>
          </div>
          <button \${canCraft ? '' : 'disabled'} onclick="window.craftItem('\${r.id}')" style="padding:10px 20px;background:\${canCraft ? 'linear-gradient(135deg,#2a6a2a,#4a8a35)' : '#333'};color:white;border:2px solid \${canCraft ? '#88ff88' : '#555'};border-radius:6px;cursor:\${canCraft ? 'pointer' : 'not-allowed'};font-weight:bold;">Создать</button>
        </div>
      </div>
    \`;
  });

  win.innerHTML = html;
  document.getElementById('gameScreen').appendChild(win);
}

window.craftItem = function(recipeId) {
  const r = RECIPES_V2.find(x => x.id === recipeId);
  if (!r || !canCraftRecipe(r)) return;
  const s = character.stats;

  // Проверяем ресурсы
  for (const [k, v] of Object.entries(r.need)) {
    if (k === 'gold') {
      if (s.gold < v) return;
    } else {
      const have = (inventory[k] || 0) + (plantInventory[k] || 0);
      if (have < v) return;
    }
  }

  // Списываем
  for (const [k, v] of Object.entries(r.need)) {
    if (k === 'gold') s.gold -= v;
    else {
      let need = v;
      // Сначала из inventory, потом из plantInventory
      if (inventory[k] !== undefined) {
        const take = Math.min(need, inventory[k]);
        inventory[k] -= take;
        need -= take;
      }
      if (need > 0 && plantInventory[k]) {
        const take = Math.min(need, plantInventory[k]);
        plantInventory[k] -= take;
        need -= take;
      }
    }
  }

  // Добавляем результат
  if (!craftInventory[r.result]) craftInventory[r.result] = 0;
  craftInventory[r.result]++;
  
  if (r.type === 'potion') playerStats.potionsCrafted = (playerStats.potionsCrafted || 0) + 1;

  setNavStatus(\`⚗️ Создано: \${r.result}\`, '#88ff88');
  updateStatsHUD();
  updateInventoryHUD();
  if (typeof checkAchievements === 'function') checkAchievements();
  window.closeCraft();
  window.openCraftWindow(r.table);
};

window.closeCraft = function() {
  const el = document.getElementById('craftWindow');
  if (el) el.remove();
};

// ============================================================
//  ОТКРЫТИЕ ОКОН ПО КЛИКУ NPC
// ============================================================

function openNpcMenu(npcId) {
  const menus = {
    merchant: 'shop',
    smith: 'blacksmith',
    alchem: 'alchemist',
    alchemistE: 'alchemist',
    weaponsmith: 'blacksmith'
  };
  const shopMenus = {
    merchant: () => openShopWindow(),
    smith: () => openCraftWindow('blacksmith'),
    alchem: () => openCraftWindow('alchemist'),
    alchemistE: () => openCraftWindow('alchemist'),
    weaponsmith: () => openCraftWindow('blacksmith')
  };
  if (shopMenus[npcId]) {
    shopMenus[npcId]();
  } else {
    alert(\`\${npcId}: диалог скоро\`);
  }
}

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // Расширяем клик по NPC — открываем меню
  content = content.replace(
    `      console.log(\`🖱️ Клик по NPC: \${npc.name}\`);
      alert(\`\${npc.icon} \${npc.name}\\n\\n(диалог скоро)\`);
      return;`,
    `      console.log(\`🖱️ Клик по NPC: \${npc.name}\`);
      openNpcMenu(npc.id);
      return;`
  );

  // Использование зелий в бою — обновляем battlePotion
  content = content.replace(
    `window.battlePotion = function() {
  if (!battle) return;
  const s = character.stats;
  // Проверяем есть ли зелье в инвентаре
  const potions = craftInventory.potion || 0;
  if (potions <= 0) {
    battle.log.push('🧪 Нет зелий!');
    renderBattleUI();
    return;
  }
  craftInventory.potion--;
  const heal = Math.floor(s.maxHp * 0.5);
  battle.myHp = Math.min(battle.myMaxHp, battle.myHp + heal);
  battle.log.push(\`🧪 Зелье: +\${heal} HP\`);
  showDamageNumber(\`+\${heal}\`, '#88ff88', false);
  renderBattleUI();
};`,
    `window.battlePotion = function() {
  if (!battle) return;
  const s = character.stats;
  // Ищем первое доступное зелье HP
  let potionId = null;
  for (const pid of ['hp_great', 'hp_large', 'hp_small', 'potion']) {
    if (craftInventory[pid] > 0) { potionId = pid; break; }
  }
  if (!potionId) {
    battle.log.push('🧪 Нет зелий!');
    renderBattleUI();
    return;
  }
  const p = POTIONS[potionId] || { value: 0.3, name: 'Зелье' };
  const heal = Math.floor(s.maxHp * (p.value || 0.3));
  battle.myHp = Math.min(battle.myMaxHp, battle.myHp + heal);
  battle.log.push(\`🧪 \${p.name}: +\${heal} HP\`);
  craftInventory[potionId]--;
  showDamageNumber(\`+\${heal}\`, '#88ff88', false);
  renderBattleUI();
};`
  );

  content = addMarker(content, 'trade-craft');
  writeFile(MAIN_FILE, content);
  return true;
}