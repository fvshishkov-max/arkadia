// server/index.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = 'arkadia_secret_change_me_in_prod';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// === REST API ===

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, charName, charClass } = req.body;
    if (!username || !password || !charName || !charClass) {
      return res.status(400).json({ error: 'Заполни все поля' });
    }

    if (db.findAccountByUsername(username)) {
      return res.status(400).json({ error: 'Логин занят' });
    }
    if (db.findCharacterByName(charName)) {
      return res.status(400).json({ error: 'Имя персонажа занято' });
    }

    const hash = await bcrypt.hash(password, 10);
    const acc = db.createAccount(username, hash);

    // Случайный город
    const cities = ['Валенсия', 'Драконье Логово', 'Эльфийская Роща'];
    const city = cities[Math.floor(Math.random() * cities.length)];

    const char = db.createCharacter(acc.id, charName, charClass, city);

    const token = jwt.sign({ accountId: acc.id, charId: char.id }, JWT_SECRET);

    res.json({ token, character: char });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const acc = db.findAccountByUsername(username);
    if (!acc) return res.status(400).json({ error: 'Неверный логин или пароль' });

    const ok = await bcrypt.compare(password, acc.password_hash);
    if (!ok) return res.status(400).json({ error: 'Неверный логин или пароль' });

    const char = db.findCharacterByAccountId(acc.id);
    if (!char) return res.status(400).json({ error: 'Персонаж не найден' });

    const token = jwt.sign({ accountId: acc.id, charId: char.id }, JWT_SECRET);
    res.json({ token, character: char });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === Socket.IO — игровой мир ===

const players = new Map(); // socketId → character

io.on('connection', (socket) => {
  console.log(`🔌 Подключился: ${socket.id}`);

  socket.on('join', ({ token }) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const char = db.findCharacterById(decoded.charId);
      if (!char) return socket.emit('error', 'Персонаж не найден');

      players.set(socket.id, {
        id: socket.id,
        charId: char.id,
        name: char.name,
        class: char.class,
        city: char.city,
        x: char.x,
        y: char.y,
        level: char.level,
        hp: char.hp,
        mp: char.mp
      });

      const all = [...players.values()].filter(p => p.id !== socket.id);
      socket.emit('init', { you: players.get(socket.id), players: all });
      socket.broadcast.emit('playerJoined', players.get(socket.id));

      console.log(`✅ ${char.name} (${char.class}) вошёл в ${char.city}. Онлайн: ${players.size}`);
      io.emit('online', players.size);
    } catch (e) {
      socket.emit('error', 'Неверный токен');
    }
  });

  socket.on('move', ({ x, y }) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.x = x;
    p.y = y;
    socket.broadcast.emit('playerMoved', { id: socket.id, x, y });

    // Сохраняем в БД (для MVP — при каждом движении, потом оптимизируем)
    db.updateCharacter(p.charId, { x, y });
  });

  socket.on('disconnect', () => {
    const p = players.get(socket.id);
    if (p) {
      console.log(`❌ ${p.name} вышел. Онлайн: ${players.size - 1}`);
      players.delete(socket.id);
      io.emit('playerLeft', socket.id);
      io.emit('online', players.size);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🎮 Аркадия: Поле Битвы — сервер запущен на http://localhost:${PORT}`);
});