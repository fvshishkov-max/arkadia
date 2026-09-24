// install/27-city-districts.js — Города с 3 районами + NPC
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'city-districts')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: CITY DISTRICTS (города с 3 районами + NPC)
// ============================================================

// Текущий район каждого города
let currentDistrict = 0;

// Определение районов для каждого города
const DISTRICTS = {
  valencia: [
    {
      name: '🏛️ Главная площадь',
      buildings: [
        { id: 'townhall',  name: 'Ратуша',     icon: '🏛️', x: 400, y: 250, color: '#d4af37' },
        { id: 'fountain',  name: 'Фонтан',     icon: '⛲', x: 600, y: 350, color: '#4a8aff' }
      ],
      npcs: [
        { id: 'mayor',  name: 'Мэр',      icon: '👨‍💼', x: 350, y: 400, color: '#d4af37' }
      ]
    },
    {
      name: '🛒 Рынок',
      buildings: [
        { id: 'shop',    name: 'Торговец',  icon: '🛒', x: 300, y: 250, color: '#B8860B' },
        { id: 'bank',    name: 'Банк',      icon: '🏦', x: 600, y: 250, color: '#ffd700' },
        { id: 'auction', name: 'Аукцион',   icon: '🎪', x: 450, y: 400, color: '#c0392b' }
      ],
      npcs: [
        { id: 'merchant', name: 'Купец',    icon: '🧔', x: 250, y: 380, color: '#B8860B' },
        { id: 'banker',   name: 'Банкир',   icon: '👨‍💼', x: 650, y: 380, color: '#ffd700' }
      ]
    },
    {
      name: '🔨 Квартал ремёсел',
      buildings: [
        { id: 'blacksmith', name: 'Кузнец',    icon: '🔨', x: 300, y: 250, color: '#8a4a1a' },
        { id: 'alchemist',  name: 'Алхимик',   icon: '🧪', x: 500, y: 250, color: '#8a2be2' },
        { id: 'tailor',     name: 'Портной',   icon: '👕', x: 700, y: 250, color: '#4a8aff' }
      ],
      npcs: [
        { id: 'smith',    name: 'Кузнец',   icon: '👨‍🏭', x: 250, y: 380, color: '#8a4a1a' },
        { id: 'alchem',   name: 'Алхимик',  icon: '🧙‍♂️', x: 450, y: 380, color: '#8a2be2' },
        { id: 'tailorN',  name: 'Портной',  icon: '🧵',   x: 650, y: 380, color: '#4a8aff' }
      ]
    }
  ],

  dragon: [
    {
      name: '⚔️ Казармы',
      buildings: [
        { id: 'barracks', name: 'Казармы',  icon: '🏰', x: 400, y: 250, color: '#c0392b' },
        { id: 'training', name: 'Тренировка', icon: '🎯', x: 600, y: 350, color: '#e74c3c' }
      ],
      npcs: [
        { id: 'general', name: 'Генерал',  icon: '🎖️', x: 350, y: 400, color: '#c0392b' }
      ]
    },
    {
      name: '🏟️ Арена',
      buildings: [
        { id: 'arena',   name: 'Арена',      icon: '🏟️', x: 450, y: 250, color: '#8B0000' },
        { id: 'pvp',     name: 'PvP-зал',    icon: '⚔️', x: 300, y: 400, color: '#e74c3c' },
        { id: 'tournament', name: 'Турниры', icon: '🏆', x: 600, y: 400, color: '#ffd700' }
      ],
      npcs: [
        { id: 'champion', name: 'Чемпион',  icon: '🥷', x: 450, y: 420, color: '#e74c3c' }
      ]
    },
    {
      name: '🔥 Кузница',
      buildings: [
        { id: 'forge',     name: 'Оружейник', icon: '🔥', x: 400, y: 250, color: '#e84a1a' },
        { id: 'repair',    name: 'Ремонт',    icon: '🛠️', x: 600, y: 350, color: '#5a5a5a' }
      ],
      npcs: [
        { id: 'weaponsmith', name: 'Оружейник', icon: '⚒️', x: 350, y: 400, color: '#e84a1a' }
      ]
    }
  ],

  elf: [
    {
      name: '🧪 Алхимия',
      buildings: [
        { id: 'lab',      name: 'Лаборатория', icon: '🧪', x: 400, y: 250, color: '#8a2be2' },
        { id: 'herbalist', name: 'Травник',    icon: '🌿', x: 600, y: 350, color: '#27ae60' }
      ],
      npcs: [
        { id: 'alchemistE', name: 'Алхимик', icon: '🧙‍♀️', x: 350, y: 400, color: '#8a2be2' }
      ]
    },
    {
      name: '📖 Библиотека',
      buildings: [
        { id: 'library', name: 'Библиотека', icon: '📚', x: 400, y: 250, color: '#4a8aff' },
        { id: 'magic',   name: 'Магия',      icon: '🔮', x: 600, y: 350, color: '#8a2be2' }
      ],
      npcs: [
        { id: 'mage', name: 'Магистр',   icon: '🧙‍♂️', x: 350, y: 400, color: '#8a2be2' },
        { id: 'librarian', name: 'Библиотекарь', icon: '👩‍🏫', x: 650, y: 400, color: '#4a8aff' }
      ]
    },
    {
      name: '🌸 Сад',
      buildings: [
        { id: 'garden',   name: 'Сад',       icon: '🌸', x: 400, y: 250, color: '#27ae60' },
        { id: 'druidgrove', name: 'Роща',    icon: '🌳', x: 600, y: 350, color: '#3a8a4a' }
      ],
      npcs: [
        { id: 'druid',    name: 'Друид',     icon: '🧝', x: 350, y: 400, color: '#27ae60' },
        { id: 'gardener', name: 'Садовник',  icon: '👨‍🌾', x: 650, y: 400, color: '#3a8a4a' }
      ]
    }
  ]
};

// Получить текущий район
function getCurrentDistrictData() {
  if (!currentCity) return null;
  const districts = DISTRICTS[currentCity.id];
  if (!districts) return null;
  return districts[currentDistrict] || districts[0];
}

// ============================================================
//  ОТРИСОВКА РАЙОНА
// ============================================================

function drawDistrictInterior(ctx) {
  const city = currentCity;
  const district = getCurrentDistrictData();
  if (!district) return;

  const cw = canvas.width;
  const ch = canvas.height;

  // Фон — каменный пол
  ctx.fillStyle = '#6a6a5a';
  ctx.fillRect(0, 0, cw, ch);

  // Плитка
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < cw; x += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = 0; y < ch; y += TILE_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  // Стены вокруг
  const wallThick = 20;
  ctx.fillStyle = city.color;
  ctx.fillRect(0, 0, cw, wallThick);
  ctx.fillRect(0, ch - wallThick, cw, wallThick);
  ctx.fillRect(0, 0, wallThick, ch);
  ctx.fillRect(cw - wallThick, 0, wallThick, ch);

  // Внутренняя тень
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(wallThick, wallThick, cw - wallThick * 2, 4);

  // Заголовок — название города + района
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'black';
  ctx.strokeText(city.name, cw / 2, 50);
  ctx.fillStyle = city.color;
  ctx.fillText(city.name, cw / 2, 50);

  // Название района
  ctx.font = 'bold 18px Arial';
  ctx.lineWidth = 3;
  ctx.strokeText(district.name, cw / 2, 80);
  ctx.fillStyle = '#ffd700';
  ctx.fillText(district.name, cw / 2, 80);

  // Индикатор района
  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaa';
  ctx.fillText(\`Район \${currentDistrict + 1} / \${DISTRICTS[city.id].length}\`, cw / 2, 105);

  // Отрисовка зданий
  district.buildings.forEach(b => {
    // Стены
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(b.x - 80, b.y - 40, 160, 100);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 80, b.y - 40, 160, 100);

    // Крыша
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(b.x - 85, b.y - 40);
    ctx.lineTo(b.x, b.y - 100);
    ctx.lineTo(b.x + 85, b.y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Иконка
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(b.icon, b.x, b.y + 10);

    // Имя
    ctx.font = 'bold 14px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(b.name, b.x, b.y + 45);
    ctx.fillStyle = 'white';
    ctx.fillText(b.name, b.x, b.y + 45);
  });

  // Отрисовка NPC
  district.npcs.forEach((npc, idx) => {
    // Анимация покачивания
    const bob = Math.sin(Date.now() / 400 + idx) * 3;
    const nx = npc.x;
    const ny = npc.y + bob;

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(nx, npc.y + 20, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тело
    ctx.fillStyle = npc.color;
    ctx.fillRect(nx - 12, ny - 15, 24, 35);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(nx - 12, ny - 15, 24, 35);

    // Иконка (голова)
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(npc.icon, nx, ny + 5);

    // Имя над головой
    ctx.font = 'bold 12px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(npc.name, nx, ny - 25);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(npc.name, nx, ny - 25);
  });

  // Стрелки перемещения
  drawDistrictArrows(ctx);
}

// ============================================================
//  СТРЕЛКИ ПЕРЕМЕЩЕНИЯ
// ============================================================

function drawDistrictArrows(ctx) {
  if (!currentCity) return;
  const total = DISTRICTS[currentCity.id].length;
  const cw = canvas.width;
  const ch = canvas.height;

  // Стрелка "вперёд" (правая) — если есть следующий район
  if (currentDistrict < total - 1) {
    ctx.fillStyle = 'rgba(74, 74, 255, 0.7)';
    ctx.fillRect(cw - 80, ch / 2 - 40, 60, 80);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(cw - 80, ch / 2 - 40, 60, 80);
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('→', cw - 50, ch / 2 + 15);
  }

  // Стрелка "назад" (левая) — если есть предыдущий район
  if (currentDistrict > 0) {
    ctx.fillStyle = 'rgba(74, 74, 255, 0.7)';
    ctx.fillRect(20, ch / 2 - 40, 60, 80);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, ch / 2 - 40, 60, 80);
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('←', 50, ch / 2 + 15);
  }
}

// ============================================================
//  ПЕРЕХОД МЕЖДУ РАЙОНАМИ
// ============================================================

function nextDistrict() {
  if (!currentCity) return;
  const total = DISTRICTS[currentCity.id].length;
  if (currentDistrict < total - 1) {
    currentDistrict++;
    console.log(\`🏙️ Район \${currentDistrict + 1}: \${getCurrentDistrictData().name}\`);
    // Плавное перемещение игрока в центр
    const me = players.get(myId) || character;
    if (me) {
      me.cityX = canvas.width / 2;
      me.cityY = canvas.height / 2 + 100;
      me.targetCityX = me.cityX;
      me.targetCityY = me.cityY;
    }
  }
}

function prevDistrict() {
  if (!currentCity) return;
  if (currentDistrict > 0) {
    currentDistrict--;
    console.log(\`🏙️ Район \${currentDistrict + 1}: \${getCurrentDistrictData().name}\`);
    const me = players.get(myId) || character;
    if (me) {
      me.cityX = canvas.width / 2;
      me.cityY = canvas.height / 2 + 100;
      me.targetCityX = me.cityX;
      me.targetCityY = me.cityY;
    }
  }
}

// ============================================================
//  КЛИК ПО NPC/ЗДАНИЮ
// ============================================================

function handleDistrictClick(mx, my) {
  if (!currentCity) return;
  const district = getCurrentDistrictData();
  if (!district) return;
  const cw = canvas.width;
  const ch = canvas.height;

  // Клик по стрелке "вперёд"
  if (mx > cw - 80 && mx < cw - 20 && my > ch / 2 - 40 && my < ch / 2 + 40) {
    const total = DISTRICTS[currentCity.id].length;
    if (currentDistrict < total - 1) { nextDistrict(); return; }
  }

  // Клик по стрелке "назад"
  if (mx > 20 && mx < 80 && my > ch / 2 - 40 && my < ch / 2 + 40) {
    if (currentDistrict > 0) { prevDistrict(); return; }
  }

  // Клик по зданию
  for (const b of district.buildings) {
    if (mx >= b.x - 80 && mx <= b.x + 80 && my >= b.y - 100 && my <= b.y + 60) {
      console.log(\`🖱️ Клик по зданию: \${b.name}\`);
      openBuildingMenu(b.id);
      return;
    }
  }

  // Клик по NPC
  for (const npc of district.npcs) {
    if (mx >= npc.x - 20 && mx <= npc.x + 20 && my >= npc.y - 30 && my <= npc.y + 30) {
      console.log(\`🖱️ Клик по NPC: \${npc.name}\`);
      alert(\`\${npc.icon} \${npc.name}\\n\\n(диалог скоро)\`);
      return;
    }
  }

  // Клик по свободному месту — идём туда
  const me = players.get(myId) || character;
  if (me) {
    me.targetCityX = mx;
    me.targetCityY = my;
  }
}

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В enterCity — сбрасываем район на 0
  content = content.replace(
    `  me.cityX = canvas.width / 2;
  me.cityY = canvas.height / 2;
  me.targetCityX = me.cityX;
  me.targetCityY = me.cityY;
  hideEnterButton();
  hideGatherButton();
  console.log(\`🏰 Вошли в \${city.name}\`);`,
    `  currentDistrict = 0;
  me.cityX = canvas.width / 2;
  me.cityY = canvas.height / 2 + 100;
  me.targetCityX = me.cityX;
  me.targetCityY = me.cityY;
  hideEnterButton();
  hideGatherButton();
  console.log(\`🏰 Вошли в \${city.name} → \${getCurrentDistrictData()?.name || 'район 1'}\`);`
  );

  // В draw() заменяем drawCityInterior на drawDistrictInterior
  content = content.replace(
    '    drawCityInterior(ctx);',
    '    drawDistrictInterior(ctx);'
  );

  // В handleCityClick — используем handleDistrictClick
  content = content.replace(
    `function handleCityClick(mx, my) {
  const me = players.get(myId) || character;
  if (!me) return;
  if (my > canvas.height - 40) { exitCity(); return; }

  let clickedBuilding = false;
  CITY_BUILDINGS.forEach(b => {
    const bx = b.tileX * TILE_SIZE;
    const by = b.tileY * TILE_SIZE;
    const bw = TILE_SIZE * 3;
    const bh = TILE_SIZE * 2.5;
    if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
      console.log(\`🖱️ Клик по: \${b.name}\`);
      openBuildingMenu(b.id);
      clickedBuilding = true;
    }
  });

  if (!clickedBuilding) {
    me.targetCityX = mx;
    me.targetCityY = my;
  }
}`,
    `function handleCityClick(mx, my) {
  // Клик по нижней зоне = выход из города
  if (my > canvas.height - 40) { exitCity(); return; }
  handleDistrictClick(mx, my);
}`
  );

  content = addMarker(content, 'city-districts');
  writeFile(MAIN_FILE, content);
  return true;
}