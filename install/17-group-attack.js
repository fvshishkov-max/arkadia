// install/17-group-attack.js — Групповое нападение + статичные мобы + крупные клетки
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'group-attack')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. КЛЕТКИ КРУПНЕЕ (32 → 48)
  // ============================================================
  content = content.replace(
    'const TILE_SIZE = 32;',
    'const TILE_SIZE = 48;'
  );

  // ============================================================
  // 2. МОБЫ НЕ ДВИГАЮТСЯ (убираем updateMonsters)
  // ============================================================
  content = content.replace(
    '  updateMonsters(dt);\n  updateHUDs();',
    '  updateHUDs();'
  );

  // Отключаем вызов, но не удаляем код (вдруг пригодится)
  content = content.replace(
    'function updateMonsters(dt) {',
    'function updateMonstersDisabled(dt) {'
  );

  // ============================================================
  // 3. ГРУППОВОЕ НАПАДЕНИЕ
  // ============================================================
  content = content.replace(
    `function startBattle(monster) {
  const me = players.get(myId) || character;
  if (!me || !monster || !monster.alive) return;
  if (battle) return;

  const s = character.stats;
  battle = {
    monster,
    myHp: s.hp,
    myMaxHp: s.maxHp,
    monsterHp: monster.hp,
    monsterMaxHp: monster.maxHp,
    log: [\`⚔️ Бой начался: \${monster.name} (ур. \${monster.level})\`],
    turn: 'player',
    auto: false,
    lastAutoTime: 0,
    lastPlayerAttack: 0,
    lastMonsterAttack: 0
  };

  me.path = null;
  autoFight = false;

  renderBattlePage();
  console.log(\`⚔️ Бой с \${monster.name}\`);
}`,
    `// Количество мобов по уровню игрока
function getMonsterCount() {
  const s = character.stats;
  const lvl = s ? s.level : 1;
  return Math.min(10, 1 + Math.floor((lvl - 1) / 3));
}

function startBattle(monster) {
  const me = players.get(myId) || character;
  if (!me || !monster || !monster.alive) return;
  if (battle) return;

  const s = character.stats;
  const count = getMonsterCount();

  // Собираем группу: текущий моб + ближайшие того же типа
  const group = [monster];
  const candidates = monsters
    .filter(m => m.alive && m !== monster && m.type === monster.type)
    .map(m => ({ m, d: Math.hypot(m.x - monster.x, m.y - monster.y) }))
    .sort((a, b) => a.d - b.d);
  for (const c of candidates) {
    if (group.length >= count) break;
    if (c.d < TILE_SIZE * 8) group.push(c.m); // в радиусе 8 клеток
  }

  // Итоговые статы группы — суммируем HP и атаку
  const totalHp = group.reduce((sum, m) => sum + m.maxHp, 0);
  const totalAtk = group.reduce((sum, m) => sum + m.atk, 0);
  const totalExp = group.reduce((sum, m) => sum + m.exp, 0);
  const totalGold = group.reduce((sum, m) => sum + m.gold, 0);

  battle = {
    monsters: group,
    monster: group[0], // первый для отображения иконки
    groupCount: group.length,
    myHp: s.hp,
    myMaxHp: s.maxHp,
    monsterHp: totalHp,
    monsterMaxHp: totalHp,
    totalExp,
    totalGold,
    log: [\`⚔️ Бой начался: \${group.length}× \${monster.name} (ур. \${monster.level})\`],
    turn: 'player',
    auto: false,
    lastPlayerAttack: 0
  };

  me.path = null;
  autoFight = false;

  renderBattlePage();
  console.log(\`⚔️ Бой с \${group.length}× \${monster.name}\`);
}`
  );

  // ============================================================
  // 4. ОБНОВЛЯЕМ END BATTLE — убиваем ВСЕХ из группы
  // ============================================================
  content = content.replace(
    `function endBattle(win) {
  if (!battle) return;
  const me = players.get(myId) || character;
  const s = character.stats;
  const m = battle.monster;

  if (win) {
    s.hp = battle.myHp;
    gainExp(m.exp);
    s.gold += m.gold;
    m.alive = false;
    m.respawnAt = Date.now() + 30000;
    setNavStatus(\`☠️ \${m.name} убит! +\${m.exp} опыта, +\${m.gold} золота\`, '#88ff88');
  } else {
    s.hp = 1;
    setNavStatus('💀 Вы проиграли бой', '#ff4444');
  }

  updateStatsHUD();
  battle = null;
  closeBattlePage();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
}`,
    `function endBattle(win) {
  if (!battle) return;
  const me = players.get(myId) || character;
  const s = character.stats;

  if (win) {
    s.hp = battle.myHp;
    // Убиваем всех
    battle.monsters.forEach(m => {
      m.alive = false;
      m.respawnAt = Date.now() + 30000;
    });
    gainExp(battle.totalExp);
    s.gold += battle.totalGold;
    setNavStatus(
      \`☠️ Победа! \${battle.groupCount}× \${battle.monster.name} — +\${battle.totalExp} опыта, +\${battle.totalGold} золота\`,
      '#88ff88'
    );
  } else {
    s.hp = 1;
    setNavStatus('💀 Вы проиграли бой', '#ff4444');
  }

  updateStatsHUD();
  battle = null;
  closeBattlePage();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
}`
  );

  // ============================================================
  // 5. ОБНОВЛЯЕМ RENDER — показываем группу
  // ============================================================
  content = content.replace(
    `      <!-- Моб -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ff4444);">\${m.icon}</div>
        <div style="font-size:16px;color:#ffaa44;margin-top:10px;">\${m.name}</div>
        <div style="font-size:12px;color:#888;">HP: \${battle.monsterHp}/\${battle.monsterMaxHp}</div>
      </div>`,
    `      <!-- Мобы (группа) -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ff4444);">
          \${battle.monster.icon}\${battle.groupCount > 1 ? \`<span style="font-size:40px;color:#ffd700;vertical-align:top;">×\${battle.groupCount}</span>\` : ''}
        </div>
        <div style="font-size:16px;color:#ffaa44;margin-top:10px;">\${battle.groupCount}× \${battle.monster.name}</div>
        <div style="font-size:12px;color:#888;">HP группы: \${battle.monsterHp}/\${battle.monsterMaxHp}</div>
      </div>`
  );

  // Заголовок группы
  content = content.replace(
    `        <div style="font-size:14px;color:#ffaa44;font-weight:bold;">\${m.name} • Ур. \${m.level}</div>`,
    `        <div style="font-size:14px;color:#ffaa44;font-weight:bold;">\${battle.groupCount}× \${m.name} • Ур. \${m.level}</div>`
  );

  // ============================================================
  // 6. АТАКА ПО ГРУППЕ — урон умножается на количество
  // ============================================================
  content = content.replace(
    `  battle.monsterHp -= dmg;
  battle.log.push(\`⚔️ Ты бьёшь \${battle.monster.name}: \${dmg}\${crit ? ' 💥 КРИТ!' : ''}\`);

  if (battle.monsterHp <= 0) {
    battle.log.push(\`☠️ \${battle.monster.name} побеждён!\`);
    renderBattlePage();
    setTimeout(() => endBattle(true), 800);
    return;
  }

  // Моб бьёт в ответ
  renderBattlePage();
  setTimeout(() => {
    if (!battle) return;
    const mobDmg = Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
    battle.myHp -= mobDmg;
    battle.log.push(\`💥 \${battle.monster.name} бьёт в ответ: \${mobDmg}\`);

    if (battle.myHp <= 0) {
      battle.log.push('💀 Ты побеждён...');
      renderBattlePage();
      setTimeout(() => endBattle(false), 800);
      return;
    }
    renderBattlePage();
  }, 500);`,
    `  battle.monsterHp -= dmg;
  battle.log.push(\`⚔️ Ты бьёшь \${battle.monster.name}×\${battle.groupCount}: \${dmg}\${crit ? ' 💥 КРИТ!' : ''}\`);

  if (battle.monsterHp <= 0) {
    battle.log.push(\`☠️ Вся группа побеждена!\`);
    renderBattlePage();
    setTimeout(() => endBattle(true), 800);
    return;
  }

  // Группа бьёт в ответ — каждый моб
  renderBattlePage();
  setTimeout(() => {
    if (!battle) return;
    let totalMobDmg = 0;
    for (let i = 0; i < battle.groupCount; i++) {
      // Каждый моб бьёт с шансом 70%
      if (Math.random() < 0.7) {
        totalMobDmg += Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      }
    }
    if (totalMobDmg > 0) {
      battle.myHp -= totalMobDmg;
      battle.log.push(\`💥 Группа бьёт в ответ: \${totalMobDmg}\`);
    }

    if (battle.myHp <= 0) {
      battle.log.push('💀 Ты побеждён...');
      renderBattlePage();
      setTimeout(() => endBattle(false), 800);
      return;
    }
    renderBattlePage();
  }, 500);`
  );

  // Побег — пересчёт урона от группы
  content = content.replace(
    `      const mobDmg = Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      battle.myHp -= mobDmg;
      battle.log.push(\`💥 \${battle.monster.name} бьёт: \${mobDmg}\`);`,
    `      let mobDmg = 0;
      for (let i = 0; i < battle.groupCount; i++) {
        if (Math.random() < 0.7) mobDmg += Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      }
      battle.myHp -= mobDmg;
      battle.log.push(\`💥 Группа бьёт: \${mobDmg}\`);`
  );

  content = addMarker(content, 'group-attack');
  writeFile(MAIN_FILE, content);
  return true;
}