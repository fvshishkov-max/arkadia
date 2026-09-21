// install/13-teleports.js — Телепорты между биомами
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'teleports')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: TELEPORTS (порталы между биомами)
// ============================================================

// Портал в каждом биоме
const TELEPORTS = [
  { id: 'meadow',  name: '🌸 Луг',             biome: 'meadow',   tileX: 45, tileY: 45, cost: 0,    icon: '🌸' },
  { id: 'edge',    name: '🌱 Опушка',          biome: 'edge',     tileX: 15, tileY: 15, cost: 10,   icon: '🌱' },
  { id: 'forest',  name: '🌲 Тёмный бор',      biome: 'forest',   tileX: 22, tileY: 65, cost: 25,   icon: '🌲' },
  { id: 'river',   name: '🏞️ Речная долина',   biome: 'river',    tileX: 50, tileY: 75, cost: 50,   icon: '🏞️' },
  { id: 'swamp',   name: '🍄 Болото',          biome: 'swamp',    tileX: 15, tileY: 85, cost: 100,  icon: '🍄' },
  { id: 'desert',  name: '🏜️ Пустошь',         biome: 'desert',   tileX: 80, tileY: 70, cost: 150,  icon: '🏜️' },
  { id: 'tropic',  name: '🌴 Тропики',         biome: 'tropic',   tileX: 85, tileY: 40, cost: 250,  icon: '🌴' },
  { id: 'north',   name: '❄️ Северный лес',    biome: 'north',    tileX: 50, tileY: 15, cost: 400,  icon: '❄️' },
  { id: 'volcano', name: '🌋 Вулкан',          biome: 'volcano',  tileX: 82, tileY: 15, cost: 600,  icon: '🌋' },
  { id: 'mountain',name: '🏔️ Горы',            biome: 'mountain', tileX: 15, tileY: 45, cost: 900,  icon: '🏔️' },
  { id: 'magic',   name: '🌌 Волшебный сад',   biome: 'magic',    tileX: 50, tileY: 35, cost: 1500, icon: '🌌' }
];

let teleportMenuOpen = false;

function findTeleportAt(worldX, worldY) {
  for (const t of TELEPORTS) {
    const px = t.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = t.tileY * TILE_SIZE + TILE_SIZE / 2;
    if (Math.abs(worldX - px) < 20 && Math.abs(worldY - py) < 20) return t;
  }
  return null;
}

function drawTeleports(ctx, camera) {
  TELEPORTS.forEach(t => {
    const px = t.tileX * TILE_SIZE - camera.x;
    const py = t.tileY * TILE_SIZE - camera.y;
    if (px < -60 || px > canvas.width + 60) return;
    if (py < -60 || py > canvas.height + 60) return;

    // Вращающийся круг
    const t2 = Date.now() / 500;
    const pulse = (Math.sin(t2) + 1) / 2;

    // Внешнее кольцо
    ctx.strokeStyle = \`rgba(138, 90, 255, \${0.6 + pulse * 0.4})\`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 14 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Внутреннее кольцо
    ctx.strokeStyle = 'rgba(200, 150, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Ядро
    ctx.fillStyle = \`rgba(200, 150, 255, \${0.5 + pulse * 0.5})\`;
    ctx.beginPath();
    ctx.arc(px + 16, py + 16, 5, 0, Math.PI * 2);
    ctx.fill();

    // Иконка
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t.icon, px + 16, py - 6);

    // Стоимость
    if (t.cost > 0) {
      ctx.font = 'bold 10px Arial';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.strokeText(\`\${t.cost}💰\`, px + 16, py + 40);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(\`\${t.cost}💰\`, px + 16, py + 40);
    }
  });
}

function openTeleportMenu(fromTeleport) {
  if (teleportMenuOpen) return;
  teleportMenuOpen = true;

  const panel = document.createElement('div');
  panel.id = 'teleportMenu';
  panel.style.cssText = \`
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; max-height: 80vh; overflow-y: auto;
    background: rgba(10, 10, 25, 0.98);
    border: 3px solid #8a5aff; border-radius: 12px;
    padding: 20px; color: #eee;
    font-family: Arial, sans-serif; font-size: 14px;
    z-index: 300;
    box-shadow: 0 0 50px rgba(138, 90, 255, 0.7);
  \`;

  const s = character.stats;
  let html = \`<div style="font-weight:bold;color:#8a5aff;margin-bottom:12px;font-size:18px;">🌀 Телепорт: \${fromTeleport.name}</div>\`;
  html += \`<div style="font-size:12px;color:#888;margin-bottom:12px;">У вас: <span style="color:#ffd700">\${s.gold}💰</span></div>\`;
  html += \`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">\`;

  TELEPORTS.forEach(t => {
    if (t.id === fromTeleport.id) return;
    const canAfford = s.gold >= t.cost;
    const bg = canAfford ? '#2a4a6a' : '#333';
    const cursor = canAfford ? 'pointer' : 'not-allowed';
    const color = canAfford ? 'white' : '#666';
    html += \`
      <div onclick="\${canAfford ? \`window.doTeleport('\${t.id}')\` : ''}" 
        style="background:\${bg};border:1px solid #4a4aff;border-radius:6px;padding:10px;cursor:\${cursor};color:\${color};">
        <div style="font-size:16px;">\${t.icon} \${t.name}</div>
        <div style="font-size:11px;color:#ffd700;">\${t.cost === 0 ? 'Бесплатно' : t.cost + '💰'}</div>
      </div>
    \`;
  });

  html += \`</div>\`;
  html += \`<div style="margin-top:16px;text-align:center;font-size:11px;color:#888;">
    <button onclick="window.closeTeleportMenu()" style="padding:8px 20px;background:#444;color:white;border:none;border-radius:6px;cursor:pointer;">Закрыть</button>
  </div>\`;

  panel.innerHTML = html;
  document.getElementById('gameScreen').appendChild(panel);
}

window.closeTeleportMenu = function() {
  teleportMenuOpen = false;
  const el = document.getElementById('teleportMenu');
  if (el) el.remove();
};

window.doTeleport = function(targetId) {
  const me = players.get(myId) || character;
  if (!me) return;
  const fromT = findTeleportAt(me.x, me.y);
  const toT = TELEPORTS.find(t => t.id === targetId);
  if (!toT) return;
  const s = character.stats;

  if (s.gold < toT.cost) {
    setNavStatus('❌ Не хватает золота', '#ff6666');
    window.closeTeleportMenu();
    return;
  }

  s.gold -= toT.cost;
  updateStatsHUD();
  me.x = toT.tileX * TILE_SIZE + TILE_SIZE / 2;
  me.y = toT.tileY * TILE_SIZE + TILE_SIZE / 2;
  me.path = null;
  camera.x = me.x - canvas.width / 2;
  camera.y = me.y - canvas.height / 2;
  if (socket) socket.emit('move', { x: me.x, y: me.y });
  setNavStatus(\`🌀 Телепорт: \${toT.name}\`, '#8a5aff');
  window.closeTeleportMenu();
  console.log(\`🌀 Телепорт в \${toT.name}, потрачено \${toT.cost}💰\`);
};

`;

  // Вставляем код перед блоком СОКЕТЫ
  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (content.includes(anchor)) {
    content = content.replace(anchor, code + '\n' + anchor);
  } else {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }

  // Клик по телепорту в handleWorldClick
  content = content.replace(
    `  // Проверка доступа к биому
  const access = checkBiomeAccess(tileX, tileY);
  if (!access.ok) return;`,
    `  // Клик по телепорту?
  const tp = findTeleportAt(worldX, worldY);
  if (tp) {
    openTeleportMenu(tp);
    return;
  }

  // Проверка доступа к биому
  const access = checkBiomeAccess(tileX, tileY);
  if (!access.ok) return;`
  );

  // Отрисовка телепортов в draw()
  content = content.replace(
    '    drawMonsters(ctx, camera);',
    '    drawTeleports(ctx, camera);\n    drawMonsters(ctx, camera);'
  );

  content = addMarker(content, 'teleports');
  writeFile(MAIN_FILE, content);
  return true;
}