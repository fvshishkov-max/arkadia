// install/10-fix-stats.js — фикс: stats внутри startGame, а не глобально
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;

  if (hasMarker(content, 'fix-stats')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }

  backup(MAIN_FILE);

  // Удаляем глобальный вызов — заменяем на "пустышку"
  content = content.replace(
    `// Статы персонажа (загружаются с сервера)
character.stats = character.stats || {
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  exp: 0,
  expNext: 100,
  level: 1,
  str: 5, agi: 5, int: 5, vit: 5, luck: 5,
  freePoints: 0,
  gold: 0
};`,
    `// Статы инициализируются в startGame() после логина
function initStats() {
  character.stats = character.stats || {
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    exp: 0,
    expNext: 100,
    level: 1,
    str: 5, agi: 5, int: 5, vit: 5, luck: 5,
    freePoints: 0,
    gold: 0
  };
}`
  );

  // Также защищаем функции, которые используют character.stats
  content = content.replace(
    `function recalcMaxHP() {
  const s = character.stats;`,
    `function recalcMaxHP() {
  if (!character || !character.stats) return;
  const s = character.stats;`
  );

  content = content.replace(
    `function gainExp(amount) {
  const s = character.stats;`,
    `function gainExp(amount) {
  if (!character || !character.stats) return;
  const s = character.stats;`
  );

  content = content.replace(
    `function takeDamage(amount) {
  const s = character.stats;`,
    `function takeDamage(amount) {
  if (!character || !character.stats) return;
  const s = character.stats;`
  );

  content = content.replace(
    `function updateStatsHUD() {
  const s = character.stats;`,
    `function updateStatsHUD() {
  if (!character || !character.stats) return;
  const s = character.stats;`
  );

  // В startGame — вызываем initStats ПЕРВЫМ делом
  content = content.replace(
    `  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');`,
    `  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  initStats();  // инициализация статов после логина`
  );

  content = addMarker(content, 'fix-stats');
  writeFile(MAIN_FILE, content);
  return true;
}