// install/29-achievements.js — Достижения + квесты
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'achievements')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: ACHIEVEMENTS (достижения + квесты)
// ============================================================

// Счётчики прогресса
const playerStats = {
  plantsCollected: 0,
  monstersKilled: 0,
  bossesKilled: 0,
  potionsCrafted: 0,
  goldEarned: 0,
  maxLevel: 1,
  questsDone: 0
};

// Достижения
const ACHIEVEMENTS = [
  { id: 'first_plant',    name: 'Первый росток',      icon: '🌱', desc: 'Собрать 1 растение',   goal: 1,    stat: 'plantsCollected', reward: { gold: 10 } },
  { id: 'gardener',       name: 'Садовник',           icon: '🌿', desc: 'Собрать 10 растений',  goal: 10,   stat: 'plantsCollected', reward: { gold: 100 } },
  { id: 'dendrologist',   name: 'Дендролог',          icon: '🌳', desc: 'Собрать 30 растений',  goal: 30,   stat: 'plantsCollected', reward: { gold: 500 } },
  { id: 'florist',        name: 'Флорист',            icon: '🌸', desc: 'Собрать 50 растений',  goal: 50,   stat: 'plantsCollected', reward: { gold: 2000 } },
  { id: 'master_flora',   name: 'Мастер флоры',       icon: '👑', desc: 'Собрать 66 растений',  goal: 66,   stat: 'uniquePlants',    reward: { title: 'Повелитель флоры' } },
  { id: 'first_blood',    name: 'Первая кровь',       icon: '⚔️', desc: 'Убить 1 моба',         goal: 1,    stat: 'monstersKilled',  reward: { gold: 20 } },
  { id: 'warrior',        name: 'Воин',               icon: '🗡️', desc: 'Убить 100 мобов',      goal: 100,  stat: 'monstersKilled',  reward: { gold: 1000 } },
  { id: 'boss_hunter',    name: 'Охотник на боссов',  icon: '🐉', desc: 'Убить 5 боссов',       goal: 5,    stat: 'bossesKilled',    reward: { gold: 5000 } },
  { id: 'legend',         name: 'Легенда',            icon: '👑', desc: 'Убить всех 11 боссов', goal: 11,   stat: 'bossesKilled',    reward: { title: 'Легенда Вердании' } },
  { id: 'alchemist',      name: 'Алхимик',            icon: '🧪', desc: 'Скрафтить 50 зелий',   goal: 50,   stat: 'potionsCrafted',  reward: { recipe: 'Панацея' } },
  { id: 'rich',           name: 'Богач',              icon: '💰', desc: 'Накопить 10000 золота',goal: 10000,stat: 'goldEarned',      reward: { title: 'Золотой жук' } },
  { id: 'perfectionist',  name: 'Перфекционист',      icon: '🏆', desc: 'Выполнить все квесты', goal: 29,   stat: 'questsDone',      reward: { title: 'Герой мира' } },
  { id: 'max_level',      name: 'Максимальный уровень', icon: '⭐', desc: 'Достичь 70 уровня',  goal: 70,   stat: 'maxLevel',        reward: { title: 'Полубог' } }
];

// Полученные достижения
const unlockedAchievements = {};
const achievedTitles = [];

// Список квестов (5 базовых)
const QUESTS = [
  { id: 'q_kill_goblins',  name: 'Убить 10 гоблинов',      icon: '👹', type: 'kill',  target: 'goblin', goal: 10, progress: 0, done: false, reward: { gold: 50, exp: 100 } },
  { id: 'q_kill_orcs',     name: 'Убить 5 орков',          icon: '👺', type: 'kill',  target: 'orc',    goal: 5,  progress: 0, done: false, reward: { gold: 100, exp: 250 } },
  { id: 'q_collect_herb',  name: 'Собрать 10 трав',        icon: '🌿', type: 'plant', target: 'herb',   goal: 10, progress: 0, done: false, reward: { gold: 30, exp: 50 } },
  { id: 'q_kill_ogres',    name: 'Убить 3 огров',          icon: '🧟', type: 'kill',  target: 'ogre',   goal: 3,  progress: 0, done: false, reward: { gold: 200, exp: 500 } },
  { id: 'q_collect_wood',  name: 'Собрать 20 древесины',   icon: '🪵', type: 'plant', target: 'wood',   goal: 20, progress: 0, done: false, reward: { gold: 80, exp: 150 } }
];

// ============================================================
//  ПРОВЕРКА ДОСТИЖЕНИЙ
// ============================================================

function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (unlockedAchievements[ach.id]) return;

    let current = playerStats[ach.stat] || 0;

    // Особые случаи
    if (ach.stat === 'uniquePlants') {
      current = Object.keys(plantInventory).length;
    }
    if (ach.stat === 'goldEarned') {
      current = character?.stats?.gold || 0;
    }
    if (ach.stat === 'maxLevel') {
      current = character?.stats?.level || 1;
    }

    if (current >= ach.goal) {
      unlockedAchievements[ach.id] = Date.now();
      onAchievementUnlocked(ach);
    }
  });
}

function onAchievementUnlocked(ach) {
  console.log(\`🏆 Достижение: \${ach.name}\`);

  // Награда
  if (ach.reward.gold && character?.stats) {
    character.stats.gold += ach.reward.gold;
    updateStatsHUD();
  }
  if (ach.reward.title) {
    achievedTitles.push(ach.reward.title);
  }

  // Уведомление
  showAchievementNotification(ach);
}

function showAchievementNotification(ach) {
  const notif = document.createElement('div');
  notif.style.cssText = \`
    position: absolute; top: 20px; right: 20px;
    background: linear-gradient(135deg, #2a1a3a, #4a2a5a);
    border: 3px solid #ffd700; border-radius: 10px;
    padding: 15px 25px; color: #fff;
    font-family: Arial, sans-serif;
    z-index: 500;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
    animation: slideIn 0.5s ease-out;
    max-width: 350px;
  \`;
  let rewardText = '';
  if (ach.reward.gold) rewardText += \`+\${ach.reward.gold}💰 \`;
  if (ach.reward.title) rewardText += \`Титул: \${ach.reward.title}\`;

  notif.innerHTML = \`
    <div style="font-size:12px;color:#ffd700;text-transform:uppercase;letter-spacing:2px;">Достижение!</div>
    <div style="font-size:22px;margin:5px 0;">\${ach.icon} \${ach.name}</div>
    <div style="font-size:12px;color:#ccc;margin-bottom:5px;">\${ach.desc}</div>
    <div style="font-size:14px;color:#88ff88;">\${rewardText}</div>
  \`;
  document.getElementById('gameScreen').appendChild(notif);
  setTimeout(() => {
    notif.style.transition = 'opacity 0.5s, transform 0.5s';
    notif.style.opacity = '0';
    notif.style.transform = 'translateX(400px)';
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

// ============================================================
//  ПАНЕЛЬ ДОСТИЖЕНИЙ (K)
// ============================================================

let achievementsOpen = false;

function toggleAchievements() {
  achievementsOpen = !achievementsOpen;
  const panel = document.getElementById('achievementsPanel');
  if (!panel) return;
  panel.style.display = achievementsOpen ? 'flex' : 'none';
  if (achievementsOpen) renderAchievements();
}

function createAchievementsPanel() {
  if (document.getElementById('achievementsPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'achievementsPanel';
  panel.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(10, 5, 20, 0.95);
    padding: 30px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 350; display: none;
    flex-direction: column;
    box-sizing: border-box;
  \`;
  document.getElementById('gameScreen').appendChild(panel);
}

function renderAchievements() {
  const panel = document.getElementById('achievementsPanel');
  if (!panel) return;

  const items = ACHIEVEMENTS.map(ach => {
    const unlocked = !!unlockedAchievements[ach.id];
    let current = playerStats[ach.stat] || 0;
    if (ach.stat === 'uniquePlants') current = Object.keys(plantInventory).length;
    if (ach.stat === 'goldEarned') current = character?.stats?.gold || 0;
    if (ach.stat === 'maxLevel') current = character?.stats?.level || 1;
    const pct = Math.min(100, (current / ach.goal) * 100);

    return \`
      <div style="background:\${unlocked ? 'linear-gradient(135deg,#2a4a2a,#1a3a1a)' : '#1a1a2e'};border:2px solid \${unlocked ? '#ffd700' : '#444'};border-radius:10px;padding:12px;opacity:\${unlocked ? 1 : 0.7};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:16px;font-weight:bold;color:\${unlocked ? '#ffd700' : '#aaa'};">\${ach.icon} \${ach.name}</div>
          <div style="font-size:12px;color:\${unlocked ? '#88ff88' : '#666'};">\${unlocked ? '✓ Получено' : '🔒'}</div>
        </div>
        <div style="font-size:12px;color:#ccc;margin-bottom:8px;">\${ach.desc}</div>
        <div style="height:8px;background:#0a0a1a;border-radius:4px;overflow:hidden;margin-bottom:4px;">
          <div style="height:100%;width:\${pct}%;background:linear-gradient(90deg,#4a4aff,#8a2be2);"></div>
        </div>
        <div style="font-size:11px;color:#888;text-align:right;">\${Math.min(current, ach.goal)} / \${ach.goal}</div>
      </div>
    \`;
  }).join('');

  const unlockedCount = Object.keys(unlockedAchievements).length;

  panel.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="font-size:28px;font-weight:bold;color:#ffd700;">🏆 Достижения (\${unlockedCount}/\${ACHIEVEMENTS.length})</div>
      <button onclick="window.toggleAchievements()" style="background:transparent;border:none;color:#888;font-size:24px;cursor:pointer;">✕</button>
    </div>
    <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-content:start;">
      \${items}
    </div>
    <div style="text-align:center;font-size:12px;color:#888;margin-top:15px;">Закрыть: клавиша <b>K</b> или Esc</div>
  \`;
}

window.toggleAchievements = toggleAchievements;

// ============================================================
//  ПАНЕЛЬ КВЕСТОВ (J)
// ============================================================

let questsOpen = false;

function toggleQuests() {
  questsOpen = !questsOpen;
  const panel = document.getElementById('questsPanel');
  if (!panel) return;
  panel.style.display = questsOpen ? 'flex' : 'none';
  if (questsOpen) renderQuests();
}

function createQuestsPanel() {
  if (document.getElementById('questsPanel')) return;
  const panel = document.createElement('div');
  panel.id = 'questsPanel';
  panel.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(5, 10, 20, 0.95);
    padding: 30px; color: #eee;
    font-family: Arial, sans-serif;
    z-index: 350; display: none;
    flex-direction: column;
    box-sizing: border-box;
  \`;
  document.getElementById('gameScreen').appendChild(panel);
}

function renderQuests() {
  const panel = document.getElementById('questsPanel');
  if (!panel) return;

  const items = QUESTS.map(q => {
    const pct = Math.min(100, (q.progress / q.goal) * 100);
    return \`
      <div style="background:\${q.done ? 'linear-gradient(135deg,#2a4a2a,#1a3a1a)' : '#1a1a2e'};border:2px solid \${q.done ? '#ffd700' : '#4a4aff'};border-radius:10px;padding:15px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:bold;color:\${q.done ? '#ffd700' : '#fff'};">\${q.icon} \${q.name}</div>
          <div style="font-size:12px;color:\${q.done ? '#88ff88' : '#aaa'};">\${q.done ? '✓ Выполнен' : 'Активен'}</div>
        </div>
        <div style="height:10px;background:#0a0a1a;border-radius:5px;overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;width:\${pct}%;background:linear-gradient(90deg,#f39c12,#ffd700);"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;">
          <span style="color:#888;">\${q.progress}/\${q.goal}</span>
          <span style="color:#88ff88;">Награда: \${q.reward.gold}💰 + \${q.reward.exp} опыта</span>
        </div>
      </div>
    \`;
  }).join('');

  panel.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="font-size:28px;font-weight:bold;color:#ffd700;">📜 Квесты</div>
      <button onclick="window.toggleQuests()" style="background:transparent;border:none;color:#888;font-size:24px;cursor:pointer;">✕</button>
    </div>
    <div style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:15px;align-content:start;">
      \${items}
    </div>
    <div style="text-align:center;font-size:12px;color:#888;margin-top:15px;">Закрыть: клавиша <b>J</b> или Esc</div>
  \`;
}

window.toggleQuests = toggleQuests;

// ============================================================
//  ОТСЛЕЖИВАНИЕ ПРОГРЕССА
// ============================================================

// Растение собрано
function trackPlantCollected(plantId) {
  playerStats.plantsCollected++;
  checkAchievements();
}

// Моб убит
function trackMonsterKilled(monsterType) {
  playerStats.monstersKilled++;
  // Прогресс квестов
  QUESTS.forEach(q => {
    if (q.type === 'kill' && q.target === monsterType && !q.done) {
      q.progress++;
      if (q.progress >= q.goal) {
        q.done = true;
        playerStats.questsDone++;
        if (character?.stats) {
          character.stats.gold += q.reward.gold;
          gainExp(q.reward.exp);
        }
        setNavStatus(\`📜 Квест выполнен: \${q.name}!\`, '#ffd700');
      }
    }
  });
  checkAchievements();
}

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — создаём панели
  content = content.replace(
    '  createInventoryV3();',
    `  createInventoryV3();
  createAchievementsPanel();
  createQuestsPanel();`
  );

  // Клавиши K и J
  content = content.replace(
    "    if (e.key.toLowerCase() === 'i') { toggleInventoryV3(); return; }",
    `    if (e.key.toLowerCase() === 'i') { toggleInventoryV3(); return; }
    if (e.key.toLowerCase() === 'k') { toggleAchievements(); return; }
    if (e.key.toLowerCase() === 'j') { toggleQuests(); return; }`
  );

  // Esc закрывает
  content = content.replace(
    `    if (e.key === 'Escape') { 
      if (invV3Open) { closeInventoryV3(); return; }
      if (inventoryOpen) { toggleInventory(); return; }
    }`,
    `    if (e.key === 'Escape') { 
      if (invV3Open) { closeInventoryV3(); return; }
      if (inventoryOpen) { toggleInventory(); return; }
      if (achievementsOpen) { toggleAchievements(); return; }
      if (questsOpen) { toggleQuests(); return; }
    }`
  );

  // Отслеживание растений — в completeGathering
  content = content.replace(
    `      // Убираем с карты + респавн через 2 минуты
      plantTile.alive = false;`,
    `      // Отслеживаем прогресс
      if (typeof trackPlantCollected === 'function') trackPlantCollected(plantTile.plantId);

      // Убираем с карты + респавн через 2 минуты
      plantTile.alive = false;`
  );

  // Отслеживание убийств — в killMonster
  content = content.replace(
    `  gainExp(m.exp);
  s.gold += m.gold;
  setNavStatus(\`☠️ \${m.name} убит! +\${m.exp} опыта, +\${m.gold} золота\`, '#88ff88');`,
    `  gainExp(m.exp);
  s.gold += m.gold;
  if (typeof trackMonsterKilled === 'function') trackMonsterKilled(m.type);
  setNavStatus(\`☠️ \${m.name} убит! +\${m.exp} опыта, +\${m.gold} золота\`, '#88ff88');`
  );

  content = addMarker(content, 'achievements');
  writeFile(MAIN_FILE, content);
  return true;
}