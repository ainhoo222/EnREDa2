-- schema.sql
-- Definición de la tabla `users` para SQLite
-- Ejecuta con: sqlite3 data.sqlite < schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  edad INTEGER CHECK (edad >= 0 AND edad <= 150),
  sexo TEXT,
  sexualidad TEXT,
  altura REAL,
  belleza INTEGER CHECK (belleza >= 1 AND belleza <= 10),
  estudios TEXT,
  created_at DATETIME DEFAULT (datetime('now','localtime'))
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_users_nombre ON users(nombre);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Ejemplos de inserción
-- INSERT INTO users (nombre, edad, sexo, sexualidad, altura, belleza, estudios) VALUES
--   ('Lucía', 28, 'femenino', 'heterosexual', 165.5, 8, 'Licenciatura en Diseño'),
--   ('Carlos', 34, 'masculino', 'bisexual', 178.0, 6, 'Máster en Ingeniería');

-- Para vaciar la tabla (cuidado):
-- DELETE FROM users;
