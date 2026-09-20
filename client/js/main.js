// client/js/main.js
const API = ''; // тот же origin

let token = null;
let character = null;
let socket = null;
let players = new Map(); // id → {name, class, x, y, ...}
let myId = null;
let canvas, ctx;
let camera = { x: 0, y: 0 };
const keys = {};

// === Переключение табов ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  };
});

// === API вызовы ===
async function doLogin() {
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return err.textContent = data.error;
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = 'Ошибка соединения';
  }
}

async function doRegister() {
  const username = document.getElementById('regUser').value;
  const password = document.getElementById('regPass').value;
  const charName = document.getElementById('regCharName').value;
  const charClass = document.getElementById('regClass').value;
  const err = document.getElementById('authError');
  err.textContent = '';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, charName, charClass })
    });
    const data = await res.json();
    if (!res.ok) return err.textContent = data.error;
    onAuthSuccess(data);
  } catch (e) {
    err.textContent = 'Ошибка соединения';
  }
}

function onAuthSuccess(data) {
  token = data.token;
  character = data.character;
  localStorage.setItem('arkadia_token', token);
  startGame();
}

// === Игра ===
function startGame() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');

  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  document.getElementById('charInfo').textContent =
    `${character.name} [${character.class}] Ур.${character.level}`;
  document.getElementById('cityInfo').textContent = `🏰 ${character.city}`;

  connectSocket();
  bindInput();
  requestAnimationFrame(renderLoop);
}

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    socket.emit('join', { token });
  });

  socket.on('init', ({ you, players: others }) => {
    myId = you.id;
    players.clear();
    players.set(you.id, you); // кладём СЕБЯ
    others.forEach(p => players.set(p.id, p));
    camera.x = you.x - canvas.width / 2;
    camera.y = you.y - canvas.height / 2;
    character = { ...character, ...you };
    console.log('🎮 Инициализирован:', you.name, 'в', you.city);
  });

  socket.on('playerJoined', (p) => {
    players.set(p.id, p);
  });

  socket.on('playerMoved', ({ id, x, y }) => {
    const p = players.get(id);
    if (p) { p.x = x; p.y = y; }
  });

  socket.on('playerLeft', (id) => {
    players.delete(id);
  });

  socket.on('online', (n) => {
    document.getElementById('onlineInfo').textContent = `🟢 Онлайн: ${n}`;
  });

  socket.on('error', (msg) => console.error('Socket error:', msg));
}

// === Ввод ===
function bindInput() {
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
}

// === Игровой цикл ===
let lastMove = 0;
function renderLoop(t) {
  const speed = 3;
  let dx = 0, dy = 0;

  if (keys['w'] || keys['arrowup']) dy -= speed;
  if (keys['s'] || keys['arrowdown']) dy += speed;
  if (keys['a'] || keys['arrowleft']) dx -= speed;
  if (keys['d'] || keys['arrowright']) dx += speed;

  const me = players.get(myId) || character;
  if ((dx || dy) && socket && me) {
    me.x = Math.max(0, Math.min(2000, me.x + dx));
    me.y = Math.max(0, Math.min(1500, me.y + dy));
    if (t - lastMove > 50) {
      socket.emit('move', { x: me.x, y: me.y });
      lastMove = t;
    }
  }

  // Камера следует за игроком
  if (me) {
    camera.x += ((me.x - canvas.width / 2) - camera.x) * 0.15;
    camera.y += ((me.y - canvas.height / 2) - camera.y) * 0.15;
  }

  draw();
  requestAnimationFrame(renderLoop);
}

function draw() {
  // Фон — трава
  ctx.fillStyle = '#1a4a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Сетка
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const grid = 64;
  const offsetX = -camera.x % grid;
  const offsetY = -camera.y % grid;
  for (let x = offsetX; x < canvas.width; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = offsetY; y < canvas.height; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Игроки (сортируем по Y — кто ниже, тот поверх)
  const sorted = [...players.values()].sort((a, b) => a.y - b.y);

  sorted.forEach((p) => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    const isMe = p.id === myId;

    // тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 16, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // подсветка под своим персонажем
    if (isMe) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 16, 18, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // тело
    ctx.fillStyle = isMe ? '#ffd700' : '#4a4aff';
    ctx.fillRect(sx - 12, sy - 16, 24, 32);
    ctx.strokeStyle = isMe ? '#ffaa00' : '#2a2aff';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 12, sy - 16, 24, 32);

    // голова
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(sx - 8, sy - 28, 16, 16);
    ctx.strokeStyle = '#cc9966';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, sy - 28, 16, 16);

    // глаза
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 5, sy - 24, 2, 3);
    ctx.fillRect(sx + 3, sy - 24, 2, 3);

    // имя с обводкой
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeText(p.name, sx, sy - 38);
    ctx.fillStyle = isMe ? '#ffd700' : '#ffffff';
    ctx.fillText(p.name, sx, sy - 38);

    // уровень
    ctx.font = '11px Arial';
    ctx.fillStyle = '#aaaaff';
    ctx.fillText('Ур.' + (p.level || 1), sx, sy - 24);
  });

  // Прицел-центр
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(canvas.width/2 - 1, canvas.height/2 - 1, 2, 2);
}

// === Автологин ===
window.addEventListener('load', () => {
  const saved = localStorage.getItem('arkadia_token');
  if (saved) {
    token = saved;
    // Попробуем зайти — но нужен character. Проще: пользователь вводит логин.
    // Для MVP — не автологиним, чистим
    localStorage.removeItem('arkadia_token');
  }
});

// Экспорт в window для inline onclick
window.doLogin = doLogin;
window.doRegister = doRegister;