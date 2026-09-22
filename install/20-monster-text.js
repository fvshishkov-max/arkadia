// install/20-monster-text.js — Мобы как подписи уровней + крупные клетки
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'monster-text')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. КЛЕТКИ В 2 РАЗА БОЛЬШЕ (48 → 96)
  // ============================================================
  content = content.replace(
    'const TILE_SIZE = 48;',
    'const TILE_SIZE = 96;'
  );

  // ============================================================
  // 2. МОБЫ ПОЛУЧАЮТ ДИАПАЗОН УРОВНЕЙ ±4-5
  // ============================================================
  // Обновляем spawnMonsters — добавляем каждому мобу levelMin и levelMax
  content = content.replace(
    `      monsters.push({
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
        biome: zone.biome,
        alive: true,
        respawnAt: 0
      });`,
    `      // Уровень моба ± 4-5 от базового
      const levelMin = Math.max(1, type.level - 4);
      const levelMax = type.level + 5;

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
        levelMin,
        levelMax,
        biome: zone.biome,
        alive: true,
        respawnAt: 0
      });`
  );

  // ============================================================
  // 3. НОВАЯ ОТРИСОВКА МОБОВ — без иконок, только подписи
  // ============================================================
  content = content.replace(
    /function drawMonsters\(ctx, camera\) \{[\s\S]*?^\}/m,
    `// Цвет по уровню моба
function getLevelColor(level) {
  if (level <= 5)   return { bg: 'rgba(50, 150, 50, 0.55)',  border: '#4ade80', text: '#aaffaa' };
  if (level <= 8)   return { bg: 'rgba(70, 170, 60, 0.55)',  border: '#84cc16', text: '#c8ff88' };
  if (level <= 12)  return { bg: 'rgba(140, 180, 50, 0.55)', border: '#a3e635', text: '#e8ff88' };
  if (level <= 16)  return { bg: 'rgba(200, 180, 50, 0.55)', border: '#facc15', text: '#ffea88' };
  if (level <= 20)  return { bg: 'rgba(220, 140, 40, 0.55)', border: '#f59e0b', text: '#ffcc88' };
  if (level <= 25)  return { bg: 'rgba(220, 80, 40, 0.55)',  border: '#ef4444', text: '#ff9988' };
  if (level <= 30)  return { bg: 'rgba(200, 40, 40, 0.55)',  border: '#dc2626', text: '#ff8888' };
  if (level <= 35)  return { bg: 'rgba(130, 60, 180, 0.55)', border: '#a855f7', text: '#e0b8ff' };
  if (level <= 42)  return { bg: 'rgba(90, 40, 140, 0.55)',  border: '#7c3aed', text: '#c8a8ff' };
  if (level <= 48)  return { bg: 'rgba(50, 40, 60, 0.7)',    border: '#4a4a5a', text: '#c0c0c0' };
  return              { bg: 'rgba(200, 160, 40, 0.65)', border: '#ffd700', text: '#fff4b0' };
}

function drawMonsters(ctx, camera) {
  monsters.forEach(m => {
    if (!m.alive) return;
    const px = m.x - camera.x;
    const py = m.y - camera.y;
    if (px < -TILE_SIZE || px > canvas.width + TILE_SIZE) return;
    if (py < -TILE_SIZE || py > canvas.height + TILE_SIZE) return;

    const half = TILE_SIZE / 2;
    const colors = getLevelColor(m.level);

    // Цветной квадрат на клетке
    ctx.fillStyle = colors.bg;
    ctx.fillRect(px - half + 2, py - half + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Рамка
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(px - half + 2, py - half + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Подпись: диапазон уровней (или один уровень если min == max)
    const lvlText = m.levelMin === m.levelMax 
      ? \`Ур. \${m.levelMin}\` 
      : \`Ур. \${m.levelMin}-\${m.levelMax}\`;

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Обводка
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(lvlText, px, py);

    // Основной текст
    ctx.fillStyle = colors.text;
    ctx.fillText(lvlText, px, py);

    // HP-бар (тонкий, снизу клетки)
    const hpW = TILE_SIZE - 8;
    const hpY = py + half - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px - hpW / 2, hpY, hpW, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - hpW / 2, hpY, hpW * (m.hp / m.maxHp), 5);

    // Иконка только если биом особый (боссы)
    // Обычные мобы — без иконок
  });
}`
  );

  // ============================================================
  // 4. ХИТБОКС МОБА — тоже увеличиваем с TILE_SIZE
  // ============================================================
  content = content.replace(
    `function findMonsterAt(worldX, worldY) {
  for (const m of monsters) {
    if (!m.alive) continue;
    if (Math.abs(worldX - m.x) < 16 && Math.abs(worldY - m.y) < 16) return m;
  }
  return null;
}`,
    `function findMonsterAt(worldX, worldY) {
  const half = TILE_SIZE / 2;
  for (const m of monsters) {
    if (!m.alive) continue;
    if (Math.abs(worldX - m.x) < half && Math.abs(worldY - m.y) < half) return m;
  }
  return null;
}`
  );

  content = addMarker(content, 'monster-text');
  writeFile(MAIN_FILE, content);
  return true;
}