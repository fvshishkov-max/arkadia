// install/05-stats.js — HP/MP/опыт/статы/смерть
export default async function install({ readFile, writeFile, backup, insertBefore, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) { console.error('main.js не найден'); return false; }

  if (hasMarker(content, 'stats')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: STATS (HP/MP/опыт/статы/смерть)
// ============================================================

// Статы персонажа (загружаются с сервера)
character.stats = character.stats || {
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  exp: 0,
  expNext: 100,
  level: 1,
  str: 5, agi: 5, int: 5, vit: 5, luck: 5,
  freePoints: 0,
  gold: 0
};

// Пересчёт максимальных HP/MP от статов
function recalcMaxHP() {
  const s = character.stats;
  s.maxHp = 100 + s.vit * 10 + s.str * 2;
  s.maxMp = 50 + s.int * 8;
}

// Опыт за уровень
function expForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.5, lvl - 1));
}

// Получение опыта
function gainExp(amount) {
  const s = character.stats;
  s.exp += amount;
  console.log(\`+ \${amount} опыта\`);
  while (s.exp >= s.expNext) {
    s.exp -= s.expNext;
    s.level++;
    s.freePoints += 5;
    s.expNext = expForLevel(s.level);
    recalcMaxHP();
    s.hp = s.maxHp;
    s.mp = s.maxMp;
    setNavStatus(\`🎉 Уровень \${s.level}!\`, '#ffd700');
    console.log(\`🎉 LEVEL UP! Уровень \${s.level}\`);
  }
  updateStatsHUD();
}

// Урон
function takeDamage(amount) {
  const s = character.stats;
  s.hp = Math.max(0, s.hp - amount);
  updateStatsHUD();
  if (s.hp <= 0) die();
}

function die() {
  setNavStatus('💀 Вы погибли! Респавн...', '#ff4444');
  console.log('💀 Смерть');
  const s = character.stats;
  s.hp = Math.floor(s.maxHp * 0.5);
  s.mp = Math.floor(s.maxMp * 0.5);
  // Телепорт в ближайший город
  const me = players.get(myId) || character;
  if (me) {
    me.path = null;
    me.x = CITIES[0].tileX * TILE_SIZE + TILE_SIZE / 2;
    me.y = (CITIES[0].tileY + Math.floor(CITIES[0].size / 2) + 2) * TILE_SIZE;
    camera.x = me.x - canvas.width / 2;
    camera.y = me.y - canvas.height / 2;
    if (socket) socket.emit('move', { x: me.x, y: me.y });
  }
  updateStatsHUD();
}

// HUD со статами
function createStatsHUD() {
  if (document.getElementById('statsPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'statsPanel';
  panel.style.cssText = \`
    position: absolute; top: 60px; left: 15px;
    background: rgba(15, 15, 30, 0.92);
    border: 2px solid #4a4aff; border-radius: 8px;
    padding: 10px 14px; color: #eee;
    font-family: Arial, sans-serif; font-size: 12px;
    z-index: 150; min-width: 180px;
  \`;
  panel.innerHTML = \`
    <div style="font-weight:bold;color:#ffd700;margin-bottom:6px;">❤️ HP / 🔵 MP</div>
    <div style="margin-bottom:4px;">
      <div style="font-size:10px;color:#ccc;">HP: <span id="hpText">100/100</span></div>
      <div style="width:100%;height:10px;background:#300;border-radius:5px;overflow:hidden;">
        <div id="hpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:10px;color:#ccc;">MP: <span id="mpText">50/50</span></div>
      <div style="width:100%;height:10px;background:#003;border-radius:5px;overflow:hidden;">
        <div id="mpBar" style="height:100%;width:100%;background:linear-gradient(90deg,#2980b9,#3498db);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-size:10px;color:#ccc;">EXP: <span id="expText">0/100</span></div>
      <div style="width:100%;height:8px;background:#330;border-radius:4px;overflow:hidden;">
        <div id="expBar" style="height:100%;width:0%;background:linear-gradient(90deg,#f39c12,#ffd700);transition:width 0.3s;"></div>
      </div>
    </div>
    <div style="border-top:1px solid #333;padding-top:6px;font-size:11px;">
      <div>💰 Золото: <span id="goldText">0</span></div>
      <div>💪 STR: <span id="strText">5</span></div>
      <div>🏃 AGI: <span id="agiText">5</span></div>
      <div>🧠 INT: <span id="intText">5</span></div>
      <div>🛡️ VIT: <span id="vitText">5</span></div>
      <div>🍀 LUCK: <span id="luckText">5</span></div>
      <div id="freePoints" style="color:#ffd700;margin-top:4px;display:none;">
        ✨ Очков: <span id="fpText">0</span>
      </div>
    </div>
  \`;
  document.getElementById('gameScreen').appendChild(panel);
}

function updateStatsHUD() {
  const s = character.stats;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('hpText', \`\${s.hp}/\${s.maxHp}\`);
  set('mpText', \`\${s.mp}/\${s.maxMp}\`);
  set('expText', \`\${s.exp}/\${s.expNext}\`);
  set('goldText', s.gold);
  set('strText', s.str);
  set('agiText', s.agi);
  set('intText', s.int);
  set('vitText', s.vit);
  set('luckText', s.luck);
  set('fpText', s.freePoints);

  const hpBar = document.getElementById('hpBar');
  const mpBar = document.getElementById('mpBar');
  const expBar = document.getElementById('expBar');
  if (hpBar) hpBar.style.width = (s.hp / s.maxHp * 100) + '%';
  if (mpBar) mpBar.style.width = (s.mp / s.maxMp * 100) + '%';
  if (expBar) expBar.style.width = (s.exp / s.expNext * 100) + '%';

  const fp = document.getElementById('freePoints');
  if (fp) fp.style.display = s.freePoints > 0 ? 'block' : 'none';
}

// Регенерация
setInterval(() => {
  if (!character || !character.stats) return;
  const s = character.stats;
  if (s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + 1);
  if (s.mp < s.maxMp) s.mp = Math.min(s.maxMp, s.mp + 1);
  updateStatsHUD();
}, 3000);

`;

  // Вставляем перед блоком socket
  content = insertBefore(content, '// ============================================================\n//  СОКЕТЫ', code, 'stats');

  // Добавляем вызов в startGame
  content = content.replace(
    '  createHUDs();',
    `  createHUDs();
  recalcMaxHP();
  createStatsHUD();
  updateStatsHUD();`
  );

  // Добавляем обработку клавиш 1-5 для распределения статов
  content = content.replace(
    "  window.addEventListener('keydown', e => {",
    `  window.addEventListener('keydown', e => {
    if (character && character.stats && character.stats.freePoints > 0) {
      const s = character.stats;
      let stat = null;
      if (e.key === '1') stat = 'str';
      else if (e.key === '2') stat = 'agi';
      else if (e.key === '3') stat = 'int';
      else if (e.key === '4') stat = 'vit';
      else if (e.key === '5') stat = 'luck';
      if (stat) {
        s[stat]++;
        s.freePoints--;
        recalcMaxHP();
        updateStatsHUD();
        console.log(\`\${stat} → \${s[stat]}\`);
      }
    }`
  );

  content = addMarker(content, 'stats');
  writeFile(MAIN_FILE, content);
  return true;
}