// server/db.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'arkadia.json');

// Структура БД по умолчанию
const defaultDB = {
  accounts: [],
  characters: [],
  nextAccountId: 1,
  nextCharId: 1
};

// Загрузка
let data;
if (fs.existsSync(DB_PATH)) {
  try {
    data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log('✅ База данных загружена');
  } catch (e) {
    console.error('⚠️ Ошибка чтения БД, создаём новую');
    data = { ...defaultDB };
  }
} else {
  data = { ...defaultDB };
  saveDB();
  console.log('✅ База данных создана');
}

// Сохранение
export function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// === API для работы с БД ===

export const db = {
  // Аккаунты
  findAccountByUsername(username) {
    return data.accounts.find(a => a.username === username);
  },

  createAccount(username, passwordHash) {
    const acc = {
      id: data.nextAccountId++,
      username,
      password_hash: passwordHash,
      created_at: Math.floor(Date.now() / 1000)
    };
    data.accounts.push(acc);
    saveDB();
    return acc;
  },

  // Персонажи
  findCharacterByName(name) {
    return data.characters.find(c => c.name === name);
  },

  findCharacterByAccountId(accountId) {
    return data.characters.find(c => c.account_id === accountId);
  },

  findCharacterById(id) {
    return data.characters.find(c => c.id === id);
  },

  createCharacter(accountId, name, charClass, city, x = 400, y = 300) {
    const char = {
      id: data.nextCharId++,
      account_id: accountId,
      name,
      class: charClass,
      city,
      level: 1,
      exp: 0,
      hp: 100,
      mp: 50,
      str: 5,
      agi: 5,
      int: 5,
      vit: 5,
      luck: 5,
      x,
      y,
      created_at: Math.floor(Date.now() / 1000)
    };
    data.characters.push(char);
    saveDB();
    return char;
  },

  updateCharacter(id, updates) {
    const char = this.findCharacterById(id);
    if (!char) return null;
    Object.assign(char, updates);
    saveDB();
    return char;
  }
};

export default db;