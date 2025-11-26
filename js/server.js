// server.js - Backend completo con autenticación y relaciones
const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');

const DB_PATH = path.join(__dirname, 'data.sqlite');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(session({
  secret: 'enreda2-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error('DB error:', err);
  console.log('Conectado a SQLite en', DB_PATH);
});

// Inicializar tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    fecha_nacimiento DATE,
    sexo TEXT,
    sexualidad TEXT,
    altura REAL,
    belleza INTEGER CHECK (belleza >= 1 AND belleza <= 10),
    estudios TEXT,
    vive TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de personas (contactos)
  db.run(`CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    fecha_nacimiento DATE,
    sexo TEXT,
    sexualidad TEXT,
    altura REAL,
    belleza INTEGER CHECK (belleza >= 1 AND belleza <= 10),
    estudios TEXT,
    vive TEXT,
    comentario TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Tabla de relaciones
  db.run(`CREATE TABLE IF NOT EXISTS relaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    persona_id INTEGER NOT NULL,
    tipo_relacion TEXT NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    intensidad INTEGER DEFAULT 2,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (persona_id) REFERENCES personas(id)
  )`);
});

// Middleware de autenticación
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
}

// ========== RUTAS DE AUTENTICACIÓN ==========

// Registro
app.post('/api/register', async (req, res) => {
  const { username, password, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive } = req.body;

  if (!username || !password || !nombre) {
    return res.status(400).json({ error: 'Usuario, contraseña y nombre son obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, password, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'El usuario ya existe' });
          }
          return res.status(500).json({ error: 'Error en el servidor' });
        }
        
        // Iniciar sesión automáticamente
        req.session.userId = this.lastID;
        req.session.username = username;
        
        res.json({ 
          success: true, 
          message: 'Usuario registrado correctamente',
          user: { id: this.lastID, username, nombre }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Error en el servidor' });
      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ 
        success: true, 
        message: 'Login exitoso',
        user: { id: user.id, username: user.username, nombre: user.nombre }
      });
    }
  );
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logout exitoso' });
});

// ========== RUTAS DE LA APLICACIÓN ==========

// Obtener datos del usuario actual
app.get('/api/user', requireAuth, (req, res) => {
  db.get(
    'SELECT id, username, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Error en el servidor' });
      res.json(user);
    }
  );
});

// Agregar persona
app.post('/api/personas', requireAuth, (req, res) => {
  const { nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive, comentario } = req.body;

  db.run(
    `INSERT INTO personas (user_id, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive, comentario) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.session.userId, nombre, fecha_nacimiento, sexo, sexualidad, altura, belleza, estudios, vive, comentario],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error al guardar persona' });
      res.json({ 
        success: true, 
        message: 'Persona agregada correctamente',
        id: this.lastID 
      });
    }
  );
});

// Obtener todas las personas del usuario
app.get('/api/personas', requireAuth, (req, res) => {
  db.all(
    'SELECT * FROM personas WHERE user_id = ? ORDER BY nombre',
    [req.session.userId],
    (err, personas) => {
      if (err) return res.status(500).json({ error: 'Error al obtener personas' });
      res.json(personas);
    }
  );
});

// Agregar relación
app.post('/api/relaciones', requireAuth, (req, res) => {
  const { persona_id, tipo_relacion, fecha_inicio, fecha_fin, intensidad, notas } = req.body;

  db.run(
    `INSERT INTO relaciones (user_id, persona_id, tipo_relacion, fecha_inicio, fecha_fin, intensidad, notas) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.session.userId, persona_id, tipo_relacion, fecha_inicio, fecha_fin, intensidad, notas],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error al guardar relación' });
      res.json({ 
        success: true, 
        message: 'Relación agregada correctamente',
        id: this.lastID 
      });
    }
  );
});

// Obtener estadísticas básicas
app.get('/api/estadisticas', requireAuth, (req, res) => {
  const stats = {};

  // Estadísticas de personas
  db.get(
    'SELECT COUNT(*) as total_personas FROM personas WHERE user_id = ?',
    [req.session.userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al obtener estadísticas' });
      
      stats.total_personas = result.total_personas;

      // Distribución por sexo
      db.all(
        'SELECT sexo, COUNT(*) as count FROM personas WHERE user_id = ? AND sexo IS NOT NULL GROUP BY sexo',
        [req.session.userId],
        (err, sexoStats) => {
          stats.sexo = sexoStats;

          // Distribución por sexualidad
          db.all(
            'SELECT sexualidad, COUNT(*) as count FROM personas WHERE user_id = ? AND sexualidad IS NOT NULL GROUP BY sexualidad',
            [req.session.userId],
            (err, sexualidadStats) => {
              stats.sexualidad = sexualidadStats;
              res.json(stats);
            }
          );
        }
      );
    }
  );
});

// Ruta para el dashboard (proteger el acceso)
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Ruta principal
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Servidor EnREDa2 ejecutándose en http://localhost:${PORT}`);
  console.log('Base de datos:', DB_PATH);
});