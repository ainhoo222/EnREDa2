-- schema.sql
-- Definición de la tabla `users` para SQLite
-- Ejecuta con: sqlite3 data.sqlite < schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  nombreUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
  contraseña TEXT NOT NULL,
  nombre TEXT NOT NULL,
  fechaNacimiento DATE NOT NULL,
  sexo TEXT,
  sexualidad TEXT,
  altura REAL,
  belleza INTEGER CHECK (belleza >= 1 AND belleza <= 10),
  estudios TEXT,
  vive TEXT,
  kont INTEGER,
  created_at DATETIME DEFAULT (datetime('now','localtime'))
);

CREATE VIEW IF NOT EXISTS UsuarioConEdad AS
SELECT
  nombreUsuario,
  contraseña,
  nombre,
  fechaNacimiento,
  sexo,
  sexualidad,
  altura,
  belleza,
  estudios,
  vive,
  kont,
  created_at,
  (strftime('%Y', 'now') - strftime('%Y', fecha_nacimiento))
  - (strftime('%m-%d', 'now') < strftime('%m-%d', fecha_nacimiento)) AS edad
FROM Persona;

SELECT * FROM UsuarioConEdad;

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive) 
VALUES('ainhoo222', 'Ainhoa', 'Ainhoa Tomas', '2005-05-10', 
'Femenino', 'bisexual', 1.65, 10, 'Ingenieria informatica', 'Txurdinaga');

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Lucia', 'Lucia', 'Lucia del Rio', '2005-05-26', 
'Femenino', 'heterosexual', 1.63, 10, 'Ingenieria informatica', 'Balmaseda', 5);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Asier', 'Asier', 'Asier las Hayas', '2005-04-18', 
'Masculino', 'heterosexual', 1.73, 10, 'Ingenieria informatica', 'Gazteiz', 1);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Aimar', 'Aimar', 'Aimar Bazteretxea', '2003-07-22', 
'Maculino', 'Homosexual', 1.75, 10, 'Ingenieria informatica', 'Bizkaia', 9);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Surya', 'Surya', 'Surya Ortega', '2005-05-06', 
'Maculino', 'heterosexual', 1.83, 10, 'Ingenieria informatica', 'Bakio', 0);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Ane', 'Ane', 'Ane Moreno', '2004-09-23', 
'Femenino', 'Lesbiana', 1.70, 10, 'Ingenieria informatica', 'Bolueta', 7);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Unai', 'Unai', 'Unai Rodriguez', '2004-09-23', 
'Femenino', 'Lesbiana', 1.70, 10, 'Ingenieria informatica', 'Bolueta', 7);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Lander', 'Lander', 'Lander Sanchez', '2005-03-22', 'Maculino', 
'Heterosexual', 1.73, 10, 'Administracion y Direcion de Enpresas', 'Santutxu', 17);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Ainara', 'Ainara', 'Ainara Juncay', '2005-09-30', 'Femenino', 
'Heterosexual', 1.61, 10, 'Enfermeria', 'Santutxu', 3);

INSERT INTO users(nombreUsuario, contraseña, nombre, fechaNacimiento, sexo, sexualidad, 
altura, belleza, estudios, vive, kont) 
VALUES('Iraia', 'Iraia', 'Iraia Menor', '2005-03-08', 'Femenino', 
'Heterosexual', 1.68, 10, 'Medicina', 'Txurdinaga', 18);

CREATE TABLE IF NOT EXISTS Persona (
  nombreUsuario INTEGER NOT NULL,
  nombre TEXT,
  fecha_nacimiento DATE NOT NULL,
  sexo TEXT,
  sexualidad TEXT,
  altura REAL,
  belleza INTEGER CHECK (belleza >= 1 AND belleza <= 10),
  estudios TEXT,
  vive TEXT,
  comentario VARCHAR(1000),
  created_at DATETIME DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (nombreUsuario) REFERENCES users(nombreUsuario)
);

CREATE VIEW IF NOT EXISTS PersonaConEdad AS
SELECT
  nombreUsuario,
  nombre,
  fecha_nacimiento,
  sexo,
  sexualidad,
  altura,
  belleza,
  estudios,
  vive,
  comentario,
  created_at,
  (strftime('%Y', 'now') - strftime('%Y', fecha_nacimiento))
  - (strftime('%m-%d', 'now') < strftime('%m-%d', fecha_nacimiento)) AS edad
FROM Persona;

SELECT * FROM PersonaConEdad;

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Lander Sanchez', '2005-03-22', 
'masculino', 'heterosexual', 1.76, 7, 'ADE', 'Bilbao', 'El que no vale pa ade');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Alejandra Bernabal', '2003-11-10', 
'femenino', 'heterosexual', 1.62, 6, 'Desconocido', 'Salamanca', 'Hetero hasta que me entero');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Nayra', '2005-01-01', 
'femenino', 'lesbiana', 1.61, 2, 'Desconocido', 'Bilbao', 'Mejor no pasar por eso');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Joseba', '2003-01-01', 
'masculino', 'heterosexual', 1.80, 8, 'Desconocido', 'Durango', 'Muy chulito');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Raquel (rachel)', '2000-12-03', 
'femenino', 'bisexual', 1.61, 7, 'Diseño grafico', 'Valencia', 'Tatuajes a domicilio');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Stephanie', '2002-01-01', 
'femenino', 'heterosexual', 1.61, 9, 'Desconocido', 'Uruguay', 'Hetero curiosa de erasmus');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Jorge (cucu)', '2002-01-01', 
'masculino', 'heterosexual', 1.70, 2, 'Rapero', 'Madrid', 'Que me quiten el alcohol de las manos');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Daniela Tomas', '2001-08-07', 
'femenino', 'bisexual', 1.68, 7, 'Trabajo social', 'Portugalete', 'Sin comentarios');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Leire', '2000-01-01', 
'femenino', 'bisexual', 1.61, 6, 'Cafid', 'Arrigorriaga', 'Amiga de Xabi');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Aritz', '2005-01-01', 
'masculino', 'heterosexual', 1.70, 6, 'Ingenieria informatica', 'Bilbao', 'de catellano');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Javi (el guapo)', '1999-01-01', 
'masculino', 'heterosexual', 1.75, 7, 'Biologia', 'Zamora', 'Tiene tierras');

INSERT INTO Persona(nombreUsuario, nombre, fecha_nacimiento, sexo, sexualidad, altura,
belleza, estudios, vive, comentario) VALUES('ainhoo222', 'Aitor (remi)', '1999-01-01', 
'masculino', 'heterosexual', 1.78, 9, 'Desconocido', 'Leioa', 'Que me quiten el alcohol');

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_users_nombre ON users(nombre);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Ejemplos de inserción
-- INSERT INTO users (nombre, edad, sexo, sexualidad, altura, belleza, estudios) VALUES
--   ('Lucía', 28, 'femenino', 'heterosexual', 165.5, 8, 'Licenciatura en Diseño'),
--   ('Carlos', 34, 'masculino', 'bisexual', 178.0, 6, 'Máster en Ingeniería');

-- Para vaciar la tabla (cuidado):
-- DELETE FROM users;
