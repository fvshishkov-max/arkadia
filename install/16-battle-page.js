// install/16-battle-page.js — Бой как отдельная страница + агрессивные мобы
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'battle-page')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: BATTLE PAGE (бой как отдельная страница)
// ============================================================

// Состояние боя
let battle = null;
// battle = {
//   monster,      — текущий моб
//   myHp, myMaxHp,
//   log,          — массив строк
//   turn,         — 'player' | 'monster' | 'idle'
//   auto: false,
//   onWin, onLose — колбэки
// }

function startBattle(monster) {
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
}

function endBattle(win) {
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
}

function closeBattlePage() {
  const el = document.getElementById('battlePage');
  if (el) el.remove();
}

function renderBattlePage() {
  if (!battle) return;
  closeBattlePage();

  const me = players.get(myId) || character;
  const m = battle.monster;
  const s = character.stats;

  const page = document.createElement('div');
  page.id = 'battlePage';
  page.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(180deg, #1a0a2a 0%, #0a0510 100%);
    color: #eee;
    font-family: Arial, sans-serif;
    z-index: 400;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  \`;

  // HP % для баров
  const myPct = (battle.myHp / battle.myMaxHp) * 100;
  const mobPct = (battle.monsterHp / battle.monsterMaxHp) * 100;

  // Строки лога
  const logHtml = battle.log.slice(-6).map(line => \`<div style="margin: 2px 0;">\${line}</div>\`).join('');

  page.innerHTML = \`
    <!-- Верхняя полоса: HP/MP игрока и моба -->
    <div style="display:flex;justify-content:space-between;padding:15px 30px;background:rgba(0,0,0,0.5);border-bottom:2px solid #8a5aff;">
      <div style="width:35%;">
        <div style="font-size:14px;color:#ffd700;font-weight:bold;">\${me.name} • Ур. \${s.level}</div>
        <div style="font-size:11px;color:#ccc;">❤️ \${battle.myHp} / \${battle.myMaxHp}</div>
        <div style="height:16px;background:#300;border:2px solid #000;border-radius:8px;overflow:hidden;margin-top:4px;">
          <div style="height:100%;width:\${myPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
        </div>
      </div>
      <div style="font-size:24px;color:#ff4444;align-self:center;">⚔️ VS ⚔️</div>
      <div style="width:35%;text-align:right;">
        <div style="font-size:14px;color:#ffaa44;font-weight:bold;">\${m.name} • Ур. \${m.level}</div>
        <div style="font-size:11px;color:#ccc;">❤️ \${battle.monsterHp} / \${battle.monsterMaxHp}</div>
        <div style="height:16px;background:#300;border:2px solid #000;border-radius:8px;overflow:hidden;margin-top:4px;">
          <div style="height:100%;width:\${mobPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;margin-left:auto;"></div>
        </div>
      </div>
    </div>

    <!-- Основная сцена боя -->
    <div style="flex:1;display:flex;justify-content:space-around;align-items:center;padding:20px;">
      <!-- Игрок -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ffd700);">🧙</div>
        <div style="font-size:16px;color:#ffd700;margin-top:10px;">\${me.name}</div>
        <div style="font-size:12px;color:#888;">HP: \${battle.myHp}/\${battle.myMaxHp}</div>
      </div>

      <!-- Моб -->
      <div style="text-align:center;">
        <div style="font-size:160px;filter:drop-shadow(0 0 30px #ff4444);">\${m.icon}</div>
        <div style="font-size:16px;color:#ffaa44;margin-top:10px;">\${m.name}</div>
        <div style="font-size:12px;color:#888;">HP: \${battle.monsterHp}/\${battle.monsterMaxHp}</div>
      </div>
    </div>

    <!-- Лог боя -->
    <div style="margin:0 30px;background:rgba(0,0,0,0.6);border:2px solid #4a4aff;border-radius:8px;padding:10px;height:140px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;">
      \${logHtml}
    </div>

    <!-- Панель действий -->
    <div style="display:flex;justify-content:center;gap:15px;padding:20px;background:rgba(0,0,0,0.5);border-top:2px solid #8a5aff;">
      <button onclick="window.battleAttack()" style="padding:14px 28px;background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;font-size:16px;font-weight:bold;border:2px solid #ffd700;border-radius:8px;cursor:pointer;">⚔️ Атака</button>
      <button onclick="window.battleAuto()" id="battleAutoBtn" style="padding:14px 28px;background:linear-gradient(135deg,#4a4aff,#8a2be2);color:white;font-size:16px;font-weight:bold;border:2px solid #ffd700;border-radius:8px;cursor:pointer;">🤖 Авто</button>
      <button onclick="window.battleFlee()" style="padding:14px 28px;background:linear-gradient(135deg,#555,#333);color:white;font-size:16px;font-weight:bold;border:2px solid #888;border-radius:8px;cursor:pointer;">🏃 Побег</button>
    </div>
  \`;

  document.getElementById('gameScreen').appendChild(page);
}

function battleLog(text) {
  if (!battle) return;
  battle.log.push(text);
  renderBattlePage();
}

window.battleAttack = function() {
  if (!battle || battle.turn !== 'player') return;
  const now = Date.now();
  if (now - battle.lastPlayerAttack < 800) return;
  battle.lastPlayerAttack = now;

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  battle.monsterHp -= dmg;
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
  }, 500);
};

window.battleAuto = function() {
  if (!battle) return;
  battle.auto = !battle.auto;
  const btn = document.getElementById('battleAutoBtn');
  if (btn) {
    btn.textContent = battle.auto ? '🤖 Авто ВКЛ' : '🤖 Авто';
    btn.style.background = battle.auto 
      ? 'linear-gradient(135deg,#2a8a35,#4ade80)' 
      : 'linear-gradient(135deg,#4a4aff,#8a2be2)';
  }
  battle.log.push(battle.auto ? '🤖 Автобой включён' : '⏸️ Автобой выключен');
  renderBattlePage();
};

window.battleFlee = function() {
  if (!battle) return;
  if (Math.random() < 0.5) {
    battle.log.push('🏃 Ты сбежал!');
    renderBattlePage();
    setTimeout(() => {
      const me = players.get(myId) || character;
      const s = character.stats;
      s.hp = battle.myHp;
      updateStatsHUD();
      battle = null;
      closeBattlePage();
    }, 600);
  } else {
    battle.log.push('❌ Побег не удался!');
    renderBattlePage();
    setTimeout(() => {
      if (!battle) return;
      const s = character.stats;
      const mobDmg = Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      battle.myHp -= mobDmg;
      battle.log.push(\`💥 \${battle.monster.name} бьёт: \${mobDmg}\`);
      if (battle.myHp <= 0) {
        battle.log.push('💀 Ты побеждён...');
        renderBattlePage();
        setTimeout(() => endBattle(false), 800);
        return;
      }
      renderBattlePage();
    }, 500);
  }
};

// Авто-атака в бою
setInterval(() => {
  if (!battle || !battle.auto) return;
  if (battle.turn !== 'player') return;
  window.battleAttack();
}, 900);

// ============================================================
//  АГРЕССИВНЫЕ МОБЫ
// ============================================================

function checkAggro() {
  if (battle) return;
  if (currentScene !== 'world') return;
  const me = players.get(myId) || character;
  if (!me) return;

  // Ищем ближайшего моба в радиусе 100px
  for (const m of monsters) {
    if (!m.alive) continue;
    const d = Math.hypot(m.x - me.x, m.y - me.y);
    if (d < 100) {
      startBattle(m);
      return;
    }
  }
}

setInterval(checkAggro, 500);

`;

  // Вставляем перед блоком СОКЕТЫ
  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // Мобы больше НЕ атакуются кликом (только агрятся)
  content = content.replace(
    `  // Клик по мобу?
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    attackMonster(clickedMonster);
    return;
  }`,
    `  // Клик по мобу — теперь просто подсветка, бой начнётся сам при сближении
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    setNavStatus(\`⚔️ \${clickedMonster.name} — подойди ближе для боя\`, '#ffaa44');
    return;
  }`
  );

  // Отключаем старый updateAutoFight (он теперь в бою)
  content = content.replace(
    '  updateAutoFight();\n  updateHUDs();',
    '  updateHUDs();'
  );

  content = addMarker(content, 'battle-page');
  writeFile(MAIN_FILE, content);
  return true;
}