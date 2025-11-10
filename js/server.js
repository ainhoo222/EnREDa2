// server.js - Backend simple con Express y SQLite para almacenar usuarios
const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data.sqlite');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Inicializar DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('DB error:', err);
  console.log('Conectado a SQLite en', DB_PATH);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    edad INTEGER,
    sexo TEXT,
    sexualidad TEXT,
    altura REAL,
    belleza INTEGER,
    estudios TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API: registrar usuario
app.post('/api/register', (req, res) => {
  const { nombre, edad, sexo, sexualidad, altura, belleza, estudios } = req.body || {};
  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ error: 'Nombre es obligatorio' });
  }
  const stmt = db.prepare(`INSERT INTO users (nombre, edad, sexo, sexualidad, altura, belleza, estudios) VALUES (?,?,?,?,?,?,?)`);
  stmt.run(
    nombre.trim(),
    Number.isInteger(edad) ? edad : null,
    sexo || null,
    sexualidad || null,
    typeof altura === 'number' ? altura : (altura ? parseFloat(altura) : null),
    belleza ? parseInt(belleza, 10) : null,
    estudios || null,
    function (err) {
      if (err) {
        console.error('DB insert error', err);
        return res.status(500).json({ error: 'Error al guardar usuario' });
      }
      res.json({ id: this.lastID, message: 'Usuario registrado correctamente' });
    }
  );
  stmt.finalize();
});

// API: listar usuarios (para pruebas)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, nombre, edad, sexo, sexualidad, altura, belleza, estudios, created_at FROM users ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error leyendo usuarios' });
    res.json(rows);
  });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Server escuchando en http://localhost:${PORT}`));
