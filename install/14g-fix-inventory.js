// install/14g-fix-inventory.js — фикс: equipment внутри startGame
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'fix-inventory')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  // Убираем глобальное присваивание equipment — оборачиваем в функцию
  content = content.replace(
    `// Экипировка
character.equipment = character.equipment || {
  head: null, body: null, legs: null, boots: null,
  weapon: null, shield: null, ring: null, amulet: null
};`,
    `// Экипировка инициализируется в startGame() после логина
function initEquipment() {
  if (!character) return;
  character.equipment = character.equipment || {
    head: null, body: null, legs: null, boots: null,
    weapon: null, shield: null, ring: null, amulet: null
  };
}`
  );

  // В startGame — вызываем initEquipment
  content = content.replace(
    '  initStats();  // инициализация статов после логина',
    `  initStats();  // инициализация статов после логина
  initEquipment();  // инициализация экипировки`
  );

  // Защищаем renderInventoryV2 от null
  content = content.replace(
    `function renderInventoryV2() {
  const panel = document.getElementById('invV2Panel');
  if (!panel) return;

  const s = character.stats || { hp: 0, maxHp: 100, level: 1, gold: 0 };
  const eq = character.equipment;`,
    `function renderInventoryV2() {
  const panel = document.getElementById('invV2Panel');
  if (!panel) return;
  if (!character || !character.equipment) return;

  const s = character.stats || { hp: 0, maxHp: 100, level: 1, gold: 0 };
  const eq = character.equipment;`
  );

  content = addMarker(content, 'fix-inventory');
  writeFile(MAIN_FILE, content);
  return true;
}