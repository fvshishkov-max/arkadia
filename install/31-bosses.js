// install/31-bosses.js — 11 боссов с особыми атаками и лутом
export default async function install({ readFile, writeFile, backup, hasMarker, addMarker, MAIN_FILE }) {
  let content = readFile(MAIN_FILE);
  if (!content) return false;
  if (hasMarker(content, 'bosses')) {
    console.log('  ℹ️  Уже установлен');
    return false;
  }
  backup(MAIN_FILE);

  const code = `
// ============================================================
//  МОДУЛЬ: BOSSES (11 боссов с особыми атаками)
// ============================================================

// Список боссов
const BOSSES = [
  // 🌱 Опушка
  { id: 'boar_king',    name: 'Король-кабан',    icon: '🐗', biome: 'edge',     hp: 500,    atk: 20,  def: 5,   exp: 500,   gold: [100, 300],  effect: 'rage',     desc: 'Удваивает урон при HP < 50%' },
  // 🌸 Луг
  { id: 'bee_queen',    name: 'Пчелиная матка',  icon: '🐝', biome: 'meadow',   hp: 800,    atk: 30,  def: 8,   exp: 800,   gold: [150, 400],  effect: 'swarm',    desc: 'Атакует 2 раза за ход' },
  // 🌲 Тёмный бор
  { id: 'dark_ent',     name: 'Тёмный энт',      icon: '🌳', biome: 'forest',   hp: 1500,   atk: 45,  def: 15,  exp: 1500,  gold: [250, 600],  effect: 'regen',    desc: 'Регенерирует 20 HP/сек' },
  // 🏞️ Речная долина
  { id: 'river_croc',   name: 'Речной крокодил', icon: '🐊', biome: 'river',    hp: 2500,   atk: 70,  def: 25,  exp: 2500,  gold: [400, 900],  effect: 'stun',     desc: 'Захват: игрок пропускает ход' },
  // 🍄 Болото
  { id: 'druid_ghost',  name: 'Призрак друида',  icon: '👻', biome: 'swamp',    hp: 4000,   atk: 100, def: 30,  exp: 4000,  gold: [700, 1500], effect: 'drain',    desc: 'Крадёт опыт при ударе' },
  // 🏜️ Пустошь
  { id: 'scorpion_king',name: 'Скорпион-король', icon: '🦂', biome: 'desert',   hp: 6500,   atk: 140, def: 45,  exp: 6500,  gold: [1200, 2500],effect: 'poison',   desc: 'Яд: -10 HP/сек 5 сек' },
  // 🌴 Тропики
  { id: 'tiger_lord',   name: 'Тигр-владыка',    icon: '🐅', biome: 'tropic',   hp: 10000,  atk: 190, def: 60,  exp: 10000, gold: [2000, 4000],effect: 'jump',     desc: 'Прыжок: 3x урона раз в 5 сек' },
  // ❄️ Северный лес
  { id: 'ice_troll',    name: 'Ледяной тролль',  icon: '🧊', biome: 'north',    hp: 15000,  atk: 250, def: 80,  exp: 15000, gold: [3500, 6500],effect: 'freeze',   desc: 'Заморозка: игрок пропускает ход' },
  // 🌋 Вулкан
  { id: 'lava_lord',    name: 'Владыка лавы',    icon: '🐉', biome: 'volcano',  hp: 25000,  atk: 350, def: 110, exp: 25000, gold: [6000, 12000],effect: 'aoe',     desc: 'Огненный шквал: AoE урон' },
  // 🏔️ Горы
  { id: 'stone_colossus',name:'Каменный колосс', icon: '🗿', biome: 'mountain', hp: 40000,  atk: 450, def: 200, exp: 40000, gold: [10000, 20000],effect: 'stone_skin',desc:'-50% урона' },
  // 🌌 Волшебный сад
  { id: 'garden_guardian',name:'Хранитель сада', icon: '🌳', biome: 'magic',    hp: 100000, atk: 700, def: 150, exp: 100000,gold: [25000, 50000],effect: 'phases',  desc: '3 фазы: атаки меняются' }
];

// Активные боссы (заспавнены)
let activeBosses = [];

// Лут-таблицы (по системе редкости)
const BOSS_LOOT = {
  common: [
    { id: 'gold_bonus',  chance: 1.0, min: 1, max: 3, type: 'gold' },
    { id: 'herb',        chance: 1.0, min: 3, max: 8, type: 'resource' },
    { id: 'wood',        chance: 1.0, min: 2, max: 6, type: 'resource' }
  ],
  rare: [
    { id: 'hp_small',    chance: 0.4, min: 1, max: 2, type: 'potion' },
    { id: 'mp_small',    chance: 0.3, min: 1, max: 2, type: 'potion' },
    { id: 'bread',       chance: 0.35, min: 1, max: 3, type: 'food' },
    { id: 'acorn',       chance: 0.4, min: 2, max: 5, type: 'resource' }
  ],
  epic: [
    { id: 'hp_large',    chance: 0.15, min: 1, max: 1, type: 'potion' },
    { id: 'elixir_str',  chance: 0.12, min: 1, max: 1, type: 'potion' },
    { id: 'iron_helm',   chance: 0.08, min: 1, max: 1, type: 'armor' },
    { id: 'copper_ring', chance: 0.10, min: 1, max: 1, type: 'accessory' }
  ],
  legendary: [
    { id: 'steel_sword',  chance: 0.03, min: 1, max: 1, type: 'weapon' },
    { id: 'berserker_axe',chance: 0.02, min: 1, max: 1, type: 'weapon' },
    { id: 'silver_ring',  chance: 0.03, min: 1, max: 1, type: 'accessory' },
    { id: 'gold_amulet',  chance: 0.03, min: 1, max: 1, type: 'accessory' }
  ],
  mythic: [
    { id: 'dragon_sword', chance: 0.005, min: 1, max: 1, type: 'weapon' },
    { id: 'elixir_imm',   chance: 0.005, min: 1, max: 1, type: 'potion' },
    { id: 'mithril_sword',chance: 0.008, min: 1, max: 1, type: 'weapon' }
  ]
};

// ============================================================
//  СПАВН БОССОВ
// ============================================================

function spawnBosses() {
  activeBosses = [];
  let seed = 11111;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  BOSSES.forEach(boss => {
    const biome = BIOMES.find(b => b.id === boss.biome);
    if (!biome) return;

    // Спавн в случайной точке биома
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const dist = rand() * (biome.r - 2);
      const tx = Math.floor(biome.cx + Math.cos(angle) * dist);
      const ty = Math.floor(biome.cy + Math.sin(angle) * dist);
      if (tx < 1 || tx >= MAP_SIZE - 1 || ty < 1 || ty >= MAP_SIZE - 1) continue;
      const tile = GAME_MAP[ty][tx];
      if (tile === TILE.WATER || tile === TILE.CITY_GROUND || tile === TILE.GATE || tile === TILE.LAVA) continue;

      activeBosses.push({
        ...boss,
        x: tx * TILE_SIZE + TILE_SIZE / 2,
        y: ty * TILE_SIZE + TILE_SIZE / 2,
        maxHp: boss.hp,
        alive: true,
        respawnAt: 0,
        isBoss: true
      });
      placed = true;
    }
  });

  console.log(\`👑 Заспавнено боссов: \${activeBosses.length}\`);
}

// ============================================================
//  ОТРИСОВКА БОССОВ
// ============================================================

function drawBosses(ctx, camera) {
  activeBosses.forEach(b => {
    if (!b.alive) return;
    const px = b.x - camera.x;
    const py = b.y - camera.y;
    if (px < -TILE_SIZE * 2 || px > canvas.width + TILE_SIZE * 2) return;
    if (py < -TILE_SIZE * 2 || py > canvas.height + TILE_SIZE * 2) return;

    const half = TILE_SIZE / 2;
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;

    // Красно-фиолетовый фон с пульсацией
    ctx.fillStyle = \`rgba(150, 30, 60, \${0.6 + pulse * 0.3})\`;
    ctx.fillRect(px - half, py - half, TILE_SIZE, TILE_SIZE);

    // Золотая рамка с пульсацией
    ctx.strokeStyle = \`rgba(255, 215, 0, \${0.7 + pulse * 0.3})\`;
    ctx.lineWidth = 4;
    ctx.strokeRect(px - half + 2, py - half + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Иконка большая
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.icon, px, py - 5);

    // Имя с короной
    ctx.font = 'bold 13px Arial';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(\`👑 \${b.name}\`, px, py + half - 18);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(\`👑 \${b.name}\`, px, py + half - 18);

    // HP-бар
    const hpW = TILE_SIZE - 8;
    const hpY = py + half - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(px - hpW / 2, hpY, hpW, 7);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(px - hpW / 2, hpY, hpW * (b.hp / b.maxHp), 7);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - hpW / 2, hpY, hpW, 7);
  });
}

// ============================================================
//  БОЙ С БОССОМ
// ============================================================

let bossBattle = null;  // Состояние боя с боссом
let bossEffects = { poison: 0, frozen: 0, lastJump: 0, phase: 1 };

function startBossBattle(boss) {
  const me = players.get(myId) || character;
  if (!me || !boss || !boss.alive) return;
  if (battle || bossBattle) return;

  const s = character.stats;
  bossBattle = {
    boss,
    myHp: s.hp,
    myMaxHp: s.maxHp,
    bossHp: boss.hp,
    bossMaxHp: boss.maxHp,
    log: [\`👑 БОСС: \${boss.name}!\`, \`\${boss.desc}\`],
    turn: 'player',
    auto: false,
    lastPlayerAttack: 0
  };
  bossEffects = { poison: 0, frozen: 0, lastJump: 0, phase: 1 };

  me.path = null;
  autoFight = false;
  renderBossBattleUI();
  console.log(\`👑 Бой с БОССОМ: \${boss.name}\`);
}

function renderBossBattleUI() {
  if (!bossBattle) return;
  const el = document.getElementById('battlePage');
  if (el) el.remove();

  const me = players.get(myId) || character;
  const b = bossBattle.boss;
  const s = character.stats;

  const myPct = (bossBattle.myHp / bossBattle.myMaxHp) * 100;
  const bossPct = (bossBattle.bossHp / bossBattle.bossMaxHp) * 100;

  const page = document.createElement('div');
  page.id = 'battlePage';
  page.style.cssText = \`
    position: absolute; top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: radial-gradient(ellipse at center, #4a0a1a 0%, #1a0005 100%);
    color: #eee; font-family: Arial, sans-serif;
    z-index: 400; display: flex; flex-direction: column;
    box-sizing: border-box; overflow: hidden;
  \`;

  const logHtml = bossBattle.log.slice(-8).map(line => 
    \`<div style="margin:2px 0;">\${line}</div>\`
  ).join('');

  const effectsHtml = (() => {
    let h = '';
    if (bossEffects.poison > 0) h += \`<span style="background:#2a6a2a;padding:4px 10px;border-radius:6px;font-size:11px;">☠️ Яд: \${Math.ceil(bossEffects.poison)} сек</span>\`;
    if (bossEffects.frozen > 0) h += \`<span style="background:#2a4a8a;padding:4px 10px;border-radius:6px;font-size:11px;margin-left:6px;">❄️ Заморожен: \${Math.ceil(bossEffects.frozen)} сек</span>\`;
    return h;
  })();

  page.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 25px;background:rgba(0,0,0,0.8);border-bottom:3px solid #ffd700;">
      <div style="font-size:22px;font-weight:bold;color:#ffd700;text-shadow:0 0 15px #ff4444;">
        👑 БОСС: \${b.name}
      </div>
      <div>\${effectsHtml}</div>
      <button onclick="window.bossFlee()" style="padding:8px 18px;background:linear-gradient(135deg,#444,#222);color:#ffd700;font-size:14px;font-weight:bold;border:2px solid #ffd700;border-radius:6px;cursor:pointer;">🏃 Побег (30%)</button>
    </div>

    <div style="flex:1;position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;">
      <div style="position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(180deg,transparent 0%,rgba(80,20,20,0.6) 100%);"></div>

      <div id="battlePlayer" style="position:absolute;left:calc(30% - 70px);bottom:180px;font-size:140px;filter:drop-shadow(0 0 25px #ffd700);transition:left 0.4s ease-out;">🧙</div>

      <div id="battleMonster" style="position:absolute;right:calc(30% - 90px);bottom:150px;font-size:180px;filter:drop-shadow(0 0 40px #ff0000);transition:transform 0.1s;">
        <div style="position:relative;">
          \${b.icon}
          <span style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:50px;">👑</span>
        </div>
      </div>
    </div>

    <div style="margin:0 30px;background:rgba(0,0,0,0.8);border:2px solid #ffd700;border-radius:8px;padding:10px;height:130px;overflow-y:auto;font-family:monospace;font-size:12px;color:#ddd;">
      \${logHtml}
    </div>

    <div style="padding:12px 30px;background:rgba(0,0,0,0.8);border-top:3px solid #ffd700;">
      <div style="display:flex;gap:15px;align-items:center;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#ccc;margin-bottom:2px;">❤️ \${bossBattle.myHp}/\${bossBattle.myMaxHp}</div>
          <div style="height:18px;background:#300;border:2px solid #000;border-radius:9px;overflow:hidden;">
            <div style="height:100%;width:\${myPct}%;background:linear-gradient(90deg,#c0392b,#e74c3c);transition:width 0.3s;"></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <span style="color:#ffd700;font-weight:bold;">💰 \${s.gold}</span>
          <button onclick="window.bossAuto()" id="battleAutoBtn" style="padding:10px 18px;background:linear-gradient(135deg,#4a4aff,#8a2be2);color:white;font-size:13px;font-weight:bold;border:2px solid #ffd700;border-radius:6px;cursor:pointer;">🤖 Авто</button>
        </div>
        <div style="flex:1;">
          <div style="font-size:12px;color:#ccc;margin-bottom:2px;text-align:right;">👑 \${bossBattle.bossHp}/\${bossBattle.bossMaxHp}</div>
          <div style="height:18px;background:#300;border:2px solid #000;border-radius:9px;overflow:hidden;">
            <div style="height:100%;width:\${bossPct}%;background:linear-gradient(90deg,#8a1a1a,#e74c3c);transition:width 0.3s;"></div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:center;gap:10px;padding:15px;background:linear-gradient(180deg,#1a0a1a 0%,#0a0005 100%);border-top:3px solid #ffd700;">
      <div onclick="window.bossAttack()" style="width:75px;height:75px;background:linear-gradient(135deg,#c0392b,#e74c3c);border:3px solid #ffd700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 20px rgba(231,76,60,0.8);">
        <div style="font-size:32px;">⚔️</div>
        <div style="font-size:11px;color:#fff;font-weight:bold;">Атака [1]</div>
      </div>
      <div onclick="window.bossPotion()" style="width:75px;height:75px;background:linear-gradient(135deg,#8a2be2,#4a4aff);border:3px solid #ffd700;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
        <div style="font-size:32px;">🧪</div>
        <div style="font-size:11px;color:#fff;font-weight:bold;">Зелье [5]</div>
      </div>
    </div>
  \`;

  document.getElementById('gameScreen').appendChild(page);
}

// Атака босса
window.bossAttack = function() {
  if (!bossBattle) return;
  const now = Date.now();
  if (now - bossBattle.lastPlayerAttack < 900) return;
  bossBattle.lastPlayerAttack = now;

  if (bossEffects.frozen > 0) {
    bossBattle.log.push('❄️ Ты заморожен! Пропускаешь ход.');
    renderBossBattleUI();
    bossTurn();
    return;
  }

  const s = character.stats;
  const baseDmg = 5 + s.str + s.int * 0.5;
  const crit = Math.random() < (0.05 + s.luck * 0.005);
  const dmg = Math.floor(baseDmg * (crit ? 2 : 1) * (0.8 + Math.random() * 0.4));

  // Урон снижается каменной кожей (каменный колосс)
  let finalDmg = dmg;
  if (bossBattle.boss.effect === 'stone_skin') finalDmg = Math.floor(dmg * 0.5);

  bossBattle.bossHp -= finalDmg;
  bossBattle.log.push(\`⚔️ Удар: \${finalDmg}\${crit ? ' КРИТ!' : ''}\`);

  animateBossAttack(() => {
    if (bossBattle.bossHp <= 0) {
      onBossDefeated();
      return;
    }
    bossTurn();
  });
};

// Ход босса
function bossTurn() {
  if (!bossBattle) return;
  const b = bossBattle.boss;
  const s = character.stats;
  const now = Date.now();

  // Обновляем эффекты
  if (bossEffects.poison > 0) {
    const poisonDmg = 10;
    bossBattle.myHp -= poisonDmg;
    bossEffects.poison--;
    bossBattle.log.push(\`☠️ Яд: -\${poisonDmg} HP\`);
    if (bossBattle.myHp <= 0) { onBossLose(); return; }
  }
  if (bossEffects.frozen > 0) bossEffects.frozen--;

  // Атака босса по эффекту
  let dmg = Math.max(1, b.atk - Math.floor(s.vit * 0.5));
  let extraLog = '';

  if (b.effect === 'rage' && bossBattle.bossHp < bossBattle.bossMaxHp * 0.5) {
    dmg *= 2;
    extraLog = ' 🔥 ЯРОСТЬ!';
  }
  if (b.effect === 'swarm') {
    dmg = Math.floor(dmg * 2);
    extraLog = ' 🐝 РОЙ!';
  }
  if (b.effect === 'regen') {
    const heal = 20;
    bossBattle.bossHp = Math.min(bossBattle.bossMaxHp, bossBattle.bossHp + heal);
    extraLog = \` 💚 Регенерация +\${heal}\`;
  }
  if (b.effect === 'stun' && Math.random() < 0.3) {
    bossEffects.frozen = 1;
    extraLog = ' 🐊 ЗАХВАТ!';
  }
  if (b.effect === 'drain') {
    const drain = Math.floor(dmg * 0.5);
    gainExp(-drain);
    extraLog = \` 👻 Крадёт \${drain} опыта\`;
  }
  if (b.effect === 'poison' && Math.random() < 0.4) {
    bossEffects.poison = 5;
    extraLog = ' ☠️ ОТРАВЛЕН!';
  }
  if (b.effect === 'jump' && now - bossEffects.lastJump > 5000) {
    dmg *= 3;
    bossEffects.lastJump = now;
    extraLog = ' 🐅 ПРЫЖОК x3!';
  }
  if (b.effect === 'freeze' && Math.random() < 0.3) {
    bossEffects.frozen = 1;
    extraLog = ' ❄️ ЗАМОРОЖЕН!';
  }
  if (b.effect === 'aoe') {
    dmg = Math.floor(dmg * 1.5);
    extraLog = ' 🔥 ОГНЕННЫЙ ШКВАЛ!';
  }
  if (b.effect === 'phases') {
    // 3 фазы
    const hpPct = bossBattle.bossHp / bossBattle.bossMaxHp;
    if (hpPct < 0.33) { dmg = Math.floor(dmg * 2); extraLog = ' 👑 ФАЗА 3!'; }
    else if (hpPct < 0.66) { dmg = Math.floor(dmg * 1.5); extraLog = ' 👑 ФАЗА 2!'; }
  }

  bossBattle.myHp -= dmg;
  bossBattle.log.push(\`💥 \${b.name}: \${dmg}\${extraLog}\`);

  if (bossBattle.myHp <= 0) { onBossLose(); return; }
  renderBossBattleUI();
}

// Анимация
function animateBossAttack(callback) {
  const player = document.getElementById('battlePlayer');
  const monster = document.getElementById('battleMonster');
  if (!player) { if (callback) callback(); return; }

  player.style.left = 'calc(60% - 70px)';
  player.style.transition = 'left 0.3s ease-in';

  setTimeout(() => {
    if (monster) {
      let shakes = 0;
      const si = setInterval(() => {
        monster.style.transform = \`translateX(\${Math.sin(shakes * 2) * 10}px)\`;
        shakes++;
        if (shakes > 8) { clearInterval(si); monster.style.transform = ''; }
      }, 50);
    }
    setTimeout(() => {
      player.style.left = 'calc(30% - 70px)';
      player.style.transition = 'left 0.3s ease-out';
      setTimeout(() => { if (callback) callback(); }, 300);
    }, 200);
  }, 300);
}

// Победа
function onBossDefeated() {
  const b = bossBattle.boss;
  const s = character.stats;
  bossBattle.log.push(\`🎉 \${b.name} ПОВЕРЖЕН!\`);
  renderBossBattleUI();

  // Гарантированное золото
  const gold = b.gold[0] + Math.floor(Math.random() * (b.gold[1] - b.gold[0]));
  s.gold += gold;
  gainExp(b.exp);

  // Лут-таблица
  const loot = [];
  // Обычное — 100%
  BOSS_LOOT.common.forEach(l => {
    if (Math.random() < l.chance) {
      if (l.type === 'gold') { /* уже добавлено */ }
      else {
        const amount = l.min + Math.floor(Math.random() * (l.max - l.min + 1));
        if (inventory[l.id] !== undefined) {
          inventory[l.id] += amount;
          loot.push(\`\${ITEM_INFO[l.id]?.icon || '📦'} ×\${amount} \${ITEM_INFO[l.id]?.name || l.id}\`);
        }
      }
    }
  });
  // Редкое
  BOSS_LOOT.rare.forEach(l => {
    if (Math.random() < l.chance) {
      const amount = l.min + Math.floor(Math.random() * (l.max - l.min + 1));
      if (l.type === 'potion' || l.type === 'food') {
        craftInventory[l.id] = (craftInventory[l.id] || 0) + amount;
      } else if (inventory[l.id] !== undefined) {
        inventory[l.id] += amount;
      }
      loot.push(\`🎁 ×\${amount} \${l.id}\`);
    }
  });
  // Эпическое
  BOSS_LOOT.epic.forEach(l => {
    if (Math.random() < l.chance) {
      craftInventory[l.id] = (craftInventory[l.id] || 0) + 1;
      loot.push(\`💎 \${l.id}\`);
    }
  });
  // Легендарное
  BOSS_LOOT.legendary.forEach(l => {
    if (Math.random() < l.chance) {
      craftInventory[l.id] = (craftInventory[l.id] || 0) + 1;
      loot.push(\`🌟 \${l.id}!\`);
      bossBattle.log.push(\`🌟 ЛЕГЕНДАРКА: \${l.id}!\`);
    }
  });
  // Мифическое
  BOSS_LOOT.mythic.forEach(l => {
    if (Math.random() < l.chance) {
      craftInventory[l.id] = (craftInventory[l.id] || 0) + 1;
      loot.push(\`✨ МИФИЧЕСКОЕ: \${l.id}!!!\`);
      bossBattle.log.push(\`✨ МИФИЧЕСКИЙ ДРОП: \${l.id}!!!\`);
    }
  });

  bossBattle.log.push(\`💰 +\${gold} золота\`);
  bossBattle.log.push(\`⭐ +\${b.exp} опыта\`);
  if (loot.length > 0) bossBattle.log.push(\`📦 Лут: \${loot.join(', ')}\`);

  b.alive = false;
  b.respawnAt = Date.now() + 1800000; // 30 мин
  s.hp = bossBattle.myHp;
  updateStatsHUD();
  renderBossBattleUI();

  setTimeout(() => {
    bossBattle = null;
    closeBossBattle();
  }, 3000);
}

function onBossLose() {
  const s = character.stats;
  s.hp = 1;
  bossBattle = null;
  closeBossBattle();
  setNavStatus('💀 Ты проиграл боссу', '#ff4444');
}

function closeBossBattle() {
  const el = document.getElementById('battlePage');
  if (el) el.remove();
}

window.bossFlee = function() {
  if (!bossBattle) return;
  if (Math.random() < 0.3) {
    const s = character.stats;
    s.hp = bossBattle.myHp;
    bossBattle = null;
    closeBossBattle();
    setNavStatus('🏃 Убежал от босса', '#88ff88');
  } else {
    bossBattle.log.push('❌ Побег не удался!');
    renderBossBattleUI();
    setTimeout(bossTurn, 500);
  }
};

window.bossAuto = function() {
  if (!bossBattle) return;
  bossBattle.auto = !bossBattle.auto;
  const btn = document.getElementById('battleAutoBtn');
  if (btn) {
    btn.textContent = bossBattle.auto ? '🤖 Авто ВКЛ' : '🤖 Авто';
    btn.style.background = bossBattle.auto ? 'linear-gradient(135deg,#2a8a35,#4ade80)' : 'linear-gradient(135deg,#4a4aff,#8a2be2)';
  }
};

// Авто-атака
setInterval(() => {
  if (bossBattle && bossBattle.auto) window.bossAttack();
}, 1000);

// Зелье в бою с боссом
window.bossPotion = function() {
  if (!bossBattle) return;
  const s = character.stats;
  let potionId = null;
  for (const pid of ['hp_great', 'hp_large', 'hp_small', 'potion']) {
    if (craftInventory[pid] > 0) { potionId = pid; break; }
  }
  if (!potionId) {
    bossBattle.log.push('🧪 Нет зелий!');
    renderBossBattleUI();
    return;
  }
  const p = POTIONS[potionId] || { value: 0.3, name: 'Зелье' };
  const heal = Math.floor(s.maxHp * (p.value || 0.3));
  bossBattle.myHp = Math.min(bossBattle.myMaxHp, bossBattle.myHp + heal);
  craftInventory[potionId]--;
  bossBattle.log.push(\`🧪 \${p.name}: +\${heal} HP\`);
  renderBossBattleUI();
};

// Клик по боссу
function findBossAt(worldX, worldY) {
  const half = TILE_SIZE / 2;
  for (const b of activeBosses) {
    if (!b.alive) continue;
    if (Math.abs(worldX - b.x) < half && Math.abs(worldY - b.y) < half) return b;
  }
  return null;
}

// Респавн боссов
setInterval(() => {
  activeBosses.forEach(b => {
    if (!b.alive && Date.now() >= b.respawnAt) {
      b.alive = true;
      b.hp = b.maxHp;
      console.log(\`👑 \${b.name} возродился\`);
    }
  });
}, 60000);

`;

  const anchor = '// ============================================================\n//  СОКЕТЫ';
  if (!content.includes(anchor)) {
    console.warn('  ⚠️  Не найден якорь СОКЕТЫ');
    return false;
  }
  content = content.replace(anchor, code + '\n' + anchor);

  // В startGame — вызываем spawnBosses
  content = content.replace(
    '  spawnPlants();',
    `  spawnPlants();
  spawnBosses();`
  );

  // В draw() — отрисовка боссов после мобов
  content = content.replace(
    '    drawMonsters(ctx, camera);',
    `    drawMonsters(ctx, camera);
    drawBosses(ctx, camera);`
  );

  // Клик по боссу — в handleWorldClick
  content = content.replace(
    `  // Клик по растению
  const clickedPlant = findPlantAt(worldX, worldY);`,
    `  // Клик по боссу
  const clickedBoss = findBossAt(worldX, worldY);
  if (clickedBoss) {
    startBossBattle(clickedBoss);
    return;
  }

  // Клик по растению
  const clickedPlant = findPlantAt(worldX, worldY);`
  );

  content = addMarker(content, 'bosses');
  writeFile(MAIN_FILE, content);
  return true;
}