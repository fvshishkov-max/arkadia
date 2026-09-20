// install/09-minimap.js — Мини-карта
export default async function install({ readFile, writeFile, backup, insertBefore, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'minimap')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: MINIMAP
// ============================================================

function createMinimap() {
  if (document.getElementById('minimapContainer')) return;
  const container = document.createElement('div');
  container.id = 'minimapContainer';
  container.style.cssText = \`
    position: absolute; bottom: 15px; right: 15px;
    width: 200px; height: 200px;
    background: rgba(10, 10, 25, 0.9);
    border: 2px solid #4a4aff; border-radius: 8px;
    overflow: hidden; z-index: 100;
  \`;
  const cv = document.createElement('canvas');
  cv.id = 'minimapCanvas';
  cv.width = 200;
  cv.height = 200;
  cv.style.cssText = 'display:block;';
  container.appendChild(cv);
  document.getElementById('gameScreen').appendChild(container);
}

function drawMinimap() {
  const cv = document.getElementById('minimapCanvas');
  if (!cv) return;
  const mctx = cv.getContext('2d');
  const scale = 200 / (MAP_SIZE * TILE_SIZE); // 200px / мир

  // Фон
  mctx.fillStyle = '#0a0a1a';
  mctx.fillRect(0, 0, 200, 200);

  // Тайлы (каждый 4-й для скорости)
  for (let ty = 0; ty < MAP_SIZE; ty += 2) {
    for (let tx = 0; tx < MAP_SIZE; tx += 2) {
      const tile = GAME_MAP[ty][tx];
      const col = TILE_COLORS[tile];
      mctx.fillStyle = col;
      mctx.fillRect(
        tx * TILE_SIZE * scale,
        ty * TILE_SIZE * scale,
        TILE_SIZE * scale * 2 + 1,
        TILE_SIZE * scale * 2 + 1
      );
    }
  }

  // Города — метки
  CITIES.forEach(city => {
    mctx.fillStyle = city.color;
    mctx.beginPath();
    mctx.arc(
      city.tileX * TILE_SIZE * scale,
      city.tileY * TILE_SIZE * scale,
      4, 0, Math.PI * 2
    );
    mctx.fill();
    mctx.strokeStyle = 'black';
    mctx.lineWidth = 1;
    mctx.stroke();
  });

  // Мобы (если модуль установлен)
  if (typeof monsters !== 'undefined' && monsters) {
    mctx.fillStyle = '#ff4444';
    monsters.forEach(m => {
      if (!m.alive) return;
      mctx.fillRect(
        m.x * scale - 1, m.y * scale - 1, 2, 2
      );
    });
  }

  // Игрок
  const me = players.get(myId) || character;
  if (me) {
    mctx.fillStyle = '#ffd700';
    mctx.beginPath();
    mctx.arc(me.x * scale, me.y * scale, 3, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 1;
    mctx.stroke();
  }

  // Цель навигатора
  if (navTarget) {
    mctx.strokeStyle = '#00ff00';
    mctx.lineWidth = 2;
    mctx.strokeRect(
      navTarget.x * TILE_SIZE * scale - 2,
      navTarget.y * TILE_SIZE * scale - 2,
      6, 6
    );
  }

  // Обводка
  mctx.strokeStyle = '#4a4aff';
  mctx.lineWidth = 2;
  mctx.strokeRect(0, 0, 200, 200);
}

// Обновляем миникарту каждые 200 мс
setInterval(drawMinimap, 200);

`;

  content = insertBefore(content, '// ============================================================\n//  СОКЕТЫ', code, 'minimap');

  content = content.replace(
    '  createHUDs();',
    `  createHUDs();
  createMinimap();`
  );

  content = addMarker(content, 'minimap');
  writeFile(MAIN_FILE, content);
  return true;
}