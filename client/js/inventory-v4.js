// ============================================================
//  INVENTORY V4 — построчный список с кнопками и описаниями
//  Переопределяет renderInventoryV3 из main.js
// ============================================================

window.addEventListener('load', () => {
  // Ждём пока main.js загрузится
  setTimeout(() => {
    if (typeof renderInventoryV3 !== 'function') {
      console.warn('⚠️ renderInventoryV3 не найден');
      return;
    }
    // Переопределяем
    window.renderInventoryV3 = renderInventoryV3New;
    console.log('🎒 Инвентарь v4 загружен');
  }, 500);
});

function renderInventoryV3New() {
  const panel = document.getElementById('invV3Panel');
  if (!panel) return;
  if (!character || !character.equipment) return;

  const s = character.stats || {};
  const eq = character.equipment;

  // Собираем предметы
  const allItems = [];
  Object.entries(inventory || {}).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: false, cat: 'resource' });
  });
  Object.entries(craftInventory || {}).forEach(([id, count]) => {
    if (count > 0) {
      let cat = 'misc';
      if (typeof POTIONS !== 'undefined' && POTIONS[id]) cat = 'potion';
      else if (typeof FOODS !== 'undefined' && FOODS[id]) cat = 'food';
      else if (typeof WEAPONS !== 'undefined' && WEAPONS[id]) cat = 'weapon';
      else if (typeof ARMORS !== 'undefined' && ARMORS[id]) cat = 'armor';
      else if (typeof ACCESSORIES !== 'undefined' && ACCESSORIES[id]) cat = 'accessory';
      allItems.push({ id, count, isPlant: false, cat });
    }
  });
  Object.entries(plantInventory || {}).forEach(([id, count]) => {
    if (count > 0) allItems.push({ id, count, isPlant: true, cat: 'plant' });
  });

  const filtered = allItems.filter(it => {
    if (invV3Tab === 'all') return true;
    if (invV3Tab === 'plants') return it.cat === 'plant' || ['wood','herb','acorn','flower'].includes(it.id);
    if (invV3Tab === 'potions') return it.cat === 'potion';
    if (invV3Tab === 'weapons') return it.cat === 'weapon' || it.cat === 'armor' || it.cat === 'accessory';
    if (invV3Tab === 'misc') return it.cat === 'misc' || it.cat === 'food';
    return false;
  });

  // Заголовок
  const tabs = [
    { id: 'all',      name: '📦 Всё' },
    { id: 'plants',   name: '🌿 Растения' },
    { id: 'potions',  name: '🧪 Зелья' },
    { id: 'weapons',  name: '⚔️ Экипировка' },
    { id: 'misc',     name: '🎁 Разное' }
  ];
  const tabsHtml = tabs.map(t => 
    `<button data-inv-tab="${t.id}" style="padding:8px 14px;background:${invV3Tab === t.id ? '#4a4aff' : '#1a1a3e'};color:white;border:1px solid #4a4aff;border-radius:6px;cursor:pointer;font-size:12px;">${t.name}</button>`
  ).join('');

  // Левая панель
  const leftPanel = `
    <div style="width:280px;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:15px;">
      <div style="text-align:center;">
        <div style="font-size:120px;line-height:1;">🧙</div>
        <div style="font-size:18px;color:#ffd700;font-weight:bold;margin-top:8px;">${character.name}</div>
        <div style="font-size:14px;color:#aaa;">${character.class} • Ур. ${s.level}</div>
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;">
        <div style="font-size:12px;color:#ccc;margin-bottom:4px;">❤️ HP: ${s.hp}/${s.maxHp}</div>
        <div style="height:14px;background:#300;border:1px solid #000;border-radius:7px;overflow:hidden;margin-bottom:8px;">
          <div style="height:100%;width:${(s.hp/s.maxHp*100)}%;background:linear-gradient(90deg,#c0392b,#e74c3c);"></div>
        </div>
        <div style="font-size:12px;color:#ccc;margin-bottom:4px;">🔵 MP: ${s.mp}/${s.maxMp}</div>
        <div style="height:14px;background:#003;border:1px solid #000;border-radius:7px;overflow:hidden;">
          <div style="height:100%;width:${(s.mp/s.maxMp*100)}%;background:linear-gradient(90deg,#2980b9,#3498db);"></div>
        </div>
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;font-size:13px;">
        💰 <span style="color:#ffd700;font-weight:bold;">${s.gold}</span> золота
      </div>
      <div style="border-top:1px solid #333;padding-top:12px;font-size:13px;">
        <div style="font-weight:bold;color:#ffd700;margin-bottom:6px;">📊 Статы</div>
        <div>💪 STR: <b>${s.str}</b></div>
        <div>🏃 AGI: <b>${s.agi}</b></div>
        <div>🧠 INT: <b>${s.int}</b></div>
        <div>🛡️ VIT: <b>${s.vit}</b></div>
        <div>🍀 LUCK: <b>${s.luck}</b></div>
      </div>
    </div>
  `;

  // Экипировка
  const renderEquipSlot = (slot) => {
    const itemId = eq[slot.id];
    const item = itemId ? ((typeof WEAPONS !== 'undefined' && WEAPONS[itemId]) || (typeof ARMORS !== 'undefined' && ARMORS[itemId]) || (typeof ACCESSORIES !== 'undefined' && ACCESSORIES[itemId])) : null;
    const filled = !!item;
    return `<div title="${slot.name}" data-inv-unequip="${slot.id}" style="width:60px;height:60px;background:${filled ? '#2a4a6a' : '#1a1a3e'};border:2px solid ${filled ? '#ffd700' : '#4a4aff'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;">
      ${filled ? item.icon : `<span style="opacity:0.3;font-size:24px;">${slot.icon}</span>`}
    </div>`;
  };

  const leftCol = EQUIP_SLOTS.filter(sl => sl.col === 0).map(renderEquipSlot).join('');
  const centerCol = EQUIP_SLOTS.filter(sl => sl.col === 1).map(renderEquipSlot).join('');
  const rightCol = EQUIP_SLOTS.filter(sl => sl.col === 2).map(renderEquipSlot).join('');
  const bottomRow = EQUIP_SLOTS.filter(sl => sl.col === 'bottom').map(renderEquipSlot).join('');

  const centerPanel = `
    <div style="width:260px;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;">
      <div style="font-weight:bold;color:#ffd700;font-size:15px;text-align:center;margin-bottom:10px;">⚔️ Экипировка</div>
      <div style="display:flex;gap:15px;justify-content:center;">
        <div style="display:flex;flex-direction:column;gap:8px;">${leftCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">${centerCol}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">${rightCol}</div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">${bottomRow}</div>
    </div>
  `;

  // Список предметов
  let itemsHtml = '';
  if (filtered.length === 0) {
    itemsHtml = `<div style="color:#666;text-align:center;padding:40px;">Пусто</div>`;
  } else {
    filtered.forEach(it => {
      const info = getItemInfoV4(it, eq, s);
      const borderColor = info.rarity === 'legendary' ? '#ffd700'
                        : info.rarity === 'epic' ? '#a855f7'
                        : info.rarity === 'rare' ? '#4a8aff'
                        : '#4a4aff';
      
      let buttons = [];
      if (info.canEquip && !info.isEquipped) {
        buttons.push(`<button data-inv-equip="${it.id}" style="padding:6px 12px;background:#2a6a2a;color:white;border:1px solid #88ff88;border-radius:4px;cursor:pointer;font-size:11px;">🎽 Одеть</button>`);
      }
      if (info.isEquipped) {
        buttons.push(`<button data-inv-unequip-item="${info.slot}" style="padding:6px 12px;background:#6a2a2a;color:white;border:1px solid #ff8888;border-radius:4px;cursor:pointer;font-size:11px;">❌ Снять</button>`);
      }
      if (info.canUse) {
        buttons.push(`<button data-inv-use="${it.id}" data-inv-source="${it.isPlant ? 'plant' : 'craft'}" style="padding:6px 12px;background:#4a4aff;color:white;border:1px solid #88aaff;border-radius:4px;cursor:pointer;font-size:11px;">⚡ Использовать</button>`);
      }
      if (info.canSell && !info.isEquipped) {
        buttons.push(`<button data-inv-sell="${it.id}" data-inv-source="${it.isPlant ? 'plant' : 'craft'}" data-inv-price="${info.price}" style="padding:6px 12px;background:#8a6a00;color:white;border:1px solid #ffd700;border-radius:4px;cursor:pointer;font-size:11px;">💰 Продать (${info.price})</button>`);
      }
      buttons.push(`<button data-inv-give="${it.id}" style="padding:6px 12px;background:#444;color:white;border:1px solid #888;border-radius:4px;cursor:pointer;font-size:11px;">🎁 Передать</button>`);

      itemsHtml += `
        <div style="background:#1a1a3e;border:2px solid ${borderColor};border-radius:8px;padding:12px;margin-bottom:8px;display:flex;gap:15px;align-items:center;">
          <div style="font-size:42px;min-width:55px;text-align:center;">${info.icon}</div>
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:bold;color:${borderColor};margin-bottom:4px;">
              ${info.name} ${it.count > 1 ? `<span style="color:#ffd700;">×${it.count}</span>` : ''}
              ${info.isEquipped ? '<span style="color:#88ff88;font-size:11px;"> [НАДЕТО]</span>' : ''}
            </div>
            <div style="font-size:11px;color:#aaa;white-space:pre-line;line-height:1.5;">${info.desc}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;min-width:140px;">
            ${buttons.join('')}
          </div>
        </div>
      `;
    });
  }

  const rightPanel = `
    <div style="flex:1;background:rgba(20,15,35,0.9);border:2px solid #4a4aff;border-radius:12px;padding:15px;display:flex;flex-direction:column;">
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">${tabsHtml}</div>
      <div style="flex:1;overflow-y:auto;padding-right:5px;">${itemsHtml}</div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid #333;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:12px;color:#888;">Предметов: ${filtered.length}</div>
        <button data-inv-close style="padding:10px 20px;background:#444;color:white;font-size:13px;border:1px solid #888;border-radius:6px;cursor:pointer;">Закрыть</button>
      </div>
    </div>
  `;

  panel.innerHTML = leftPanel + centerPanel + rightPanel;

  // Навешиваем обработчики
  panel.querySelectorAll('[data-inv-tab]').forEach(b => {
    b.onclick = () => { invV3Tab = b.dataset.invTab; renderInventoryV3New(); };
  });
  panel.querySelectorAll('[data-inv-close]').forEach(b => b.onclick = () => window.toggleInventoryV3());
  panel.querySelectorAll('[data-inv-equip]').forEach(b => {
    b.onclick = () => equipItemV4(b.dataset.invEquip);
  });
  panel.querySelectorAll('[data-inv-unequip], [data-inv-unequip-item]').forEach(b => {
    b.onclick = () => unequipItemV4(b.dataset.invUnequip || b.dataset.invUnequipItem);
  });
  panel.querySelectorAll('[data-inv-use]').forEach(b => {
    b.onclick = () => useItemV4(b.dataset.invUse, b.dataset.invSource);
  });
  panel.querySelectorAll('[data-inv-sell]').forEach(b => {
    b.onclick = () => sellItemV4(b.dataset.invSell, b.dataset.invSource, parseInt(b.dataset.invPrice));
  });
  panel.querySelectorAll('[data-inv-give]').forEach(b => {
    b.onclick = () => setNavStatus('🎁 Передать — скоро (нужен чат)', '#ffaa44');
  });
}

function getItemInfoV4(it, eq, s) {
  const id = it.id;
  
  // Растения
  if (it.isPlant && typeof PLANTS !== 'undefined' && PLANTS[id]) {
    const p = PLANTS[id];
    return {
      name: p.name, icon: p.icon, rarity: p.rarity, price: p.price,
      desc: `${p.rarity === 'legendary' ? '🌟 Легендарное' : p.rarity === 'epic' ? '💜 Эпическое' : p.rarity === 'rare' ? '🔵 Редкое' : '🟢 Обычное'} растение\nЦена: ${p.price}💰`,
      canEquip: false, canUse: false, canSell: true
    };
  }
  
  // Ресурсы
  const resInfo = { wood: ['Древесина','🪵',2], herb: ['Трава','🌿',3], acorn: ['Жёлудь','🌰',15], flower: ['Цветок','🌸',20] };
  if (resInfo[id]) {
    const [name, icon, price] = resInfo[id];
    return { name, icon, rarity: 'common', price, desc: `🟢 Ресурс\nЦена: ${price}💰`, canEquip: false, canUse: false, canSell: true };
  }
  
  // Зелья
  if (typeof POTIONS !== 'undefined' && POTIONS[id]) {
    const p = POTIONS[id];
    const eff = p.type === 'hp' ? `+${Math.round(p.value*100)}% HP` : p.type === 'mp' ? `+${Math.round(p.value*100)}% MP` : `+${p.value} к статам`;
    return { name: p.name, icon: p.icon, rarity: 'common', price: p.price, desc: `🧪 Зелье\nЭффект: ${eff}\nУр. ${p.level}+`, canEquip: false, canUse: true, canSell: true };
  }
  
  // Еда
  if (typeof FOODS !== 'undefined' && FOODS[id]) {
    const f = FOODS[id];
    return { name: f.name, icon: f.icon, rarity: 'common', price: f.price, desc: `🍞 Еда\n+${f.hp} HP${f.mp ? ' +' + f.mp + ' MP' : ''}\nУр. ${f.level}+`, canEquip: false, canUse: true, canSell: true };
  }
  
  // Оружие
  if (typeof WEAPONS !== 'undefined' && WEAPONS[id]) {
    const w = WEAPONS[id];
    const isEq = eq.weapon === id;
    let stats = `⚔️ Урон: +${w.damage}`;
    if (w.speed) stats += `\n💨 Скорость: ${w.speed > 0 ? '+' : ''}${w.speed}%`;
    if (w.crit) stats += `\n💥 Крит: +${w.crit}%`;
    if (w.reqStr) stats += `\n💪 Нужен STR ${w.reqStr}`;
    if (w.reqAgi) stats += `\n🏃 Нужен AGI ${w.reqAgi}`;
    if (w.reqInt) stats += `\n🧠 Нужен INT ${w.reqInt}`;
    if (w.reqLuck) stats += `\n🍀 Нужен LUCK ${w.reqLuck}`;
    const canUse = s.level >= w.level && (!w.reqStr || s.str >= w.reqStr) && (!w.reqAgi || s.agi >= w.reqAgi) && (!w.reqInt || s.int >= w.reqInt) && (!w.reqLuck || s.luck >= w.reqLuck);
    return {
      name: w.name, icon: w.icon, rarity: w.rarity, price: w.price,
      desc: `⚔️ Оружие\n${stats}\nУр. ${w.level}+`,
      canEquip: canUse, isEquipped: isEq, slot: 'weapon', canUse: false, canSell: !isEq
    };
  }
  
  // Броня
  if (typeof ARMORS !== 'undefined' && ARMORS[id]) {
    const a = ARMORS[id];
    const isEq = eq[a.slot] === id;
    let stats = `🛡️ Защита: +${a.armor}`;
    if (a.hp) stats += `\n❤️ HP: +${a.hp}`;
    if (a.speed) stats += `\n💨 Скорость: +${a.speed}%`;
    const canUse = s.level >= a.level;
    return {
      name: a.name, icon: a.icon, rarity: a.rarity, price: a.price,
      desc: `🛡️ Броня\n${stats}\nУр. ${a.level}+`,
      canEquip: canUse, isEquipped: isEq, slot: a.slot, canUse: false, canSell: !isEq
    };
  }
  
  // Аксессуары
  if (typeof ACCESSORIES !== 'undefined' && ACCESSORIES[id]) {
    const acc = ACCESSORIES[id];
    const isEq = eq[acc.slot] === id;
    let stats = [];
    if (acc.str) stats.push(`💪 STR +${acc.str}`);
    if (acc.agi) stats.push(`🏃 AGI +${acc.agi}`);
    if (acc.int) stats.push(`🧠 INT +${acc.int}`);
    if (acc.hp) stats.push(`❤️ HP +${acc.hp}`);
    if (acc.mp) stats.push(`🔵 MP +${acc.mp}`);
    if (acc.crit) stats.push(`💥 Крит +${acc.crit}%`);
    if (acc.luck) stats.push(`🍀 LUCK +${acc.luck}`);
    const canUse = s.level >= acc.level;
    return {
      name: acc.name, icon: acc.icon, rarity: acc.rarity, price: acc.price,
      desc: `💍 Аксессуар\n${stats.join('\n')}\nУр. ${acc.level}+`,
      canEquip: canUse, isEquipped: isEq, slot: acc.slot, canUse: false, canSell: !isEq
    };
  }
  
  return { name: id, icon: '❓', rarity: 'common', price: 1, desc: 'Неизвестный предмет', canEquip: false, canUse: false, canSell: true };
}

function equipItemV4(itemId) {
  if (!character || !character.equipment) return;
  const s = character.stats;
  const item = (typeof WEAPONS !== 'undefined' && WEAPONS[itemId]) || (typeof ARMORS !== 'undefined' && ARMORS[itemId]) || (typeof ACCESSORIES !== 'undefined' && ACCESSORIES[itemId]);
  if (!item) return;
  const slot = item.slot;
  
  if (item.reqStr && s.str < item.reqStr) { setNavStatus('❌ Нужен STR ' + item.reqStr, '#ff6666'); return; }
  if (item.reqAgi && s.agi < item.reqAgi) { setNavStatus('❌ Нужен AGI ' + item.reqAgi, '#ff6666'); return; }
  if (item.reqInt && s.int < item.reqInt) { setNavStatus('❌ Нужен INT ' + item.reqInt, '#ff6666'); return; }
  if (item.reqLuck && s.luck < item.reqLuck) { setNavStatus('❌ Нужен LUCK ' + item.reqLuck, '#ff6666'); return; }
  if (s.level < item.level) { setNavStatus('❌ Нужен ур. ' + item.level, '#ff6666'); return; }
  
  const old = character.equipment[slot];
  if (old) craftInventory[old] = (craftInventory[old] || 0) + 1;
  
  character.equipment[slot] = itemId;
  craftInventory[itemId] = (craftInventory[itemId] || 1) - 1;
  if (craftInventory[itemId] <= 0) delete craftInventory[itemId];
  
  setNavStatus(`🎽 Надето: ${item.name}`, '#88ff88');
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderInventoryV3New();
}

function unequipItemV4(slot) {
  if (!character || !character.equipment) return;
  const itemId = character.equipment[slot];
  if (!itemId) return;
  character.equipment[slot] = null;
  craftInventory[itemId] = (craftInventory[itemId] || 0) + 1;
  const item = (typeof WEAPONS !== 'undefined' && WEAPONS[itemId]) || (typeof ARMORS !== 'undefined' && ARMORS[itemId]) || (typeof ACCESSORIES !== 'undefined' && ACCESSORIES[itemId]);
  setNavStatus(`❌ Снято: ${item ? item.name : itemId}`, '#ffaa44');
  if (typeof recalcMaxHP === 'function') recalcMaxHP();
  if (typeof updateStatsHUD === 'function') updateStatsHUD();
  renderInventoryV3New();
}

function useItemV4(itemId, source) {
  if (typeof POTIONS !== 'undefined' && POTIONS[itemId]) {
    if (source === 'craft' && craftInventory[itemId] > 0) {
      if (typeof usePotion === 'function') usePotion(itemId);
      renderInventoryV3New();
    }
    return;
  }
  if (typeof FOODS !== 'undefined' && FOODS[itemId]) {
    if (source === 'craft' && craftInventory[itemId] > 0) {
      const f = FOODS[itemId];
      const s = character.stats;
      s.hp = Math.min(s.maxHp, s.hp + f.hp);
      s.mp = Math.min(s.maxMp, s.mp + f.mp);
      craftInventory[itemId]--;
      if (craftInventory[itemId] <= 0) delete craftInventory[itemId];
      setNavStatus(`🍞 ${f.name}: +${f.hp} HP`, '#88ff88');
      updateStatsHUD();
      renderInventoryV3New();
    }
  }
}

function sellItemV4(itemId, source, price) {
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
  setNavStatus(`💰 Продано ${count}× за ${total}`, '#88ff88');
  updateStatsHUD();
  updateInventoryHUD();
  renderInventoryV3New();
}