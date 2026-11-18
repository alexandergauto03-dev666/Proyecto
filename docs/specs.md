 # GameShelf Pro - Especificaciones Técnicas

## 1. Arquitectura del Sistema

    aprojecto/
    ├── docs/                   # Documentación funcional y técnica
    ├── database/
    │   ├── schema.sql          # Definición de tablas y restricciones SQL
    │   └── gameshelf.db        # Base de datos SQLite generada al iniciar
    ├── backend/
    │   ├── package.json        # Dependencias (express, sqlite3/better-sqlite3, bcryptjs, cors, dotenv)
    │   ├── server.js           # Punto de entrada del servidor API
    │   ├── db.js               # Conexión y ejecución de consultas SQL
    │   ├── middleware/
    │   │   └── auth.js         # Verificación de sesión y propiedad de perfil
    │   └── routes/
    │       ├── auth.routes.js  # Registro, login, bloqueo 5 intentos y desbloqueo por correo
    │       ├── perfiles.routes.js
    │       ├── juegos.routes.js # CRUD, duplicados, búsqueda de portada y estadísticas
    │       └── preferencias.routes.js
    ├── frontend/
    │   ├── index.html          # Vistas de Login/Registro y Panel Principal
    │   ├── css/
    │   │   └── styles.css      # Temas claro/oscuro y variables CSS personalizables
    │   └── js/
    │       ├── api.js          # Cliente HTTP hacia el backend
    │       ├── theme.js        # Control de modo oscuro, colores y fondo
    │       ├── ui.js           # Renderizado de tarjetas, estadísticas y recordatorios
    │       └── app.js          # Controlador principal de eventos
    └── tests/
        └── rules.test.js       # Pruebas automatizadas de todas las reglas de negocio

## 2. Esquema de Base de Datos (`database/schema.sql`)

### 2.1 Tabla `usuarios`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `nombre` TEXT NOT NULL
- `email` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `intentos_fallidos` INTEGER DEFAULT 0
- `bloqueado` INTEGER DEFAULT 0 (0 = activo, 1 = bloqueado)
- `codigo_desbloqueo` TEXT NULL
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

### 2.2 Tabla `perfiles`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `usuario_id` INTEGER NOT NULL (FK -> `usuarios.id`)
- `nombre` TEXT NOT NULL
- `avatar` TEXT DEFAULT 'default'

### 2.3 Tabla `videojuegos`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `perfil_id` INTEGER NOT NULL (FK -> `perfiles.id`)
- `titulo` TEXT NOT NULL
- `titulo_normalizado` TEXT NOT NULL
- `descripcion` TEXT
- `genero` TEXT NOT NULL
- `plataforma` TEXT NOT NULL
- `clasificacion_edad` TEXT NOT NULL (`ATP`, `+7`, `+12`, `+16`, `+18`)
- `anio_lanzamiento` INTEGER
- `imagen` TEXT
- `estado` TEXT NOT NULL (`Pendiente`, `Jugando`, `Terminado`, `Deseado`)
- `horas_jugadas` REAL DEFAULT 0
- `logros_obtenidos` INTEGER DEFAULT 0
- `logros_totales` INTEGER DEFAULT 0
- `ultima_vez_jugado` TEXT (Fecha ISO `YYYY-MM-DD`)
- `favorito` INTEGER DEFAULT 0
- `es_deseado` INTEGER DEFAULT 0 (0 = en biblioteca, 1 = lista de deseados)
- Restricción única: `UNIQUE(perfil_id, titulo_normalizado)`

### 2.4 Tabla `actividad_mensual`
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `perfil_id` INTEGER NOT NULL (FK -> `perfiles.id`)
- `anio_mes` TEXT NOT NULL (ej. `2026-11`)
- `horas_sumadas` REAL DEFAULT 0
- `logros_sumados` INTEGER DEFAULT 0
- `juegos_terminados` INTEGER DEFAULT 0

### 2.5 Tabla `preferencias_usuario`
- `usuario_id` INTEGER PRIMARY KEY (FK -> `usuarios.id`)
- `modo_oscuro` INTEGER DEFAULT 1
- `color_primario` TEXT DEFAULT '#42c8e8'
- `color_fondo` TEXT DEFAULT '#10151d'
- `estilo_tarjeta` TEXT DEFAULT 'elevated'

## 3. Reglas de Validación del Backend (Obligatorias)
1. **Juegos únicos por perfil:** Antes de insertar en `videojuegos`, normalizar el título (`trim().toLowerCase()`). La restricción `UNIQUE(perfil_id, titulo_normalizado)` impide duplicados en el mismo perfil; un título sí puede existir en perfiles distintos. Si ya existe para ese `perfil_id`, responder HTTP `409 Conflict` con `{ "error": "El juego ya está en tu biblioteca" }`. El frontend puede validar antes, pero el backend es la autoridad.
2. **Bloqueo tras 5 intentos:** En `POST /api/auth/login`, si la contraseña no coincide, incrementar `intentos_fallidos`. Al llegar a `5`, marcar `bloqueado = 1`, generar `codigo_desbloqueo` de 6 dígitos y enviar el código al correo registrado. Responder HTTP `423 Locked` indicando que se requiere el desbloqueo. Nunca incluir el código en la respuesta HTTP ni autocompletarlo en el frontend. Solo en desarrollo local sin SMTP se permite imprimirlo en la terminal del servidor.
3. **Desbloqueo manual con código:** El usuario debe ingresar manualmente el código recibido por correo y enviarlo a `POST /api/auth/desbloquear`. El backend verifica el código antes de permitir que la cuenta vuelva a iniciar sesión.
4. **Propiedad de perfiles:** Todo endpoint que reciba `perfilId` debe verificar que `perfiles.usuario_id === req.usuario.id`. Si pertenece a otro usuario, responder HTTP `403 Forbidden`.
5. **Integridad numérica:** `horas_jugadas >= 0`, `logros_totales >= 0` y `0 <= logros_obtenidos <= logros_totales`.
6. **Persistencia al cerrar sesión:** El endpoint `POST /api/auth/logout` invalida únicamente la sesión actual sin ejecutar ningún `DELETE` sobre `usuarios`, `perfiles` ni `videojuegos`.
7. **Contraste automático de temas:** Al aplicar o cambiar el fondo, el cliente calcula su luminancia y adapta el texto, el texto secundario, la superficie de tarjetas y los bordes para mantener contraste, tanto en modo claro como oscuro. El texto de los botones se elige según la luminancia del color primario.

## 4. Endpoints Principales de la API
- `POST /api/auth/registro` | `POST /api/auth/login` | `POST /api/auth/desbloquear` | `POST /api/auth/reenviar-codigo` | `POST /api/auth/logout`
- `GET /api/perfiles` | `POST /api/perfiles`
- `GET /api/juegos?perfilId=...` | `POST /api/juegos` | `PUT /api/juegos/:id` | `DELETE /api/juegos/:id`
- `GET /api/juegos/buscar-portada?q=...` (Búsqueda automática de imagen)
- `GET /api/estadisticas/:perfilId` (Devuelve: juego más jugado, juego menos usado + días transcurridos, y resumen mensual)
- `GET /api/preferencias` | `PUT /api/preferencias`

## 5. Interfaz y personalización visual
- El modo oscuro gamer es el predeterminado; el modo claro debe conservar contraste legible.
- Las tarjetas de biblioteca y deseados muestran portada vertical, título, plataforma, clasificación por edad, horas, progreso de logros, estado y acciones según corresponda. En biblioteca se permite sumar una hora; en deseados se puede mover el juego a la biblioteca.
- La barra superior ofrece selector de perfil, alta de perfil, alta de juego y cierre de sesión.
- Al personalizar el fondo, el cliente aplica la Regla 7 de contraste automático; los controles sobre el color primario usan un color de texto contrastante.