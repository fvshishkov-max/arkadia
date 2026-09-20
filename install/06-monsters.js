// install/06-monsters.js — Мобы + бой
export default async function install({ readFile, writeFile, backup, insertBefore, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) { console.error('main.js не найден'); return false; }

  if (hasMarker(content, 'monsters')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: MONSTERS (мобы + бой)
// ============================================================

// Типы мобов
const MONSTER_TYPES = {
  goblin: { name: 'Гоблин', icon: '👹', hp: 30, atk: 5, def: 1, exp: 15, gold: 3, color: '#7a4a2a', level: 1 },
  orc:    { name: 'Орк',    icon: '👺', hp: 60, atk: 10, def: 3, exp: 35, gold: 8, color: '#4a6a2a', level: 5 },
  ogre:   { name: 'Огр',    icon: '🧟', hp: 120, atk: 18, def: 6, exp: 80, gold: 20, color: '#6a4a4a', level: 10 }
};

// Спавн-зоны (вокруг городов)
const SPAWN_ZONES = [
  { city: 'dragon', monster: 'goblin', count: 15, radius: 12 },
  { city: 'valencia', monster: 'goblin', count: 15, radius: 12 },
  { city: 'elf', monster: 'goblin', count: 15, radius: 12 },
  { city: 'valencia', monster: 'orc', count: 10, radius: 18 },
  { city: 'elf', monster: 'orc', count: 10, radius: 18 },
  { city: 'dragon', monster: 'ogre', count: 5, radius: 20 }
];

// Список живых мобов
let monsters = [];
let selectedMonster = null;
let autoFight = false;
let lastAutoAttack = 0;

function spawnMonsters() {
  monsters = [];
  let seed = 54321;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  SPAWN_ZONES.forEach(zone => {
    const city = CITIES.find(c => c.id === zone.city);
    if (!city) return;
    const type = MONSTER_TYPES[zone.monster];

    for (let i = 0; i < zone.count; i++) {
      // Случайная точка в радиусе от города
      let attempts = 0;
      while (attempts < 20) {
        attempts++;
        const angle = rand() * Math.PI * 2;
        const dist = 4 + rand() * zone.radius;
        const tx = Math.floor(city.tileX + Math.cos(angle) * dist);
        const ty = Math.floor(city.tileY + Math.sin(angle) * dist);
        if (tx < 1 || tx >= MAP_SIZE - 1 || ty < 1 || ty >= MAP_SIZE - 1) continue;
        const tile = GAME_MAP[ty][tx];
        if (tile === TILE.WATER || tile === TILE.CITY_GROUND || tile === TILE.GATE) continue;

        monsters.push({
          id: 'm_' + zone.monster + '_' + i,
          type: zone.monster,
          name: type.name,
          icon: type.icon,
          color: type.color,
          x: tx * TILE_SIZE + TILE_SIZE / 2,
          y: ty * TILE_SIZE + TILE_SIZE / 2,
          hp: type.hp,
          maxHp: type.hp,
          atk: type.atk,
          def: type.def,
          exp: type.exp,
          gold: type.gold,
          level: type.level,
          alive: true,
          respawnAt: 0
        });
        break;
      }
    }
  });
  console.log(\`👹 Заспавнено мобов: \${monsters.length}\`);
}

function drawMonsters(ctx, camera) {
  monsters.forEach(m => {
    if (!m.alive) return;
    const px = m.x - camera.x;
    const py = m.y - camera.y;
    if (px < -40 || px > canvas.width + 40 || py < -40 || py > canvas.height + 40) return;

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело
    ctx.fillStyle = m.color;
    ctx.fillRect(px - 10, py - 10, 20, 24);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 10, py - 10, 20, 24);

    // Иконка (глаза)
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(m.icon, px, py + 4);

    // HP-бар
    const hpW = 24;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px - hpW / 2, py - 22, hpW, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - hpW / 2, py - 22, hpW * (m.hp / m.maxHp), 4);

    // Имя и уровень
    ctx.font = 'bold 10px Arial';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.strokeText(\`\${m.name} \${m.level}\`, px, py - 26);
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(\`\${m.name} \${m.level}\`, px, py - 26);

    // Подсветка выбранного
    if (selectedMonster === m) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 14, py - 14, 28, 30);
    }
  });
}

function findMonsterAt(worldX, worldY) {
  for (const m of monsters) {
    if (!m.alive) continue;
    if (Math.abs(worldX - m.x) < 16 && Math.abs(worldY - m.y) < 16) return m;
  }
  return null;
}

function attackMonster(m) {
  const me = players.get(myId) || character;
  if (!me || !m || !m.alive) return;

  // Проверка дистанции
  const dist = Math.hypot(m.x - me.x, m.y - me.y);
  if (dist > 60) {
    // Идём к мобу
    const startX = Math.floor(me.x / TILE_SIZE);
    const startY = Math.floor(me.y / TILE_SIZE);
    const tx = Math.floor(m.x / TILE_SIZE);
    const ty = Math.floor(m.y / TILE_SIZE);
    const path = findPath(startX, startY, tx, ty);
    if (path) {
      me.path = path;
      selectedMonster = m;
      setNavStatus(\`⚔️ Иду к \${m.name}\`, '#ffaa44');
    }
    return;
  }

  // Урон
  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));
  m.hp -= dmg;

  console.log(\`⚔️ Удар \${m.name}: \${dmg}\${crit ? ' КРИТ!' : ''}\`);

  // Моб бьёт в ответ
  if (m.hp > 0 && Math.random() < 0.7) {
    const mobDmg = Math.max(1, m.atk - Math.floor(s.vit * 0.5));
    takeDamage(mobDmg);
    console.log(\`💥 \${m.name} бьёт в ответ: \${mobDmg}\`);
  }

  if (m.hp <= 0) killMonster(m);
}

function killMonster(m) {
  m.alive = false;
  m.hp = 0;
  m.respawnAt = Date.now() + 30000; // респавн через 30 сек
  const s = character.stats;
  gainExp(m.exp);
  s.gold += m.gold;
  setNavStatus(\`☠️ \${m.name} убит! +\${m.exp} опыта, +\${m.gold} золота\`, '#88ff88');
  updateStatsHUD();
  console.log(\`☠️ \${m.name} убит\`);
  if (selectedMonster === m) selectedMonster = null;
}

function respawnMonsters() {
  monsters.forEach(m => {
    if (!m.alive && Date.now() >= m.respawnAt) {
      m.alive = true;
      m.hp = m.maxHp;
    }
  });
}

setInterval(respawnMonsters, 3000);

// Автобой
function toggleAutoFight() {
  autoFight = !autoFight;
  setNavStatus(autoFight ? '🤖 Автобой ВКЛ' : '🤖 Автобой ВЫКЛ', autoFight ? '#88ff88' : '#888');
}

function updateAutoFight() {
  if (!autoFight) return;
  const me = players.get(myId) || character;
  if (!me) return;
  const now = Date.now();
  if (now - lastAutoAttack < 1200) return;

  // Ищем ближайшего моба
  let nearest = null, bestDist = Infinity;
  monsters.forEach(m => {
    if (!m.alive) return;
    const d = Math.hypot(m.x - me.x, m.y - me.y);
    if (d < bestDist && d < 400) { bestDist = d; nearest = m; }
  });

  if (nearest) {
    lastAutoAttack = now;
    if (bestDist > 50) {
      // Идём к нему
      const startX = Math.floor(me.x / TILE_SIZE);
      const startY = Math.floor(me.y / TILE_SIZE);
      const tx = Math.floor(nearest.x / TILE_SIZE);
      const ty = Math.floor(nearest.y / TILE_SIZE);
      const path = findPath(startX, startY, tx, ty);
      if (path) me.path = path;
    } else {
      attackMonster(nearest);
    }
  }
}

// Кнопка автобоя
function createAutoFightButton() {
  if (document.getElementById('autoFightBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'autoFightBtn';
  btn.textContent = '🤖 Автобой';
  btn.style.cssText = \`
    position: absolute; bottom: 60px; right: 15px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #8a2be2, #4a4aff);
    color: white; font-size: 14px; font-weight: bold;
    border: 2px solid #ffd700; border-radius: 8px;
    cursor: pointer; z-index: 100;
  \`;
  btn.onclick = toggleAutoFight;
  document.getElementById('gameScreen').appendChild(btn);
}

`;

  content = insertBefore(content, '// ============================================================\n//  СОКЕТЫ', code, 'monsters');

  // Спавн + кнопка в startGame
  content = content.replace(
    '  createHUDs();',
    `  createHUDs();
  spawnMonsters();
  createAutoFightButton();`
  );

  // Клик по мобу — в handleWorldClick
  content = content.replace(
    '  if (tile === TILE.WATER) { console.log(\'❌ Вода\'); return; }',
    `  // Клик по мобу?
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    attackMonster(clickedMonster);
    return;
  }

  if (tile === TILE.WATER) { console.log('❌ Вода'); return; }`
  );

  // Отрисовка мобов в draw()
  content = content.replace(
    '    players.forEach(p => {\n      if (p.id === myId) return;',
    `    drawMonsters(ctx, camera);

    players.forEach(p => {
      if (p.id === myId) return;`
  );

  // Автобой в renderLoop
  content = content.replace(
    '  updateHUDs();\n  draw();',
    '  updateAutoFight();\n  updateHUDs();\n  draw();'
  );

  content = addMarker(content, 'monsters');
  writeFile(MAIN_FILE, content);
  return true;
}