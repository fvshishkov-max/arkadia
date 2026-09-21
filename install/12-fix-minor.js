// install/12-fix-minor.js — favicon + чистка логов
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'fix-minor')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  // 1. Чистим spam-логи про путь в handleWorldClick
  content = content.replace(
    `  if (path && path.length > 0) {
    me.path = path;
    console.log(\`🗺️ Путь: \${path.length} шагов\`);
  } else if (path && path.length === 0) {`,
    `  if (path && path.length > 0) {
    me.path = path;
    // Тихо, без спама
  } else if (path && path.length === 0) {`
  );

  // 2. Добавляем связь биомов с уровнем в HUD (при входе в биом)
  content = content.replace(
    `function checkBiomeAccess(tx, ty) {`,
    `let lastBiome = null;

function checkBiomeAccess(tx, ty) {`
  );

  content = content.replace(
    `  if (lvl < biome.level) {
    setNavStatus(\`🔒 Нужен ур. \${biome.level} для \${biome.name}\`, '#ff6666');
    return { ok: false, biome };
  }
  return { ok: true, biome };`,
    `  if (lvl < biome.level) {
    setNavStatus(\`🔒 Нужен ур. \${biome.level} для \${biome.name}\`, '#ff6666');
    return { ok: false, biome };
  }
  if (biome.id !== lastBiome) {
    lastBiome = biome.id;
    setNavStatus(\`\${biome.icon} \${biome.name} (Ур. \${biome.level}+)\`, '#88ff88');
  }
  return { ok: true, biome };`
  );

  content = addMarker(content, 'fix-minor');
  writeFile(MAIN_FILE, content);
  return true;
}