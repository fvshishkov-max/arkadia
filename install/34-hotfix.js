// install/34-hotfix.js — фикс toLowerCase и bossBattle null
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'hotfix')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. ФИКС: e.key может быть undefined
  // ============================================================
  // Ищем все обработчики keydown и добавляем проверку
  content = content.replace(
    /window\.addEventListener\('keydown',\s*e\s*=>\s*\{/g,
    `window.addEventListener('keydown', e => {
    if (!e || !e.key) return;`
  );

  content = content.replace(
    /document\.addEventListener\('keydown',\s*e\s*=>\s*\{/g,
    `document.addEventListener('keydown', e => {
    if (!e || !e.key) return;`
  );

  // ============================================================
  // 2. ФИКС: bossBattle может стать null в таймерах
  // ============================================================
  content = content.replace(
    `function animateBossAttack(callback) {
  const player = document.getElementById('battlePlayer');
  const monster = document.getElementById('battleMonster');
  if (!player) { if (callback) callback(); return; }

  player.style.left = 'calc(60% - 70px)';
  player.style.transition = 'left 0.3s ease-in';

  setTimeout(() => {
    if (monster) {
      let shakes = 0;
      const si = setInterval(() => {
        monster.style.transform = \`translateX(\${Math.sin(shakes * 2) * 10}px)\`;
        shakes++;
        if (shakes > 8) { clearInterval(si); monster.style.transform = ''; }
      }, 50);
    }
    setTimeout(() => {
      player.style.left = 'calc(30% - 70px)';
      player.style.transition = 'left 0.3s ease-out';
      setTimeout(() => { if (callback) callback(); }, 300);
    }, 200);
  }, 300);
}`,
    `function animateBossAttack(callback) {
  const player = document.getElementById('battlePlayer');
  const monster = document.getElementById('battleMonster');
  if (!player) { if (callback) callback(); return; }

  player.style.left = 'calc(60% - 70px)';
  player.style.transition = 'left 0.3s ease-in';

  setTimeout(() => {
    // Проверка что бой ещё идёт
    if (!bossBattle) { if (callback) callback(); return; }
    if (monster) {
      let shakes = 0;
      const si = setInterval(() => {
        if (!document.getElementById('battleMonster')) { clearInterval(si); return; }
        monster.style.transform = \`translateX(\${Math.sin(shakes * 2) * 10}px)\`;
        shakes++;
        if (shakes > 8) { clearInterval(si); if (monster) monster.style.transform = ''; }
      }, 50);
    }
    setTimeout(() => {
      if (!bossBattle) { if (callback) callback(); return; }
      if (player) {
        player.style.left = 'calc(30% - 70px)';
        player.style.transition = 'left 0.3s ease-out';
      }
      setTimeout(() => { if (callback) callback(); }, 300);
    }, 200);
  }, 300);
}`
  );

  // Фикс атаки босса — проверка bossBattle в каждом шаге
  content = content.replace(
    `window.bossAttack = function() {
  if (!bossBattle) return;
  const now = Date.now();
  if (now - bossBattle.lastPlayerAttack < 900) return;
  bossBattle.lastPlayerAttack = now;

  if (bossEffects.frozen > 0) {
    bossBattle.log.push('❄️ Ты заморожен! Пропускаешь ход.');
    renderBossBattleUI();
    bossTurn();
    return;
  }

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  // Урон снижается каменной кожей (каменный колосс)
  let finalDmg = dmg;
  if (bossBattle.boss.effect === 'stone_skin') finalDmg = Math.floor(dmg * 0.5);

  bossBattle.bossHp -= finalDmg;
  bossBattle.log.push(\`⚔️ Удар: \${finalDmg}\${crit ? ' КРИТ!' : ''}\`);

  animateBossAttack(() => {
    if (bossBattle.bossHp <= 0) {
      onBossDefeated();
      return;
    }
    bossTurn();
  });
};`,
    `window.bossAttack = function() {
  if (!bossBattle) return;
  const now = Date.now();
  if (now - bossBattle.lastPlayerAttack < 900) return;
  bossBattle.lastPlayerAttack = now;

  if (bossEffects.frozen > 0) {
    bossBattle.log.push('❄️ Ты заморожен! Пропускаешь ход.');
    renderBossBattleUI();
    bossTurn();
    return;
  }

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  let finalDmg = dmg;
  if (bossBattle.boss.effect === 'stone_skin') finalDmg = Math.floor(dmg * 0.5);

  bossBattle.bossHp -= finalDmg;
  bossBattle.log.push(\`⚔️ Удар: \${finalDmg}\${crit ? ' КРИТ!' : ''}\`);

  animateBossAttack(() => {
    if (!bossBattle) return;  // ✅ проверка
    if (bossBattle.bossHp <= 0) {
      onBossDefeated();
      return;
    }
    bossTurn();
  });
};`
  );

  // Фикс bossTurn
  content = content.replace(
    `  bossBattle.myHp -= dmg;
  bossBattle.log.push(\`💥 \${b.name}: \${dmg}\${extraLog}\`);

  if (bossBattle.myHp <= 0) { onBossLose(); return; }
  renderBossBattleUI();
}`,
    `  if (!bossBattle) return;  // ✅ проверка
  bossBattle.myHp -= dmg;
  bossBattle.log.push(\`💥 \${b.name}: \${dmg}\${extraLog}\`);

  if (!bossBattle) return;
  if (bossBattle.myHp <= 0) { onBossLose(); return; }
  renderBossBattleUI();
}`
  );

  // Фикс onBossDefeated
  content = content.replace(
    `function onBossDefeated() {
  const b = bossBattle.boss;`,
    `function onBossDefeated() {
  if (!bossBattle) return;
  const b = bossBattle.boss;`
  );

  // Авто-атака босса — проверка
  content = content.replace(
    `setInterval(() => {
  if (bossBattle && bossBattle.auto) window.bossAttack();
}, 1000);`,
    `setInterval(() => {
  if (bossBattle && bossBattle.auto && !bossBattle.paused) {
    try { window.bossAttack(); } catch (e) { console.warn('boss auto error:', e); }
  }
}, 1000);`
  );

  // Фикс клавиш 1-5 в бою
  content = content.replace(
    `  window._battleKeyHandler = (e) => {
    if (!battle) return;
    if (e.key === '1') window.battleAttack();`,
    `  window._battleKeyHandler = (e) => {
    if (!battle || !e || !e.key) return;
    if (e.key === '1') window.battleAttack();`
  );

  content = addMarker(content, 'hotfix');
  writeFile(MAIN_FILE, content);
  return true;
}