// install/28-battle-ui.js — Стилистика боя в стиле Diablo
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'battle-ui')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: BATTLE UI (Diablo-style)
// ============================================================

// Анимационное состояние боя
let battleAnim = {
  playerX: 0,        // позиция игрока (0..1, 0 = левый край)
  playerY: 0,
  monsterX: 1,       // позиция моба (0..1)
  playerAttack: 0,   // 0..1 прогресс атаки
  monsterShake: 0,   // дрожание моба
  damageNumbers: [], // всплывающие цифры урона
  lastAttackTime: 0
};

// Рендер боя с анимацией
function renderBattleUI() {
  if (!battle) return;
  const el = document.getElementById('battlePage');
  if (el) el.remove();

  const me = players.get(myId) || character;
  const m = battle.monster;
  const s = character.stats;

  const myPct = (battle.myHp / battle.myMaxHp) * 100;
  const mobPct = (battle.monsterHp / battle.monsterMaxHp) * 100;

  const page = document.createElement('div');
  page.id = 'battlePage';
  page.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: radial-gradient(ellipse at center, #2a1a3a 0%, #0a0510 100%);
    color: #eee;
    font-family: Arial, sans-serif;
    z-index: 400;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
  \`;

  // Лог
  const logHtml = battle.log.slice(-8).map(line => 
    \`<div style="margin:2px 0;">\${line}</div>\`
  ).join('');

  // Всплывающие цифры урона
  const dmgHtml = battleAnim.damageNumbers.map(d => 
    \`<div style="position:absolute;left:\${d.x}px;top:\${d.y}px;font-size:32px;font-weight:bold;color:\${d.color};text-shadow:2px 2px 4px black;pointer-events:none;transform:translateY(\${d.offset}px);opacity:\${1 - d.offset/100};">\${d.text}</div>\`
  ).join('');

  page.innerHTML = \`
    <!-- Верхняя панель -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 25px;background:rgba(0,0,0,0.7);border-bottom:2px solid #8a5aff;">
      <div style="font-size:20px;font-weight:bold;color:#ffd700;">
        ⚔️ Бой: \${battle.groupCount}× \${m.name} (ур. \${m.level})
      </div>
      <button onclick="window.battleFlee()" style="padding:8px 18px;background:linear-gradient(135deg,#444,#222);color:#ffd700;font-size:14px;font-weight:bold;border:2px solid #ffd700;border-radius:6px;cursor:pointer;">🏃 Побег</button>
    </div>

    <!-- Основная сцена -->
    <div style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;padding:20px;overflow:hidden;">
      <!-- Земля -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(180deg,transparent 0%,rgba(80,60,40,0.5) 100%);"></div>

      <!-- Игрок -->
      <div id="battlePlayer" style="position:absolute;left:calc(30% - 60px);bottom:150px;font-size:120px;filter:drop-shadow(0 0 20px #ffd700);transition:left 0.4s ease-out;">
        🧙
      </div>

      <!-- Мобы -->
      <div id="battleMonster" style="position:absolute;right:calc(30% - 60px);bottom:150px;font-size:120px;filter:drop-shadow(0 0 20px #ff4444);transition:transform 0.1s;">
        <div style="position:relative;">
          \${m.icon}
          \${battle.groupCount > 1 ? \`<span style="position:absolute;top:0;right:-20px;font-size:36px;color:#ffd700;font-weight:bold;text-shadow:2px 2px 4px black;">×\${battle.groupCount}</span>\` : ''}
        </div>
      </div>

      <!-- Всплывающий урон -->
      \${dmgHtml}
    </div>

    <!-- Лог -->
    <div style="margin:0 30px;background:rgba(0,0,0,0.75);border:2px solid #4a4aff;border-radius:8px;padding:10px;height:130px;overflow-y:auto;font-family:monospace;font-size:12px;color:#aaa;">
      \${logHtml}
    </div>

    <!-- HP/MP/EXP панель -->
    <div style="padding:12px 30px;background:rgba(0,0,0,0.7);border-top:2px solid #8a5aff;">
      <div style="display:flex;gap:15px;align-items:center;">
        <!-- Игрок HP -->
        <div style="flex:1;">
          <div style="font-size:11px;color:#ccc;margin-bottom:2px;">❤️ \${battle.myHp}/\${battle.myMaxHp}</div>
          <div style="height:14px;background:#300;border:2px solid #000;border-radius:7px;overflow:hidden;">
            <div style="height:100%;width:\${myPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
          </div>
        </div>
        <!-- Центр — золото + авто -->
        <div style="display:flex;gap:10px;align-items:center;">
          <span style="color:#ffd700;font-weight:bold;">💰 \${s.gold}</span>
          <button onclick="window.battleAuto()" id="battleAutoBtn" style="padding:8px 16px;background:linear-gradient(135deg,#4a4aff,#8a2be2);color:white;font-size:13px;font-weight:bold;border:2px solid #ffd700;border-radius:6px;cursor:pointer;">🤖 Авто</button>
        </div>
        <!-- Моб HP -->
        <div style="flex:1;">
          <div style="font-size:11px;color:#ccc;margin-bottom:2px;text-align:right;">👹 \${battle.monsterHp}/\${battle.monsterMaxHp}</div>
          <div style="height:14px;background:#300;border:2px solid #000;border-radius:7px;overflow:hidden;">
            <div style="height:100%;width:\${mobPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Панель способностей -->
    <div style="display:flex;justify-content:center;gap:10px;padding:15px;background:linear-gradient(180deg,#1a0a2a 0%,#0a0510 100%);border-top:2px solid #8a5aff;">
      <div onclick="window.battleAttack()" style="width:70px;height:70px;background:linear-gradient(135deg,#c0392b,#e74c3c);border:3px solid #ffd700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;box-shadow:0 0 15px rgba(231,76,60,0.6);">
        <div style="font-size:30px;">⚔️</div>
        <div style="font-size:10px;color:#fff;font-weight:bold;">Атака</div>
        <div style="position:absolute;top:3px;left:5px;font-size:11px;color:#ffd700;font-weight:bold;">1</div>
      </div>
      <div onclick="window.battleSkill('skill')" style="width:70px;height:70px;background:linear-gradient(135deg,#555,#333);border:3px solid #666;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:not-allowed;position:relative;opacity:0.6;">
        <div style="font-size:30px;">🗡️</div>
        <div style="font-size:10px;color:#aaa;font-weight:bold;">Спец.удар</div>
        <div style="position:absolute;top:3px;left:5px;font-size:11px;color:#888;font-weight:bold;">2</div>
      </div>
      <div onclick="window.battleSkill('magic')" style="width:70px;height:70px;background:linear-gradient(135deg,#555,#333);border:3px solid #666;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:not-allowed;position:relative;opacity:0.6;">
        <div style="font-size:30px;">🔥</div>
        <div style="font-size:10px;color:#aaa;font-weight:bold;">Магия</div>
        <div style="position:absolute;top:3px;left:5px;font-size:11px;color:#888;font-weight:bold;">3</div>
      </div>
      <div onclick="window.battleSkill('defend')" style="width:70px;height:70px;background:linear-gradient(135deg,#555,#333);border:3px solid #666;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:not-allowed;position:relative;opacity:0.6;">
        <div style="font-size:30px;">🛡️</div>
        <div style="font-size:10px;color:#aaa;font-weight:bold;">Защита</div>
        <div style="position:absolute;top:3px;left:5px;font-size:11px;color:#888;font-weight:bold;">4</div>
      </div>
      <div onclick="window.battlePotion()" style="width:70px;height:70px;background:linear-gradient(135deg,#8a2be2,#4a4aff);border:3px solid #ffd700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;box-shadow:0 0 15px rgba(138,43,226,0.6);">
        <div style="font-size:30px;">🧪</div>
        <div style="font-size:10px;color:#fff;font-weight:bold;">Зелье</div>
        <div style="position:absolute;top:3px;left:5px;font-size:11px;color:#ffd700;font-weight:bold;">5</div>
      </div>
    </div>
  \`;

  document.getElementById('gameScreen').appendChild(page);

  // Горячие клавиши 1-5
  window._battleKeyHandler = (e) => {
    if (!battle) return;
    if (e.key === '1') window.battleAttack();
    else if (e.key === '2') window.battleSkill('skill');
    else if (e.key === '3') window.battleSkill('magic');
    else if (e.key === '4') window.battleSkill('defend');
    else if (e.key === '5') window.battlePotion();
  };
  window.addEventListener('keydown', window._battleKeyHandler);
}

// Закрытие с очисткой обработчиков
const _originalCloseBattlePage = typeof closeBattlePage === 'function' ? closeBattlePage : null;
function closeBattlePageUI() {
  if (window._battleKeyHandler) {
    window.removeEventListener('keydown', window._battleKeyHandler);
    window._battleKeyHandler = null;
  }
  const el = document.getElementById('battlePage');
  if (el) el.remove();
}

// Анимация атаки: игрок идёт к мобу, бьёт, возвращается
function animatePlayerAttack(callback) {
  const player = document.getElementById('battlePlayer');
  const monster = document.getElementById('battleMonster');
  if (!player || !monster) { if (callback) callback(); return; }

  // Идём к мобу
  player.style.left = 'calc(60% - 60px)';
  player.style.transition = 'left 0.3s ease-in';

  setTimeout(() => {
    // Моб дрожит
    if (monster) {
      let shakes = 0;
      const shakeInterval = setInterval(() => {
        monster.style.transform = \`translateX(\${Math.sin(shakes * 2) * 8}px)\`;
        shakes++;
        if (shakes > 6) {
          clearInterval(shakeInterval);
          monster.style.transform = '';
        }
      }, 50);
    }

    // Всплывающий урон
    setTimeout(() => {
      // Возвращаемся
      player.style.left = 'calc(30% - 60px)';
      player.style.transition = 'left 0.3s ease-out';

      setTimeout(() => {
        if (callback) callback();
      }, 300);
    }, 150);
  }, 300);
}

// Всплывающий урон
function showDamageNumber(text, color, isMonster = true) {
  if (!battle) return;
  const dmg = {
    text,
    color,
    x: isMonster ? window.innerWidth * 0.7 + (Math.random() * 40 - 20) : window.innerWidth * 0.3 + (Math.random() * 40 - 20),
    y: window.innerHeight * 0.4,
    offset: 0
  };
  battleAnim.damageNumbers.push(dmg);
  
  // Анимация
  const startTime = Date.now();
  const animInterval = setInterval(() => {
    dmg.offset += 5;
    if (dmg.offset > 100) {
      clearInterval(animInterval);
      const idx = battleAnim.damageNumbers.indexOf(dmg);
      if (idx >= 0) battleAnim.damageNumbers.splice(idx, 1);
      if (battle) renderBattleUI();
    } else {
      // Обновляем только DOM для плавности
      const els = document.querySelectorAll('#battlePage div[style*="pointer-events:none"]');
      // Просто перерисуем весь UI (упрощённо)
    }
  }, 30);
}

// Переопределяем атаку
const _originalBattleAttack = window.battleAttack;
window.battleAttack = function() {
  if (!battle || battle.turn !== 'player') return;
  const now = Date.now();
  if (now - battle.lastPlayerAttack < 900) return;
  battle.lastPlayerAttack = now;

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  battle.monsterHp -= dmg;
  battle.log.push(\`⚔️ Ты бьёшь \${battle.monster.name}×\${battle.groupCount}: \${dmg}\${crit ? ' 💥 КРИТ!' : ''}\`);

  // Анимация + урон
  animatePlayerAttack(() => {
    showDamageNumber(\`-\${dmg}\${crit ? '!' : ''}\`, crit ? '#ffd700' : '#ff6666', true);
    if (battle) renderBattleUI();
  });

  if (battle.monsterHp <= 0) {
    battle.log.push(\`☠️ Вся группа побеждена!\`);
    renderBattleUI();
    setTimeout(() => endBattle(true), 1000);
    return;
  }

  // Моб бьёт в ответ
  setTimeout(() => {
    if (!battle) return;
    let totalMobDmg = 0;
    for (let i = 0; i < battle.groupCount; i++) {
      if (Math.random() < 0.7) {
        totalMobDmg += Math.max(1, battle.monster.atk - Math.floor(s.vit * 0.5));
      }
    }
    if (totalMobDmg > 0) {
      battle.myHp -= totalMobDmg;
      battle.log.push(\`💥 Группа бьёт в ответ: \${totalMobDmg}\`);
      showDamageNumber(\`-\${totalMobDmg}\`, '#ff4444', false);
    }

    if (battle.myHp <= 0) {
      battle.log.push('💀 Ты побеждён...');
      renderBattleUI();
      setTimeout(() => endBattle(false), 1000);
      return;
    }
    renderBattleUI();
  }, 600);
};

// Скиллы (заглушки)
window.battleSkill = function(type) {
  if (!battle) return;
  const names = { skill: '🗡️ Спец.удар', magic: '🔥 Магия', defend: '🛡️ Защита' };
  battle.log.push(\`\${names[type]} — скоро!\`);
  renderBattleUI();
};

// Зелье HP
window.battlePotion = function() {
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
};

// Обновляем рендер при каждом логе
const _origRenderBattlePage = renderBattlePage;
function renderBattlePage() {
  renderBattleUI();
}
`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // Обновляем startBattle — вызываем renderBattleUI вместо renderBattlePage
  content = content.replace(
    `  renderBattlePage();
  console.log(\`⚔️ Бой с \${group.length}× \${monster.name}\`);`,
    `  renderBattleUI();
  console.log(\`⚔️ Бой с \${group.length}× \${monster.name}\`);`
  );

  // В endBattle — используем closeBattlePageUI
  content = content.replace(
    `  battle = null;
  closeBattlePage();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
}`,
    `  battle = null;
  if (typeof closeBattlePageUI === 'function') closeBattlePageUI();
  else closeBattlePage();

  if (socket) socket.emit('move', { x: me.x, y: me.y });
}`
  );

  // Удаляем старую renderBattlePage (она теперь переопределена)
  content = content.replace(
    `function renderBattlePage() {
  if (!battle) return;
  closeBattlePage();

  const me = players.get(myId) || character;
  const m = battle.monster;
  const s = character.stats;

  const page = document.createElement('div');`,
    `function renderBattlePageLegacy() {
  if (!battle) return;
  closeBattlePage();

  const me = players.get(myId) || character;
  const m = battle.monster;
  const s = character.stats;

  const page = document.createElement('div');`
  );

  content = addMarker(content, 'battle-ui');
  writeFile(MAIN_FILE, content);
  return true;
}