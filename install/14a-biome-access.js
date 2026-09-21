// install/14a-biome-access.js — Разрешить проход во все биомы
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'biome-access')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // Отключаем блокировку по уровню — только показываем подсказку
  content = content.replace(
    `  if (lvl < biome.level) {
    setNavStatus(\`🔒 Нужен ур. \${biome.level} для \${biome.name}\`, '#ff6666');
    return { ok: false, biome };
  }`,
    `  // Блокировка отключена — можно ходить везде, но показываем предупреждение
  if (lvl < biome.level) {
    setNavStatus(\`⚠️ \${biome.name}: рекомендован ур. \${biome.level}+\`, '#ffaa44');
  }`
  );

  content = addMarker(content, 'biome-access');
  writeFile(MAIN_FILE, content);
  return true;
}