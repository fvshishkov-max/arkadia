// install/21-monster-fix.js — Вход на клетку моба + имя моба
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'monster-fix')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // ============================================================
  // 1. УБИРАЕМ БЛОКИРОВКУ КЛИКА ПО МОБУ — теперь идём на клетку
  // ============================================================
  content = content.replace(
    `  // Клик по мобу — теперь просто подсветка, бой начнётся сам при сближении
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    setNavStatus(\`⚔️ \${clickedMonster.name} — подойди ближе для боя\`, '#ffaa44');
    return;
  }`,
    `  // Клик по мобу — теперь просто выделяем и ИДЁМ на его клетку
  const clickedMonster = findMonsterAt(worldX, worldY);
  if (clickedMonster) {
    selectedMonster = clickedMonster;
    setNavStatus(\`⚔️ Иду к \${clickedMonster.name} (ур. \${clickedMonster.level}) — встань на клетку для боя\`, '#ffaa44');
    // НЕ выходим — идём дальше к pathfinding
  }`
  );

  // ============================================================
  // 2. ДОБАВЛЯЕМ ИМЯ МОБА ПОД УРОВНЕМ
  // ============================================================
  content = content.replace(
    `    // Подпись: диапазон уровней (или один уровень если min == max)
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
    ctx.fillText(lvlText, px, py);`,
    `    // Подпись: диапазон уровней (или один уровень если min == max)
    const lvlText = m.levelMin === m.levelMax 
      ? \`Ур. \${m.levelMin}\` 
      : \`Ур. \${m.levelMin}-\${m.levelMax}\`;

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Обводка для уровня
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(lvlText, px, py - 10);

    // Основной текст уровня
    ctx.fillStyle = colors.text;
    ctx.fillText(lvlText, px, py - 10);

    // Имя моба (под уровнем, меньше шрифтом)
    ctx.font = 'bold 13px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(m.name, px, py + 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(m.name, px, py + 12);`
  );

  // ============================================================
  // 3. HP-БАР СДВИГАЕМ ЧУТЬ НИЖЕ
  // ============================================================
  content = content.replace(
    `    // HP-бар (тонкий, снизу клетки)
    const hpW = TILE_SIZE - 8;
    const hpY = py + half - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px - hpW / 2, hpY, hpW, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - hpW / 2, hpY, hpW * (m.hp / m.maxHp), 5);`,
    `    // HP-бар (тонкий, снизу клетки)
    const hpW = TILE_SIZE - 8;
    const hpY = py + half - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(px - hpW / 2, hpY, hpW, 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - hpW / 2, hpY, hpW * (m.hp / m.maxHp), 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - hpW / 2, hpY, hpW, 6);`
  );

  content = addMarker(content, 'monster-fix');
  writeFile(MAIN_FILE, content);
  return true;
}