// server-basic.js - Servidor corregido
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();

const PORT = 3000;
const DB_PATH = './data.sqlite';

// Inicializar base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.log('Creando nueva base de datos...');
  }
  console.log('Base de datos conectada');
});

// Crear tablas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    edad INTEGER,
    sexo TEXT,
    sexualidad TEXT,
    altura REAL,
    belleza INTEGER,
    estudios TEXT,
    vive TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    edad INTEGER,
    sexo TEXT,
    sexualidad TEXT,
    altura REAL,
    belleza INTEGER,
    estudios TEXT,
    vive TEXT,
    comentario TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// Función opcional para agregar datos de prueba al registrar usuario
function agregarDatosDePrueba(userId) {
  const personasPrueba = [
    {
      nombre: "Laura Martínez",
      edad: 28,
      sexo: "femenino",
      sexualidad: "heterosexual",
      altura: 165,
      belleza: 8,
      estudios: "ingeniería informática",
      vive: "bilbao",
      comentario: "Compañera de trabajo"
    },
    {
      nombre: "Carlos Rodríguez",
      edad: 32,
      sexo: "masculino",
      sexualidad: "homosexual",
      altura: 178,
      belleza: 7,
      estudios: "diseño gráfico",
      vive: "madrid",
      comentario: "Amigo de la universidad"
    },
    {
      nombre: "Ana García",
      edad: 25,
      sexo: "femenino",
      sexualidad: "bisexual",
      altura: 162,
      belleza: 9,
      estudios: "medicina",
      vive: "barcelona",
      comentario: "Vecina del edificio"
    }
  ];

  console.log(`📝 Agregando datos de prueba para usuario ${userId}...`);

  personasPrueba.forEach((persona, index) => {
    db.run(
      `INSERT INTO personas (user_id, nombre, edad, sexo, sexualidad, altura, belleza, estudios, vive, comentario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, persona.nombre, persona.edad, persona.sexo, persona.sexualidad, persona.altura, 
       persona.belleza, persona.estudios, persona.vive, persona.comentario],
      function(err) {
        if (err) {
          console.error('Error agregando persona de prueba:', err);
        } else {
          console.log(`✅ Persona de prueba ${index + 1} agregada: ${persona.nombre}`);
        }
      }
    );
  });
}

// Almacenamiento simple de sesiones en memoria
const sessions = new Map();

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function requireAuth(req, res, callback) {
  const cookies = parseCookies(req);
  const sessionToken = cookies.session_token;
  
  if (!sessionToken || !sessions.has(sessionToken)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No autenticado' }));
    return;
  }
  
  const session = sessions.get(sessionToken);
  callback(session.userId);
}

function checkAuth(req) {
  const cookies = parseCookies(req);
  const sessionToken = cookies.session_token;
  return sessionToken && sessions.has(sessionToken) ? sessions.get(sessionToken) : null;
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  return cookies;
}

function setSessionCookie(res, sessionToken) {
  res.setHeader('Set-Cookie', `session_token=${sessionToken}; HttpOnly; Path=/; Max-Age=86400`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'session_token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Servir archivos estáticos
  if (req.method === 'GET' && !pathname.startsWith('/api')) {
    // Verificar autenticación para redirigir al dashboard si está logueado
    if (pathname === '/' || pathname === '/index.html') {
      const session = checkAuth(req);
      if (session) {
        res.writeHead(302, { 'Location': '/dashboard.html' });
        res.end();
        return;
      }
    }
    serveStaticFile(req, res);
    return;
  }

  // API Routes - ORDEN CORREGIDO
  if (req.method === 'POST' && pathname === '/api/register') {
    handleRegister(req, res);
  } else if (req.method === 'POST' && pathname === '/api/login') {
    handleLogin(req, res);
  } else if (req.method === 'POST' && pathname === '/api/logout') {
    handleLogout(req, res);
  } else if (req.method === 'GET' && pathname === '/api/user') {
    requireAuth(req, res, (userId) => handleGetUser(req, res, userId));
  } else if (req.method === 'GET' && pathname === '/api/personas') {
    requireAuth(req, res, (userId) => handleGetPersonas(req, res, userId));
  } else if (req.method === 'POST' && pathname === '/api/personas') {
    requireAuth(req, res, (userId) => handleAddPersona(req, res, userId));
  } else if (req.method === 'DELETE' && pathname.startsWith('/api/personas/')) {
    requireAuth(req, res, (userId) => handleDeletePersona(req, res, userId));
  } else if (req.method === 'GET' && pathname === '/api/estadisticas') {
    requireAuth(req, res, (userId) => handleEstadisticasUsuario(req, res, userId));
    
  // CONSULTAS PÚBLICAS - CORREGIDO
  } else if (req.method === 'POST' && pathname === '/api/consultas') {
    handleConsultasPublicas(req, res);
  } else if (req.method === 'GET' && pathname === '/api/consultas-populares') {
    handleConsultasPopulares(req, res);
  } else if (req.method === 'GET' && pathname === '/api/filtros-opciones') {
    handleFiltrosOpciones(req, res);
  } else {
    serveStaticFile(req, res);
  }
});

// ========== MANEJADORES DE AUTENTICACIÓN ==========
// (Mantener igual que antes)
function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      if (!data.username || !data.password || !data.nombre) {
        sendResponse(res, 400, { error: 'Usuario, contraseña y nombre son obligatorios' });
        return;
      }
      db.get('SELECT id FROM users WHERE username = ?', [data.username], (err, row) => {
        if (err) { sendResponse(res, 500, { error: 'Error en la base de datos' }); return; }
        if (row) { sendResponse(res, 400, { error: 'El usuario ya existe' }); return; }
        db.run(`INSERT INTO users (username, password, nombre, edad, sexo, sexualidad, altura, belleza, estudios, vive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [data.username, data.password, data.nombre, data.edad, data.sexo, data.sexualidad, data.altura, data.belleza, data.estudios, data.vive],
          function(err) {
            if (err) { sendResponse(res, 500, { error: 'Error al crear usuario' }); return; }
            const sessionToken = generateSessionToken();
            const userId = this.lastID;
            sessions.set(sessionToken, { userId: userId, username: data.username, createdAt: new Date() });
            setSessionCookie(res, sessionToken);
            sendResponse(res, 200, { success: true, message: 'Usuario registrado correctamente', user: { id: userId, username: data.username, nombre: data.nombre } });
          }
        );
      });
    } catch (error) { sendResponse(res, 400, { error: 'Datos JSON inválidos' }); }
  });
}

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      db.get('SELECT * FROM users WHERE username = ? AND password = ?', [data.username, data.password], (err, user) => {
        if (err) { sendResponse(res, 500, { error: 'Error en la base de datos' }); return; }
        if (!user) { sendResponse(res, 401, { error: 'Usuario o contraseña incorrectos' }); return; }
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { userId: user.id, username: user.username, createdAt: new Date() });
        setSessionCookie(res, sessionToken);
        sendResponse(res, 200, { success: true, message: 'Login exitoso', user: { id: user.id, username: user.username, nombre: user.nombre } });
      });
    } catch (error) { sendResponse(res, 400, { error: 'Datos JSON inválidos' }); }
  });
}

function handleLogout(req, res) {
  const cookies = parseCookies(req);
  const sessionToken = cookies.session_token;
  if (sessionToken) { sessions.delete(sessionToken); }
  clearSessionCookie(res);
  sendResponse(res, 200, { success: true, message: 'Logout exitoso' });
}

function handleGetUser(req, res, userId) {
  db.get('SELECT id, username, nombre, edad, sexo, sexualidad, altura, belleza, estudios, vive FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) { sendResponse(res, 500, { error: 'Error en la base de datos' }); return; }
    if (!user) { sendResponse(res, 404, { error: 'Usuario no encontrado' }); return; }
    sendResponse(res, 200, user);
  });
}

// ========== MANEJADORES DE PERSONAS ==========
// (Mantener igual que antes)
function handleGetPersonas(req, res, userId) {
  db.all('SELECT * FROM personas WHERE user_id = ? ORDER BY nombre', [userId], (err, personas) => {
    if (err) { sendResponse(res, 500, { error: 'Error al obtener personas' }); return; }
    sendResponse(res, 200, personas);
  });
}

function handleAddPersona(req, res, userId) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      db.run(`INSERT INTO personas (user_id, nombre, edad, sexo, sexualidad, altura, belleza, estudios, vive, comentario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, data.nombre, data.edad, data.sexo, data.sexualidad, data.altura, data.belleza, data.estudios, data.vive, data.comentario],
        function(err) {
          if (err) { sendResponse(res, 500, { error: 'Error al guardar persona' }); return; }
          sendResponse(res, 200, { success: true, message: 'Persona agregada correctamente', id: this.lastID });
        }
      );
    } catch (error) { sendResponse(res, 400, { error: 'Datos JSON inválidos' }); }
  });
}

function handleDeletePersona(req, res, userId) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const matches = pathname.match(/^\/api\/personas\/(\d+)$/);
  if (!matches) { sendResponse(res, 400, { error: 'ID de persona inválido' }); return; }
  const personaId = parseInt(matches[1]);
  db.get('SELECT id FROM personas WHERE id = ? AND user_id = ?', [personaId, userId], (err, persona) => {
    if (err) { sendResponse(res, 500, { error: 'Error en la base de datos' }); return; }
    if (!persona) { sendResponse(res, 404, { error: 'Persona no encontrada o no tienes permisos' }); return; }
    db.run('DELETE FROM personas WHERE id = ? AND user_id = ?', [personaId, userId], function(err) {
      if (err) { sendResponse(res, 500, { error: 'Error al eliminar persona' }); return; }
      if (this.changes === 0) { sendResponse(res, 404, { error: 'Persona no encontrada' }); return; }
      sendResponse(res, 200, { success: true, message: 'Persona eliminada correctamente' });
    });
  });
}

// ========== ESTADÍSTICAS DEL USUARIO ==========
function handleEstadisticasUsuario(req, res, userId) {
  const stats = {};
  
  // Total personas del usuario
  db.get('SELECT COUNT(*) as total FROM personas WHERE user_id = ?', [userId], (err, result) => {
    if (err) {
      console.error('Error en estadísticas:', err);
      sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
      return;
    }
    
    stats.total_personas = result.total;

    // Si no hay personas, enviar estadísticas vacías
    if (result.total === 0) {
      stats.mensaje = "No tienes personas agregadas todavía";
      sendResponse(res, 200, stats);
      return;
    }

    // Distribución por sexo - CORREGIDO
    db.all('SELECT sexo, COUNT(*) as count FROM personas WHERE user_id = ? AND sexo IS NOT NULL AND sexo != "" GROUP BY sexo', 
    [userId], (err, sexoStats) => {
      if (err) {
        console.error('Error en estadísticas por sexo:', err);
        sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
        return;
      }
      stats.por_sexo = sexoStats;

      // Distribución por sexualidad - CORREGIDO
      db.all('SELECT sexualidad, COUNT(*) as count FROM personas WHERE user_id = ? AND sexualidad IS NOT NULL AND sexualidad != "" GROUP BY sexualidad', 
      [userId], (err, sexualidadStats) => {
        if (err) {
          console.error('Error en estadísticas por sexualidad:', err);
          sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
          return;
        }
        stats.por_sexualidad = sexualidadStats;

        // Distribución por estudios - CORREGIDO
        db.all('SELECT estudios, COUNT(*) as count FROM personas WHERE user_id = ? AND estudios IS NOT NULL AND estudios != "" GROUP BY estudios', 
        [userId], (err, estudiosStats) => {
          if (err) {
            console.error('Error en estadísticas por estudios:', err);
            sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
            return;
          }
          stats.por_estudios = estudiosStats;

          // Distribución por ciudad - CORREGIDO
          db.all('SELECT vive, COUNT(*) as count FROM personas WHERE user_id = ? AND vive IS NOT NULL AND vive != "" GROUP BY vive', 
          [userId], (err, ciudadStats) => {
            if (err) {
              console.error('Error en estadísticas por ciudad:', err);
              sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
              return;
            }
            stats.por_ciudad = ciudadStats;

            // Promedios - NUEVO: calcular promedios de edad, belleza y altura
            db.get(`SELECT 
              AVG(edad) as promedio_edad,
              AVG(belleza) as promedio_belleza,
              AVG(altura) as promedio_altura,
              COUNT(edad) as total_con_edad,
              COUNT(belleza) as total_con_belleza,
              COUNT(altura) as total_con_altura
              FROM personas WHERE user_id = ?`, [userId], (err, promedios) => {
              if (err) {
                console.error('Error en promedios:', err);
                sendResponse(res, 500, { error: 'Error al obtener estadísticas' });
                return;
              }

              stats.promedio_edad = promedios.promedio_edad ? parseFloat(promedios.promedio_edad).toFixed(1) : 0;
              stats.promedio_belleza = promedios.promedio_belleza ? parseFloat(promedios.promedio_belleza).toFixed(1) : 0;
              stats.promedio_altura = promedios.promedio_altura ? parseFloat(promedios.promedio_altura).toFixed(1) : 0;
              stats.total_con_edad = promedios.total_con_edad;
              stats.total_con_belleza = promedios.total_con_belleza;
              stats.total_con_altura = promedios.total_con_altura;

              sendResponse(res, 200, stats);
            });
          });
        });
      });
    });
  });
}

// ========== CONSULTAS PÚBLICAS ==========
function handleConsultasPublicas(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const { consulta, filtros } = JSON.parse(body);
      if (!consulta) { sendResponse(res, 400, { error: 'La consulta es requerida' }); return; }

      let sql = `SELECT sexo, sexualidad, estudios, vive, belleza, altura, edad FROM personas WHERE 1=1`;
      const params = [];

      if (filtros.ciudad && filtros.ciudad !== 'todas') {
        sql += ' AND LOWER(vive) = ?';
        params.push(filtros.ciudad.toLowerCase());
      }
      if (filtros.sexo && filtros.sexo !== 'todos') {
        sql += ' AND LOWER(sexo) = ?';
        params.push(filtros.sexo.toLowerCase());
      }
      if (filtros.sexualidad && filtros.sexualidad !== 'todas') {
        sql += ' AND LOWER(sexualidad) = ?';
        params.push(filtros.sexualidad.toLowerCase());
      }
      if (filtros.estudios && filtros.estudios !== 'todos') {
        sql += ' AND LOWER(estudios) = ?';
        params.push(filtros.estudios.toLowerCase());
      }
      if (filtros.edad_min) {
        sql += ' AND edad >= ?';
        params.push(parseInt(filtros.edad_min));
      }
      if (filtros.edad_max) {
        sql += ' AND edad <= ?';
        params.push(parseInt(filtros.edad_max));
      }
      if (filtros.belleza_min) {
        sql += ' AND belleza >= ?';
        params.push(parseInt(filtros.belleza_min));
      }
      if (filtros.belleza_max) {
        sql += ' AND belleza <= ?';
        params.push(parseInt(filtros.belleza_max));
      }

      db.all(sql, params, (err, resultados) => {
        if (err) { sendResponse(res, 500, { error: 'Error en la consulta' }); return; }
        const estadisticas = generarEstadisticas(resultados);
        sendResponse(res, 200, { consulta: consulta, total_resultados: resultados.length, estadisticas: estadisticas, resultados_muestra: resultados.slice(0, 10) });
      });
    } catch (error) { sendResponse(res, 400, { error: 'Datos JSON inválidos' }); }
  });
}

function handleConsultasPopulares(req, res) {
  const consultasPopulares = [
    { id: 1, nombre: "Personas de Bilbao heterosexuales", descripcion: "Estadísticas de personas que viven en Bilbao y son heterosexuales", filtros: { ciudad: "bilbao", sexualidad: "heterosexual" }},
    { id: 2, nombre: "Estudiantes de ingeniería", descripcion: "Personas que estudian o han estudiado ingeniería", filtros: { estudios: "ingeniería" }},
    { id: 3, nombre: "Jóvenes de 18-25 años", descripcion: "Estadísticas del grupo de edad 18-25 años", filtros: { edad_min: 18, edad_max: 25 }},
    { id: 4, nombre: "Personas con alta belleza", descripcion: "Personas con puntuación de belleza 8-10", filtros: { belleza_min: 8, belleza_max: 10 }},
    { id: 5, nombre: "Mujeres bisexuales", descripcion: "Estadísticas de mujeres bisexuales", filtros: { sexo: "femenino", sexualidad: "bisexual" }}
  ];
  sendResponse(res, 200, consultasPopulares);
}

function handleFiltrosOpciones(req, res) {
  const opciones = {};
  
  // Obtener TODAS las ciudades (sin filtrar por user_id)
  db.all('SELECT DISTINCT LOWER(vive) as ciudad FROM personas WHERE vive IS NOT NULL AND vive != ""', (err, ciudades) => {
    opciones.ciudades = ciudades.map(c => c.ciudad).filter(c => c).sort();
    
    // Obtener TODOS los estudios
    db.all('SELECT DISTINCT LOWER(estudios) as estudio FROM personas WHERE estudios IS NOT NULL AND estudios != ""', (err, estudios) => {
      opciones.estudios = estudios.map(e => e.estudio).filter(e => e).sort();
      
      // Obtener TODAS las sexualidades
      db.all('SELECT DISTINCT LOWER(sexualidad) as sexualidad FROM personas WHERE sexualidad IS NOT NULL AND sexualidad != ""', (err, sexualidades) => {
        opciones.sexualidades = sexualidades.map(s => s.sexualidad).filter(s => s).sort();
        
        // Obtener TODOS los sexos
        db.all('SELECT DISTINCT LOWER(sexo) as sexo FROM personas WHERE sexo IS NOT NULL AND sexo != ""', (err, sexos) => {
          opciones.sexos = sexos.map(s => s.sexo).filter(s => s).sort();
          
          sendResponse(res, 200, opciones);
        });
      });
    });
  });
}

// ========== FUNCIONES AUXILIARES ==========
function serveStaticFile(req, res) {
  let filePath = '.' + req.url;
  if (filePath === './') { filePath = './index.html'; }
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.css': contentType = 'text/css'; break;
    case '.js': contentType = 'application/javascript'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code === 'ENOENT') {
        fs.readFile('./index.html', (error, content) => {
          if (error) { res.writeHead(404); res.end('Página no encontrada'); } 
          else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(content, 'utf-8'); }
        });
      } else { res.writeHead(500); res.end('Error del servidor: '+error.code); }
    } else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content, 'utf-8'); }
  });
}

function generarEstadisticas(resultados) {
  if (resultados.length === 0) { return { mensaje: "No hay resultados para mostrar estadísticas" }; }
  const stats = { total: resultados.length, por_sexo: {}, por_sexualidad: {}, por_estudios: {}, por_ciudad: {}, promedio_edad: 0, promedio_belleza: 0, promedio_altura: 0 };
  let sumaEdad = 0, sumaBelleza = 0, sumaAltura = 0;
  let contadoresValidos = { edad: 0, belleza: 0, altura: 0 };

  resultados.forEach(persona => {
    if (persona.sexo) { stats.por_sexo[persona.sexo] = (stats.por_sexo[persona.sexo] || 0) + 1; }
    if (persona.sexualidad) { stats.por_sexualidad[persona.sexualidad] = (stats.por_sexualidad[persona.sexualidad] || 0) + 1; }
    if (persona.estudios) { const estudioKey = persona.estudios.toLowerCase(); stats.por_estudios[estudioKey] = (stats.por_estudios[estudioKey] || 0) + 1; }
    if (persona.vive) { const ciudadKey = persona.vive.toLowerCase(); stats.por_ciudad[ciudadKey] = (stats.por_ciudad[ciudadKey] || 0) + 1; }
    if (persona.edad) { sumaEdad += persona.edad; contadoresValidos.edad++; }
    if (persona.belleza) { sumaBelleza += persona.belleza; contadoresValidos.belleza++; }
    if (persona.altura) { sumaAltura += persona.altura; contadoresValidos.altura++; }
  });

  stats.promedio_edad = contadoresValidos.edad > 0 ? (sumaEdad / contadoresValidos.edad).toFixed(1) : 0;
  stats.promedio_belleza = contadoresValidos.belleza > 0 ? (sumaBelleza / contadoresValidos.belleza).toFixed(1) : 0;
  stats.promedio_altura = contadoresValidos.altura > 0 ? (sumaAltura / contadoresValidos.altura).toFixed(1) : 0;
  return stats;
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor EnREDa2 ejecutándose en http://localhost:${PORT}`);
  console.log('📊 Base de datos: data.sqlite');
  console.log('🔐 Sistema de autenticación activado');
  console.log('💡 Redirección automática: usuarios logueados van al dashboard');
});