// install/33-inventory-v4.js — Инвентарь v4 с действиями и описаниями
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'inventory-v4')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // Полностью перезаписываем renderInventoryV3
  const newRender = `
function renderInventoryV3() {
  const panel = document.getElementById('invV3Panel');
  if (!panel) return;
  if (!character || !character.equipment) return;

  const s = character.stats || { hp: 0, maxHp: 100, mp: 0, maxMp: 100, level: 1, gold: 0, str: 5, agi: 5, int: 5, vit: 5, luck: 5 };
  const eq = character.equipment;

  // Собираем все предметы
  const allItems = [];
  Object.entries(inventory).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: false, cat: 'resource' });
  });
  Object.entries(craftInventory).forEach(([id, count]) => {
    if (count > 0) {
      let cat = 'misc';
      if (POTIONS[id]) cat = 'potion';
      else if (FOODS[id]) cat = 'food';
      else if (WEAPONS[id]) cat = 'weapon';
      else if (ARMORS[id]) cat = 'armor';
      else if (ACCESSORIES[id]) cat = 'accessory';
      allItems.push({ id, count, isPlant: false, cat });
    }
  });
  Object.entries(plantInventory).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: true, cat: 'plant' });
  });

  // Фильтр по вкладке
  const filtered = allItems.filter(it => {
    if (invV3Tab === 'all') return true;
    if (invV3Tab === 'plants') return it.cat === 'plant' || ['wood','herb','acorn','flower'].includes(it.id);
    if (invV3Tab === 'potions') return it.cat === 'potion';
    if (invV3Tab === 'weapons') return it.cat === 'weapon' || it.cat === 'armor' || it.cat === 'accessory';
    if (invV3Tab === 'misc') return it.cat === 'misc' || it.cat === 'food' || ['planks','meal','torch'].includes(it.id);
    return false;
  });

  // Информация о предмете
  function getItemInfo(it) {
    const id = it.id;
    // Растения
    if (it.isPlant && PLANTS[id]) {
      const p = PLANTS[id];
      return {
        name: p.name, icon: p.icon, rarity: p.rarity, price: p.price,
        desc: \`\${p.rarity === 'legendary' ? '🌟 Легендарное' : p.rarity === 'epic' ? '💜 Эпическое' : p.rarity === 'rare' ? '🔵 Редкое' : '🟢 Обычное'} растение\\nЦена: \${p.price}💰\`,
        canEquip: false, canUse: false, canSell: true
      };
    }
    // Ресурсы
    const resInfo = { wood: ['Древесина','🪵',2], herb: ['Трава','🌿',3], acorn: ['Жёлудь','🌰',15], flower: ['Цветок','🌸',20] };
    if (resInfo[id]) {
      const [name, icon, price] = resInfo[id];
      return { name, icon, rarity: 'common', price, desc: \`🟢 Ресурс\\nЦена: \${price}💰\`, canEquip: false, canUse: false, canSell: true };
    }
    // Зелья
    if (POTIONS[id]) {
      const p = POTIONS[id];
      const eff = p.type === 'hp' ? \`+\${Math.round(p.value * 100)}% HP\` : p.type === 'mp' ? \`+\${Math.round(p.value * 100)}% MP\` : p.type.startsWith('buff') ? \`+\${p.value} к статам\` : 'эффект';
      return { name: p.name, icon: p.icon, rarity: 'common', price: p.price, desc: \`🧪 Зелье\\nЭффект: \${eff}\\nУр. \${p.level}+\`, canEquip: false, canUse: true, canSell: true };
    }
    // Еда
    if (FOODS[id]) {
      const f = FOODS[id];
      return { name: f.name, icon: f.icon, rarity: 'common', price: f.price, desc: \`🍞 Еда\\n+ \${f.hp} HP \${f.mp ? '+ ' + f.mp + ' MP' : ''}\\nУр. \${f.level}+\`, canEquip: false, canUse: true, canSell: true };
    }
    // Оружие
    if (WEAPONS[id]) {
      const w = WEAPONS[id];
      const isEquipped = eq.weapon === id;
      let stats = \`⚔️ Урон: +\${w.damage}\`;
      if (w.speed) stats += \`\\n💨 Скорость: \${w.speed > 0 ? '+' : ''}\${w.speed}%\`;
      if (w.crit) stats += \`\\n💥 Крит: +\${w.crit}%\`;
      if (w.slots) stats += \`\\n🔧 Слотов: \${w.slots}\`;
      if (w.reqStr) stats += \`\\n💪 Требует STR \${w.reqStr}\`;
      if (w.reqAgi) stats += \`\\n🏃 Требует AGI \${w.reqAgi}\`;
      if (w.reqInt) stats += \`\\n🧠 Требует INT \${w.reqInt}\`;
      if (w.reqLuck) stats += \`\\n🍀 Требует LUCK \${w.reqLuck}\`;
      const canUse = s.level >= w.level && (!w.reqStr || s.str >= w.reqStr) && (!w.reqAgi || s.agi >= w.reqAgi) && (!w.reqInt || s.int >= w.reqInt) && (!w.reqLuck || s.luck >= w.reqLuck);
      return {
        name: w.name, icon: w.icon, rarity: w.rarity || 'common', price: w.price,
        desc: \`\${w.rarity === 'legendary' ? '🌟 Легендарное' : w.rarity === 'epic' ? '💜 Эпическое' : '🔵 Редкое' : '🟢 Обычное'}\\n\${stats}\\nУр. \${w.level}+\`,
        canEquip: canUse, isEquipped, slot: 'weapon', canUse: false, canSell: !isEquipped
      };
    }
    // Броня
    if (ARMORS[id]) {
      const a = ARMORS[id];
      const isEquipped = eq[a.slot] === id;
      let stats = \`🛡️ Защита: +\${a.armor}\`;
      if (a.hp) stats += \`\\n❤️ HP: +\${a.hp}\`;
      if (a.speed) stats += \`\\n💨 Скорость: +\${a.speed}%\`;
      const canUse = s.level >= a.level;
      return {
        name: a.name, icon: a.icon, rarity: a.rarity || 'common', price: a.price,
        desc: \`\${a.rarity === 'legendary' ? '🌟 Легендарное' : a.rarity === 'epic' ? '💜 Эпическое' : a.rarity === 'rare' ? '🔵 Редкое' : '🟢 Обычное'}\\n\${stats}\\nУр. \${a.level}+\`,
        canEquip: canUse, isEquipped, slot: a.slot, canUse: false, canSell: !isEquipped
      };
    }
    // Аксессуары
    if (ACCESSORIES[id]) {
      const acc = ACCESSORIES[id];
      const isEquipped = eq[acc.slot] === id;
      let stats = [];
      if (acc.str) stats.push(\`💪 STR +\${acc.str}\`);
      if (acc.agi) stats.push(\`🏃 AGI +\${acc.agi}\`);
      if (acc.int) stats.push(\`🧠 INT +\${acc.int}\`);
      if (acc.hp) stats.push(\`❤️ HP +\${acc.hp}\`);
      if (acc.mp) stats.push(\`🔵 MP +\${acc.mp}\`);
      if (acc.crit) stats.push(\`💥 Крит +\${acc.crit}%\`);
      if (acc.luck) stats.push(\`🍀 LUCK +\${acc.luck}\`);
      const canUse = s.level >= acc.level;
      return {
        name: acc.name, icon: acc.icon, rarity: acc.rarity || 'common', price: acc.price,
        desc: \`\${acc.rarity === 'legendary' ? '🌟 Легендарное' : acc.rarity === 'epic' ? '💜 Эпическое' : acc.rarity === 'rare' ? '🔵 Редкое' : '🟢 Обычное'}\\n\${stats.join('\\n')}\\nУр. \${acc.level}+\`,
        canEquip: canUse, isEquipped, slot: acc.slot, canUse: false, canSell: !isEquipped
      };
    }
    // Прочее
    const misc = { planks: ['Доски','🪵',5], meal: ['Мука','🌰',10], torch: ['Факел','🔥',15], potion: ['Зелье HP','🧪',25] };
    if (misc[id]) {
      const [name, icon, price] = misc[id];
      return { name, icon, rarity: 'common', price, desc: \`🎁 Предмет\\nЦена: \${price}💰\`, canEquip: false, canUse: false, canSell: true };
    }
    return { name: id, icon: '❓', rarity: 'common', price: 1, desc: 'Неизвестный предмет', canEquip: false, canUse: false, canSell: true };
  }

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

  // Слоты экипировки
  const renderEquipSlot = (slot) => {
    const itemId = eq[slot.id];
    const item = itemId ? (WEAPONS[itemId] || ARMORS[itemId] || ACCESSORIES[itemId]) : null;
    const filled = !!item;
    return \`
      <div title="\${slot.name}" style="width:60px;height:60px;background:\${filled ? '#2a4a6a' : '#1a1a3e'};border:2px solid \${filled ? '#ffd700' : '#4a4aff'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;" onclick="\${filled ? \`window.unequipItem('\${slot.id}')\` : ''}">
        \${filled ? item.icon : \`<span style="opacity:0.3;font-size:24px;">\${slot.icon}</span>\`}
      </div>
    \`;
  };

  const leftCol = EQUIP_SLOTS.filter(sl => sl.col === 0).map(renderEquipSlot).join('');
  const centerCol = EQUIP_SLOTS.filter(sl => sl.col === 1).map(renderEquipSlot).join('');
  const rightCol = EQUIP_SLOTS.filter(sl => sl.col === 2).map(renderEquipSlot).join('');
  const bottomRow = EQUIP_SLOTS.filter(sl => sl.col === 'bottom').map(renderEquipSlot).join('');

  const centerPanel = \`
    <div style="width:260px;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;display:flex;flex-direction:column;gap:10px;align-items:center;">
      <div style="font-weight:bold;color:#ffd700;font-size:15px;">⚔️ Экипировка</div>
      <div style="display:flex;gap:15px;justify-content:center;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;gap:8px;">\${leftCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">\${centerCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">\${rightCol}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:5px;">\${bottomRow}</div>
      <div style="font-size:11px;color:#888;margin-top:8px;">Клик по слоту — снять</div>
    </div>
  \`;

  // Вкладки
  const tabs = [
    { id: 'all',      name: '📦 Всё' },
    { id: 'plants',   name: '🌿 Растения' },
    { id: 'potions',  name: '🧪 Зелья' },
    { id: 'weapons',  name: '⚔️ Экипировка' },
    { id: 'misc',     name: '🎁 Разное' }
  ];
  const tabsHtml = tabs.map(t => 
    \`<button onclick="window.setInvV3Tab('\${t.id}')" style="padding:8px 14px;background:\${invV3Tab === t.id ? '#4a4aff' : '#1a1a3e'};color:white;border:1px solid #4a4aff;border-radius:6px;cursor:pointer;font-size:12px;">\${t.name}</button>\`
  ).join('');

  // Список предметов построчно
  let itemsHtml = '';
  if (filtered.length === 0) {
    itemsHtml = \`<div style="color:#666;text-align:center;padding:40px;">Пусто</div>\`;
  } else {
    filtered.forEach(it => {
      const info = getItemInfo(it);
      const borderColor = info.rarity === 'legendary' ? '#ffd700'
                        : info.rarity === 'epic' ? '#a855f7'
                        : info.rarity === 'rare' ? '#4a8aff'
                        : '#4a4aff';
      
      // Кнопки действий
      let buttons = [];
      if (info.canEquip && !info.isEquipped) {
        buttons.push(\`<button onclick="window.equipItem('\${it.id}')" style="padding:5px 12px;background:#2a6a2a;color:white;border:1px solid #88ff88;border-radius:4px;cursor:pointer;font-size:11px;">🎽 Одеть</button>\`);
      }
      if (info.isEquipped) {
        buttons.push(\`<button onclick="window.unequipItem('\${info.slot}')" style="padding:5px 12px;background:#6a2a2a;color:white;border:1px solid #ff8888;border-radius:4px;cursor:pointer;font-size:11px;">❌ Снять</button>\`);
      }
      if (info.canUse) {
        buttons.push(\`<button onclick="window.useItem('\${it.id}', '\${it.isPlant ? 'plant' : 'craft'}')" style="padding:5px 12px;background:#4a4aff;color:white;border:1px solid #88aaff;border-radius:4px;cursor:pointer;font-size:11px;">⚡ Использовать</button>\`);
      }
      if (info.canSell && !info.isEquipped) {
        buttons.push(\`<button onclick="window.sellItemFromInv('\${it.id}', '\${it.isPlant ? 'plant' : 'craft'}', \${info.price})" style="padding:5px 12px;background:#8a6a00;color:white;border:1px solid #ffd700;border-radius:4px;cursor:pointer;font-size:11px;">💰 Продать (\${info.price})\` + \`</button>\`);
      }
      // Передать — всегда
      buttons.push(\`<button onclick="window.giveItem('\${it.id}')" style="padding:5px 12px;background:#444;color:white;border:1px solid #888;border-radius:4px;cursor:pointer;font-size:11px;">🎁 Передать</button>\`);

      itemsHtml += \`
        <div style="background:#1a1a3e;border:2px solid \${borderColor};border-radius:8px;padding:12px;margin-bottom:8px;display:flex;gap:15px;align-items:center;">
          <div style="font-size:42px;min-width:55px;text-align:center;">\${info.icon}</div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:bold;color:\${borderColor};margin-bottom:4px;">
              \${info.name} 
              \${it.count > 1 ? \`<span style="color:#ffd700;">×\${it.count}</span>\` : ''}
              \${info.isEquipped ? '<span style="color:#88ff88;font-size:11px;"> [НАДЕТО]</span>' : ''}
            </div>
            <div style="font-size:11px;color:#aaa;white-space:pre-line;line-height:1.5;">\${info.desc}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;min-width:140px;">
            \${buttons.join('')}
          </div>
        </div>
      \`;
    });
  }

  const rightPanel = \`
    <div style="flex:1;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;display:flex;flex-direction:column;">
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">\${tabsHtml}</div>
      <div style="flex:1;overflow-y:auto;padding-right:5px;">
        \${itemsHtml}
      </div>
      <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #333;">
        <div style="font-size:12px;color:#888;">Предметов: \${filtered.length}</div>
        <button onclick="window.toggleInventoryV3()" style="padding:10px 20px;background:#444;color:white;font-size:13px;border:1px solid #888;border-radius:6px;cursor:pointer;">Закрыть</button>
      </div>
    </div>
  \`;

  panel.innerHTML = leftPanel + centerPanel + rightPanel;
}

// ============================================================
//  ДЕЙСТВИЯ С ПРЕДМЕТАМИ
// ============================================================

window.equipItem = function(itemId) {
  if (!character || !character.equipment) return;
  const s = character.stats;
  const item = WEAPONS[itemId] || ARMORS[itemId] || ACCESSORIES[itemId];
  if (!item) return;
  const slot = item.slot;
  
  // Проверка требований
  if (item.reqStr && s.str < item.reqStr) { setNavStatus('❌ Нужен STR ' + item.reqStr, '#ff6666'); return; }
  if (item.reqAgi && s.agi < item.reqAgi) { setNavStatus('❌ Нужен AGI ' + item.reqAgi, '#ff6666'); return; }
  if (item.reqInt && s.int < item.reqInt) { setNavStatus('❌ Нужен INT ' + item.reqInt, '#ff6666'); return; }
  if (item.reqLuck && s.luck < item.reqLuck) { setNavStatus('❌ Нужен LUCK ' + item.reqLuck, '#ff6666'); return; }
  if (s.level < item.level) { setNavStatus('❌ Нужен ур. ' + item.level, '#ff6666'); return; }

  // Снимаем старое
  const old = character.equipment[slot];
  if (old) {
    craftInventory[old] = (craftInventory[old] || 0) + 1;
  }
  
  // Надеваем
  character.equipment[slot] = itemId;
  craftInventory[itemId] = (craftInventory[itemId] || 1) - 1;
  if (craftInventory[itemId] <= 0) delete craftInventory[itemId];
  
  setNavStatus(\`🎽 Надето: \${item.name}\`, '#88ff88');
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderInventoryV3();
};

window.unequipItem = function(slot) {
  if (!character || !character.equipment) return;
  const itemId = character.equipment[slot];
  if (!itemId) return;
  character.equipment[slot] = null;
  craftInventory[itemId] = (craftInventory[itemId] || 0) + 1;
  const item = WEAPONS[itemId] || ARMORS[itemId] || ACCESSORIES[itemId];
  setNavStatus(\`❌ Снято: \${item ? item.name : itemId}\`, '#ffaa44');
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderInventoryV3();
};

window.useItem = function(itemId, source) {
  // Зелья
  if (POTIONS[itemId]) {
    if (source === 'craft' && craftInventory[itemId] > 0) {
      const ok = usePotion(itemId);
      if (ok) renderInventoryV3();
    }
    return;
  }
  // Еда
  if (FOODS[itemId]) {
    if (source === 'craft' && craftInventory[itemId] > 0) {
      const f = FOODS[itemId];
      const s = character.stats;
      s.hp = Math.min(s.maxHp, s.hp + f.hp);
      s.mp = Math.min(s.maxMp, s.mp + f.mp);
      craftInventory[itemId]--;
      if (craftInventory[itemId] <= 0) delete craftInventory[itemId];
      setNavStatus(\`🍞 \${f.name}: +\${f.hp} HP\`, '#88ff88');
      updateStatsHUD();
      renderInventoryV3();
    }
  }
};

window.sellItemFromInv = function(itemId, source, price) {
  const s = character.stats;
  let count = 0;
  if (source === 'plant' && plantInventory[itemId]) {
    count = plantInventory[itemId];
    delete plantInventory[itemId];
  } else if (source === 'craft' && craftInventory[itemId]) {
    count = craftInventory[itemId];
    delete craftInventory[itemId];
  } else if (inventory[itemId]) {
    count = inventory[itemId];
    inventory[itemId] = 0;
  }
  const total = count * price;
  s.gold += total;
  setNavStatus(\`💰 Продано \${count}× за \${total}\`, '#88ff88');
  updateStatsHUD();
  updateInventoryHUD();
  renderInventoryV3();
};

window.giveItem = function(itemId) {
  setNavStatus('🎁 Передать — скоро (нужен чат)', '#ffaa44');
};
`;

  // Заменяем старую renderInventoryV3
  content = content.replace(
    /function renderInventoryV3\(\) \{[\s\S]*?\n\}\n\nwindow\.toggleInventoryV3/,
    newRender + '\nwindow.toggleInventoryV3'
  );

  content = addMarker(content, 'inventory-v4');
  writeFile(MAIN_FILE, content);
  return true;
}