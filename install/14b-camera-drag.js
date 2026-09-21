// install/14b-camera-drag.js — Перетаскивание камеры мышью
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'camera-drag')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: CAMERA DRAG (перетаскивание карты мышью)
// ============================================================

let dragState = { active: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0, moved: false };
let cameraFree = false;   // камера отвязана от игрока
let cameraReturnTimer = null;

function setupCameraDrag() {
  if (!canvas) return;

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 2) return; // только правая кнопка мыши
    e.preventDefault();
    dragState.active = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.camStartX = camera.x;
    dragState.camStartY = camera.y;
    dragState.moved = false;
    cameraFree = true;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!dragState.active) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
    camera.x = dragState.camStartX - dx;
    camera.y = dragState.camStartY - dy;
    // Ограничения
    camera.x = Math.max(-100, Math.min(WORLD_SIZE - canvas.width + 100, camera.x));
    camera.y = Math.max(-100, Math.min(WORLD_SIZE - canvas.height + 100, camera.y));
  });

  window.addEventListener('mouseup', e => {
    if (e.button !== 2) return;
    dragState.active = false;
    canvas.style.cursor = 'default';
    // Возврат к игроку через 3 сек
    if (cameraReturnTimer) clearTimeout(cameraReturnTimer);
    cameraReturnTimer = setTimeout(() => {
      cameraFree = false;
    }, 3000);
  });

  // Блокируем контекстное меню на правую кнопку
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Левая кнопка — если была drag (сдвиг) — не кликаем
  canvas.addEventListener('click', e => {
    if (dragState.moved) {
      dragState.moved = false;
      e.stopPropagation();
      return;
    }
  }, true);
}

// В renderLoop — если камера свободна, не следуем за игроком
`;

  // Вставляем код перед блоком СОКЕТЫ
  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) return false;
  content = content.replace(anchor, code + '\n' + anchor);

  // В renderLoop — не следуем за игроком, если cameraFree
  content = content.replace(
    `    if (me) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;`,
    `    if (me && !cameraFree) {
      camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
      camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;`
  );

  // В startGame — вызываем setupCameraDrag
  content = content.replace(
    '  createHUDs();',
    `  createHUDs();
  setupCameraDrag();`
  );

  content = addMarker(content, 'camera-drag');
  writeFile(MAIN_FILE, content);
  return true;
}