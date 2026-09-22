// install/18-tile-aggro.js — Атака только на своей клетке + рандом 2-5 мин
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'tile-aggro')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // Заменяем checkAggro — теперь атакует только если игрок на ТОЙ ЖЕ клетке
  content = content.replace(
    `function checkAggro() {
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

setInterval(checkAggro, 500);`,
    `// === АГРО: моб атакует только если игрок стоит на ТОЙ ЖЕ клетке ===
// + проверка раз в 2-5 минут рандомно, чтобы не грузить сервер

let lastAggroCheck = 0;
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

setInterval(checkTileAggro, 10000); // проверяем раз в 10 сек, но сработает раз в 2-5 мин`
  );

  content = addMarker(content, 'tile-aggro');
  writeFile(MAIN_FILE, content);
  return true;
}