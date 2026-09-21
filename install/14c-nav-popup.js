// install/14c-nav-popup.js — Навигатор как всплывающее окно
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'nav-popup')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: NAV POPUP (навигатор как всплывающее окно)
// ============================================================

let navPopupOpen = false;

function createNavButton() {
  if (document.getElementById('navToggleBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'navToggleBtn';
  btn.textContent = '🧭';
  btn.style.cssText = \`
    position: absolute; top: 15px; right: 15px;
    width: 50px; height: 50px;
    background: linear-gradient(135deg, #4a4aff, #8a2be2);
    color: white; font-size: 24px;
    border: 2px solid #ffd700; border-radius: 8px;
    cursor: pointer; z-index: 160;
    box-shadow: 0 0 15px rgba(74, 74, 255, 0.6);
  \`;
  btn.onclick = toggleNavPopup;
  document.getElementById('gameScreen').appendChild(btn);
}

function toggleNavPopup() {
  navPopupOpen = !navPopupOpen;
  const panel = document.getElementById('navPanel');
  if (panel) panel.style.display = navPopupOpen ? 'block' : 'none';
}

// Скрываем панель по умолчанию
function setupNavPopup() {
  const panel = document.getElementById('navPanel');
  if (panel) {
    panel.style.display = 'none';
    // Добавляем кнопку закрытия в панель
    if (!document.getElementById('navCloseBtn')) {
      const closeBtn = document.createElement('button');
      closeBtn.id = 'navCloseBtn';
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = \`
        position: absolute; top: 5px; right: 5px;
        width: 20px; height: 20px;
        background: transparent; color: #888;
        border: none; cursor: pointer; font-size: 14px;
      \`;
      closeBtn.onclick = () => { navPopupOpen = false; panel.style.display = 'none'; };
      panel.style.position = 'absolute';
      panel.appendChild(closeBtn);
    }
  }
  createNavButton();
}

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) return false;
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — добавляем кнопку и скрываем панель
  content = content.replace(
    '  createNavigatorPanel();',
    `  createNavigatorPanel();
  setupNavPopup();`
  );

  content = addMarker(content, 'nav-popup');
  writeFile(MAIN_FILE, content);
  return true;
}