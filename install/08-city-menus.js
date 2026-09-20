// install/08-city-menus.js — Меню зданий в городе
export default async function install({ readFile, writeFile, backup, insertBefore, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'city-menus')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: CITY MENUS (магазин / больница / арена / ремонт / таверна)
// ============================================================

function openBuildingMenu(buildingId) {
  const s = character.stats;
  if (!s) { alert('Статы не загружены'); return; }

  if (buildingId === 'shop') {
    // Магазин: продать ресурсы
    const woodPrice = 2, herbPrice = 3, acornPrice = 15, flowerPrice = 20;
    const woodValue = inventory.wood * woodPrice;
    const herbValue = inventory.herb * herbPrice;
    const acornValue = inventory.acorn * acornPrice;
    const flowerValue = inventory.flower * flowerPrice;
    const totalValue = woodValue + herbValue + acornValue + flowerValue;

    const msg = \`🛒 ТОРГОВЕЦ\\n\\nВаши ресурсы:\\n🪵 Древесина: \${inventory.wood} × \${woodPrice} = \${woodValue}💰\\n🌿 Трава: \${inventory.herb} × \${herbPrice} = \${herbValue}💰\\n🌰 Жёлудь: \${inventory.acorn} × \${acornPrice} = \${acornValue}💰\\n🌸 Цветок: \${inventory.flower} × \${flowerPrice} = \${flowerValue}💰\\n\\nВсего: \${totalValue}💰\\n\\nПродать всё?\`;

    if (totalValue > 0 && confirm(msg)) {
      s.gold += totalValue;
      inventory.wood = 0;
      inventory.herb = 0;
      inventory.acorn = 0;
      inventory.flower = 0;
      updateInventoryHUD();
      updateStatsHUD();
      setNavStatus(\`🛒 Продано за \${totalValue}💰\`, '#88ff88');
      if (socket) socket.emit('inventory', inventory);
    }
  } else if (buildingId === 'hospital') {
    const cost = 5;
    if (s.hp >= s.maxHp) {
      alert('🏥 Больница\\n\\nВы полностью здоровы!');
      return;
    }
    if (s.gold < cost) {
      alert(\`🏥 Больница\\n\\nНе хватает золота.\\nНужно: \${cost}💰\\nУ вас: \${s.gold}💰\`);
      return;
    }
    if (confirm(\`🏥 Больница\\n\\nВосстановить HP за \${cost}💰?\`)) {
      s.gold -= cost;
      s.hp = s.maxHp;
      s.mp = s.maxMp;
      updateStatsHUD();
      setNavStatus('🏥 Здоровье восстановлено', '#88ff88');
    }
  } else if (buildingId === 'arena') {
    alert('⚔️ АРЕНА\\n\\nГрупповые бои скоро!\\n\\nСкоро можно будет сражаться с другими игроками и NPC.');
  } else if (buildingId === 'repair') {
    alert('🔨 РЕМОНТ\\n\\nЗдесь можно будет улучшать снаряжение.\\n\\nФункция в разработке.');
  } else if (buildingId === 'tavern') {
    alert('🍺 ТАВЕРНА\\n\\nОтдых восстанавливает HP/MP.\\n\\nСкоро будет доступно.');
  }
}

`;

  content = insertBefore(content, '// ============================================================\n//  СОКЕТЫ', code, 'city-menus');

  // Заменяем alert в handleCityClick на открытие меню
  content = content.replace(
    `      console.log(\`🖱️ Клик по: \${b.name}\`);
      alert(\`\${b.icon} \${b.name}\\n\\n(меню скоро будет)\`);
      clickedBuilding = true;`,
    `      console.log(\`🖱️ Клик по: \${b.name}\`);
      openBuildingMenu(b.id);
      clickedBuilding = true;`
  );

  content = addMarker(content, 'city-menus');
  writeFile(MAIN_FILE, content);
  return true;
}