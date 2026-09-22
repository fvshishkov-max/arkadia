// install/23-portal-fix.js — Портал на всю клетку + авто-меню + быстрый агро
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'portal-fix')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. ПОРТАЛ — КЛИК НА ВСЮ КЛЕТКУ (не 20px)
  // ============================================================
  content = content.replace(
    `function findTeleportAt(worldX, worldY) {
  for (const t of TELEPORTS) {
    const px = t.tileX * TILE_SIZE + TILE_SIZE / 2;
    const py = t.tileY * TILE_SIZE + TILE_SIZE / 2;
    if (Math.abs(worldX - px) < 20 && Math.abs(worldY - py) < 20) return t;
  }
  return null;
}`,
    `function findTeleportAt(worldX, worldY) {
  const half = TILE_SIZE / 2;
  for (const t of TELEPORTS) {
    const px = t.tileX * TILE_SIZE + half;
    const py = t.tileY * TILE_SIZE + half;
    if (Math.abs(worldX - px) < half && Math.abs(worldY - py) < half) return t;
  }
  return null;
}`
  );

  // ============================================================
  // 2. АВТО-МЕНЮ ПРИ ВХОДЕ НА ПОРТАЛ
  // ============================================================
  // Добавим проверку в renderLoop после движения игрока
  content = content.replace(
    `  updateHUDs();
  draw();
  requestAnimationFrame(renderLoop);`,
    `  // Проверка входа на портал — автоматически открываем меню
  if (currentScene === 'world' && !teleportMenuOpen && !battle) {
    const me = players.get(myId) || character;
    if (me) {
      const tp = findTeleportAt(me.x, me.y);
      if (tp) {
        // Запоминаем что уже открывали для этой клетки
        if (!me._lastPortalId || me._lastPortalId !== tp.id) {
          me._lastPortalId = tp.id;
          setTimeout(() => {
            if (!teleportMenuOpen) openTeleportMenu(tp);
          }, 300);
        }
      } else {
        me._lastPortalId = null;
      }
    }
  }

  updateHUDs();
  draw();
  requestAnimationFrame(renderLoop);`
  );

  // Обновим openTeleportMenu — теперь меню открывается ВСЕГДА, но с правильным заголовком
  content = content.replace(
    `function openTeleportMenu(fromTeleport) {
  if (teleportMenuOpen) return;
  teleportMenuOpen = true;`,
    `function openTeleportMenu(fromTeleport) {
  if (teleportMenuOpen) return;
  if (currentScene !== 'world') return;
  teleportMenuOpen = true;`
  );

  // ============================================================
  // 3. АГРО: быстрое срабатывание (30-90 сек) + логи
  // ============================================================
  content = content.replace(
    `let lastAggroCheck = 0;
let nextAggroDelay = 120000 + Math.random() * 180000; // 2-5 минут

function checkTileAggro() {
  if (battle) return;
  if (currentScene !== 'world') return;
  const me = players.get(myId) || character;
  if (!me) return;

  const now = Date.now();
  if (now - lastAggroCheck < nextAggroDelay) return;
  lastAggroCheck = now;
  // Пересчитываем следующую задержку (2-5 мин)
  nextAggroDelay = 120000 + Math.random() * 180000;

  // Клетка игрока
  const myTileX = Math.floor(me.x / TILE_SIZE);
  const myTileY = Math.floor(me.y / TILE_SIZE);

  // Ищем мобов на ТОЙ ЖЕ клетке
  const sameTileMonsters = monsters.filter(m => {
    if (!m.alive) return false;
    const mTileX = Math.floor(m.x / TILE_SIZE);
    const mTileY = Math.floor(m.y / TILE_SIZE);
    return mTileX === myTileX && mTileY === myTileY;
  });

  if (sameTileMonsters.length > 0) {
    console.log(\`⚔️ Проверка агрессии: на клетке \${sameTileMonsters.length} моб(ов)\`);
    startBattle(sameTileMonsters[0]);
  }
}

setInterval(checkTileAggro, 10000); // проверяем раз в 10 сек, но сработает раз в 2-5 мин`,
    `let lastAggroCheck = 0;
let nextAggroDelay = 30000 + Math.random() * 60000; // 30-90 сек для теста

function checkTileAggro() {
  if (battle) return;
  if (currentScene !== 'world') return;
  const me = players.get(myId) || character;
  if (!me) return;

  const now = Date.now();

  // Клетка игрока
  const myTileX = Math.floor(me.x / TILE_SIZE);
  const myTileY = Math.floor(me.y / TILE_SIZE);

  // Ищем мобов на ТОЙ ЖЕ клетке
  const sameTileMonsters = monsters.filter(m => {
    if (!m.alive) return false;
    const mTileX = Math.floor(m.x / TILE_SIZE);
    const mTileY = Math.floor(m.y / TILE_SIZE);
    return mTileX === myTileX && mTileY === myTileY;
  });

  // Если мобов нет — сбрасываем таймер
  if (sameTileMonsters.length === 0) {
    lastAggroCheck = now;
    return;
  }

  // Если стоим на мобе — ждём таймер
  if (now - lastAggroCheck < nextAggroDelay) {
    // Логируем раз в 5 сек для отладки
    if (!me._lastAggroLog || now - me._lastAggroLog > 5000) {
      me._lastAggroLog = now;
      const remaining = Math.ceil((nextAggroDelay - (now - lastAggroCheck)) / 1000);
      console.log(\`⏳ На клетке \${sameTileMonsters.length} моб(ов). Бой через ~\${remaining} сек\`);
    }
    return;
  }

  // Время пришло — начинаем бой
  lastAggroCheck = now;
  nextAggroDelay = 30000 + Math.random() * 60000;
  console.log(\`⚔️ Начинаю бой! На клетке \${sameTileMonsters.length} моб(ов)\`);
  startBattle(sameTileMonsters[0]);
}

setInterval(checkTileAggro, 3000); // проверяем раз в 3 сек`
  );

  content = addMarker(content, 'portal-fix');
  writeFile(MAIN_FILE, content);
  return true;
}