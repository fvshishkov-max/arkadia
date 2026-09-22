// install/15-ui-overhaul.js — Полный экран: карта, инвентарь-страница, бег мобов
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'ui-overhaul')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. МОБЫ БЕГАЮТ
  // ============================================================
  content = content.replace(
    `function respawnMonsters() {
  monsters.forEach(m => {
    if (!m.alive && Date.now() >= m.respawnAt) {
      m.alive = true;
      m.hp = m.maxHp;
    }
  });
}

setInterval(respawnMonsters, 3000);`,
    `function respawnMonsters() {
  monsters.forEach(m => {
    if (!m.alive && Date.now() >= m.respawnAt) {
      m.alive = true;
      m.hp = m.maxHp;
    }
  });
}

setInterval(respawnMonsters, 3000);

// === ДВИЖЕНИЕ МОБОВ ===
// Каждый моб имеет патрулирование вокруг своей точки спавна
function updateMonsters(dt) {
  const me = players.get(myId) || character;
  monsters.forEach(m => {
    if (!m.alive) return;

    // Сохраняем "домашнюю" точку
    if (!m.homeX) { m.homeX = m.x; m.homeY = m.y; }
    if (!m.wanderAngle) m.wanderAngle = Math.random() * Math.PI * 2;
    if (!m.wanderTimer) m.wanderTimer = 0;
    if (!m.dir) m.dir = { x: 0, y: 0 };
    if (!m.dirTimer) m.dirTimer = 0;

    // Агро: если игрок близко (< 150px) — идём к нему
    if (me) {
      const distToPlayer = Math.hypot(me.x - m.x, me.y - m.y);
      if (distToPlayer < 150 && distToPlayer > 30) {
        const dx = (me.x - m.x) / distToPlayer;
        const dy = (me.y - m.y) / distToPlayer;
        const speed = 40 * dt;
        m.x += dx * speed;
        m.y += dy * speed;
        return;
      }
    }

    // Патрулирование (wander)
    m.wanderTimer -= dt;
    if (m.wanderTimer <= 0) {
      // Меняем направление
      m.wanderAngle += (Math.random() - 0.5) * Math.PI;
      m.wanderTimer = 1 + Math.random() * 2;
    }

    // Двигаемся от дома не дальше чем 100px
    const distFromHome = Math.hypot(m.x - m.homeX, m.y - m.homeY);
    let moveAngle = m.wanderAngle;
    if (distFromHome > 100) {
      // Возвращаемся домой
      moveAngle = Math.atan2(m.homeY - m.y, m.homeX - m.x);
    }

    const speed = 25 * dt;
    const nx = m.x + Math.cos(moveAngle) * speed;
    const ny = m.y + Math.sin(moveAngle) * speed;

    // Проверяем проходимость
    const tx = Math.floor(nx / TILE_SIZE);
    const ty = Math.floor(ny / TILE_SIZE);
    if (tx >= 0 && tx < MAP_SIZE && ty >= 0 && ty < MAP_SIZE) {
      const tile = GAME_MAP[ty][tx];
      if (tile !== TILE.WATER && tile !== TILE.CITY_GROUND && tile !== TILE.LAVA) {
        m.x = nx;
        m.y = ny;
      } else {
        // Отскок — меняем угол
        m.wanderAngle += Math.PI * 0.7;
        m.wanderTimer = 0;
      }
    }
  });
}`
  );

  // Вызов updateMonsters в renderLoop
  content = content.replace(
    '  updateAutoFight();\n  updateHUDs();',
    '  updateMonsters(dt);\n  updateAutoFight();\n  updateHUDs();'
  );

  // ============================================================
  // 2. CANVAS НА ВЕСЬ ЭКРАН
  // ============================================================
  content = content.replace(
    `  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');`,
    `  canvas = document.getElementById('gameCanvas');
  // Растягиваем canvas на всё окно
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  ctx = canvas.getContext('2d');`
  );

  // ============================================================
  // 3. ИНВЕНТАРЬ — ПОЛНОЭКРАННАЯ СТРАНИЦА
  // ============================================================
  content = content.replace(
    `function createInventoryV2() {
  if (document.getElementById('invV2Panel')) return;
  const panel = document.createElement('div');
  panel.id = 'invV2Panel';
  panel.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 720px; height: 520px;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #4a4aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-shadow: 0 0 50px rgba(74, 74, 255, 0.7);
  \`;
  document.getElementById('gameScreen').appendChild(panel);
  renderInventoryV2();
}`,
    `function createInventoryV2() {
  if (document.getElementById('invV2Panel')) return;
  const panel = document.createElement('div');
  panel.id = 'invV2Panel';
  panel.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #0a0a1a 0%, #15152e 100%);
    padding: 30px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 300; display: none;
    box-sizing: border-box;
    overflow-y: auto;
  \`;
  document.getElementById('gameScreen').appendChild(panel);
  renderInventoryV2();
}`
  );

  // ============================================================
  // 4. CSS для gameScreen — убрать центрирование
  // ============================================================
  // Добавляем стили через JS
  content = content.replace(
    'function startGame() {',
    `function applyFullscreenStyles() {
  const gs = document.getElementById('gameScreen');
  if (gs) {
    gs.style.cssText = 'position:absolute;top:0;left:0;width:100vw;height:100vh;background:#000;';
  }
  const cv = document.getElementById('gameCanvas');
  if (cv) {
    cv.style.cssText = 'display:block;background:#1a3a1a;image-rendering:pixelated;';
  }
}

function startGame() {`
  );

  content = content.replace(
    `  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');`,
    `  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  applyFullscreenStyles();`
  );

  content = addMarker(content, 'ui-overhaul');
  writeFile(MAIN_FILE, content);
  return true;
}