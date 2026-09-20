// install/01-navigator.js — Навигатор (поиск клетки, травы, дерева)
import fs from 'fs';
import path from 'path';

const MARKER = '// === NAVIGATOR_INSTALLED ===';

export default async function install({ readFile, writeFile, replaceOnce }) {
  const file = 'client/js/main.js';
  let content = readFile(file);
  if (!content) {
    console.error('❌ client/js/main.js не найден');
    return false;
  }

  if (content.includes(MARKER)) {
    console.log('  ℹ️  Уже установлено, пропускаю');
    return false;
  }

  // 1. Состояние навигатора
  content = replaceOnce(
    content,
    `// === Отладка ===
window.DEBUG_TILES = false;`,
    `// === Отладка ===
window.DEBUG_TILES = false;

${MARKER}
let navTarget = null;`,
    'navigator state'
  );

  // 2. Функции навигатора — вставляем перед createHUDs
  const navCode = `
// ============================================================
//  НАВИГАТОР
// ============================================================

function createNavigatorPanel() {
  if (document.getElementById('navPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'navPanel';
  panel.style.cssText = \`
    position: absolute; top: 15px; right: 15px; width: 220px;
    background: rgba(15, 15, 30, 0.92); border: 2px solid #4a4aff;
    border-radius: 8px; padding: 12px; color: #eee;
    font-family: Arial, sans-serif; font-size: 13px;
    z-index: 150; box-shadow: 0 0 20px rgba(74, 74, 255, 0.4);
  \`;
  panel.innerHTML = \`
    <div style="font-weight: bold; color: #ffd700; margin-bottom: 8px; font-size: 14px;">
      🧭 Навигатор
    </div>
    <div style="margin-bottom: 8px;">
      <input id="navCellInput" type="number" placeholder="ID клетки..." 
        style="width: 100%; padding: 6px; background: #1a1a3e; 
        border: 1px solid #4a4aff; border-radius: 4px; color: #eee; 
        font-size: 12px; box-sizing: border-box;" />
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
      <button id="navFindGrass" style="padding: 6px; background: #2a6a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">🌿 Траву</button>
      <button id="navFindTree" style="padding: 6px; background: #3a5a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">🌲 Дерево</button>
      <button id="navFindBot" style="padding: 6px; background: #6a2a2a; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">👹 Бота</button>
      <button id="navReset" style="padding: 6px; background: #444; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">❌ Сброс</button>
    </div>
    <div id="navStatus" style="font-size: 11px; color: #888; padding-top: 6px; border-top: 1px solid #333; min-height: 16px;">Готов к поиску</div>
  \`;
  document.getElementById('gameScreen').appendChild(panel);

  document.getElementById('navCellInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const id = parseInt(e.target.value);
      if (isNaN(id) || id < 0 || id >= MAP_SIZE * MAP_SIZE) {
        setNavStatus('❌ Неверный ID', '#ff6666'); return;
      }
      const tx = id % MAP_SIZE;
      const ty = Math.floor(id / MAP_SIZE);
      goToTile(tx, ty, \`Клетка #\${id}\`);
    }
  });
  document.getElementById('navFindGrass').onclick = () => findNearest('grass');
  document.getElementById('navFindTree').onclick = () => findNearest('tree');
  document.getElementById('navFindBot').onclick = () => setNavStatus('👹 Боты скоро!', '#ffaa44');
  document.getElementById('navReset').onclick = () => resetNav();
}

function setNavStatus(text, color = '#888') {
  const el = document.getElementById('navStatus');
  if (el) { el.textContent = text; el.style.color = color; }
}

function resetNav() {
  navTarget = null;
  const me = players.get(myId) || character;
  if (me) me.path = null;
  setNavStatus('Сброшено', '#888');
  const inp = document.getElementById('navCellInput');
  if (inp) inp.value = '';
}

function goToTile(tx, ty, label) {
  if (currentScene !== 'world') {
    setNavStatus('❌ Сначала выйди из города', '#ff6666'); return;
  }
  if (!isWalkable(tx, ty)) {
    setNavStatus('❌ Клетка непроходима', '#ff6666'); return;
  }
  const me = players.get(myId) || character;
  if (!me) return;
  const startX = Math.floor(me.x / TILE_SIZE);
  const startY = Math.floor(me.y / TILE_SIZE);
  const path = findPath(startX, startY, tx, ty);
  if (!path) { setNavStatus('❌ Путь не найден', '#ff6666'); return; }
  if (path.length === 0) { setNavStatus('📍 Уже там', '#88ff88'); return; }
  me.path = path;
  navTarget = { x: tx, y: ty, label };
  const cellId = ty * MAP_SIZE + tx;
  setNavStatus(\`🎯 \${label} (#\${cellId}) — \${path.length} шагов\`, '#88ff88');
}

function findNearest(type) {
  if (currentScene !== 'world') {
    setNavStatus('❌ Сначала выйди из города', '#ff6666'); return;
  }
  const me = players.get(myId) || character;
  if (!me) return;
  const startX = Math.floor(me.x / TILE_SIZE);
  const startY = Math.floor(me.y / TILE_SIZE);
  let best = null, bestDist = Infinity;
  for (let ty = 0; ty < MAP_SIZE; ty++) {
    for (let tx = 0; tx < MAP_SIZE; tx++) {
      const tile = GAME_MAP[ty][tx];
      let match = false;
      if (type === 'grass') match = (tile === TILE.GRASS || tile === TILE.GRASS_DARK || tile === TILE.GRASS_LIGHT);
      else if (type === 'tree') match = (tile === TILE.TREE);
      if (!match) continue;
      const dist = Math.abs(tx - startX) + Math.abs(ty - startY);
      if (dist < bestDist && dist > 0) { bestDist = dist; best = { x: tx, y: ty }; }
    }
  }
  if (!best) { setNavStatus('❌ Ничего не найдено', '#ff6666'); return; }
  const label = type === 'grass' ? '🌿 Трава' : '🌲 Дерево';
  goToTile(best.x, best.y, label);
}

`;

  content = replaceOnce(
    content,
    `function createHUDs() {`,
    navCode + `function createHUDs() {`,
    'navigator functions'
  );

  // 3. Подсветка цели в drawWorldMap
  content = replaceOnce(
    content,
    `  // Маршрут (если есть)
  const me = players.get(myId) || character;`,
    `  // Подсветка цели навигатора
  if (navTarget) {
    const tx = navTarget.x * TILE_SIZE - camera.x;
    const ty = navTarget.y * TILE_SIZE - camera.y;
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    ctx.strokeStyle = \`rgba(255, 215, 0, \${0.5 + pulse * 0.5})\`;
    ctx.lineWidth = 3;
    ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.fillStyle = \`rgba(255, 215, 0, \${0.7 + pulse * 0.3})\`;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯', tx + TILE_SIZE / 2, ty - 4);
  }

  // Маршрут (если есть)
  const me = players.get(myId) || character;`,
    'nav target draw'
  );

  // 4. Вызов при старте
  content = replaceOnce(
    content,
    `  createHUDs();
  connectSocket();`,
    `  createHUDs();
  createNavigatorPanel();
  connectSocket();`,
    'call createNavigatorPanel'
  );

  // 5. Авто-очистка цели при достижении
  content = replaceOnce(
    content,
    `      if (dist < 2) {
        me.x = targetX;
        me.y = targetY;
        me.path.shift();
        if (me.path.length === 0) me.path = null;
      } else {`,
    `      if (dist < 2) {
        me.x = targetX;
        me.y = targetY;
        me.path.shift();
        if (me.path.length === 0) {
          me.path = null;
          if (navTarget) {
            setNavStatus(\`✅ Дошли: \${navTarget.label}\`, '#88ff88');
            navTarget = null;
          }
        }
      } else {`,
    'auto-clear target'
  );

  writeFile(file, content);
  return true;
}