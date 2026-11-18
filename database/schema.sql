PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
  bloqueado INTEGER NOT NULL DEFAULT 0 CHECK (bloqueado IN (0, 1)),
  codigo_desbloqueo TEXT,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perfiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL CHECK (length(trim(nombre)) > 0),
  avatar TEXT NOT NULL DEFAULT 'default',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario ON perfiles(usuario_id);

CREATE TABLE IF NOT EXISTS videojuegos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL CHECK (length(trim(titulo)) > 0),
  titulo_normalizado TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  genero TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  clasificacion_edad TEXT NOT NULL CHECK (clasificacion_edad IN ('ATP', '+7', '+12', '+16', '+18')),
  anio_lanzamiento INTEGER CHECK (anio_lanzamiento IS NULL OR (anio_lanzamiento BETWEEN 1950 AND 2100)),
  imagen TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Jugando', 'Terminado', 'Deseado')),
  horas_jugadas REAL NOT NULL DEFAULT 0 CHECK (horas_jugadas >= 0),
  logros_obtenidos INTEGER NOT NULL DEFAULT 0 CHECK (logros_obtenidos >= 0),
  logros_totales INTEGER NOT NULL DEFAULT 0 CHECK (logros_totales >= 0),
  ultima_vez_jugado TEXT,
  favorito INTEGER NOT NULL DEFAULT 0 CHECK (favorito IN (0, 1)),
  es_deseado INTEGER NOT NULL DEFAULT 0 CHECK (es_deseado IN (0, 1)),
  CHECK (logros_obtenidos <= logros_totales),
  UNIQUE (perfil_id, titulo_normalizado)
);
CREATE INDEX IF NOT EXISTS idx_videojuegos_perfil ON videojuegos(perfil_id);

CREATE TABLE IF NOT EXISTS actividad_mensual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  anio_mes TEXT NOT NULL CHECK (anio_mes GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  horas_sumadas REAL NOT NULL DEFAULT 0 CHECK (horas_sumadas >= 0),
  logros_sumados INTEGER NOT NULL DEFAULT 0 CHECK (logros_sumados >= 0),
  juegos_terminados INTEGER NOT NULL DEFAULT 0 CHECK (juegos_terminados >= 0),
  UNIQUE (perfil_id, anio_mes)
);

CREATE TABLE IF NOT EXISTS preferencias_usuario (
  usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  modo_oscuro INTEGER NOT NULL DEFAULT 1 CHECK (modo_oscuro IN (0, 1)),
  color_primario TEXT NOT NULL DEFAULT '#42c8e8',
  color_fondo TEXT NOT NULL DEFAULT '#10151d',
  estilo_tarjeta TEXT NOT NULL DEFAULT 'elevated'
);
