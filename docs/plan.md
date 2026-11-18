 # GameShelf Pro - Plan de Desarrollo

## Etapa 1: Documentación y Reglas del Sistema (`docs/`)
- Definir alcance, preguntas abiertas, esquema de base de datos, contratos de API y plan de tareas sin ambigüedades.

## Etapa 2: Base de Datos y Backend Core (`database/` y `backend/`)
- Crear `database/schema.sql` e inicializar SQLite.
- Configurar servidor Express en `backend/`, middleware de sesión y rutas de autenticación con bloqueo a los 5 intentos fallidos y desbloqueo por correo.
- Implementar gestión de perfiles aislados por cuenta propietaria.

## Etapa 3: API de Videojuegos, Búsqueda de Portadas y Estadísticas
- Implementar CRUD con validación estricta de duplicados (*"El juego ya está en tu biblioteca"*).
- Implementar endpoint de búsqueda automática de portadas por nombre.
- Implementar cálculo de juego más jugado, recordatorio de juego menos usado con días transcurridos, lista de deseados y datos mensuales.
- Implementar endpoints de preferencias visuales por usuario.

## Etapa 4: Frontend Interactivo y Personalizable (`frontend/`)
- Maquetar pantalla de Acceso (Login / Registro / Desbloqueo por correo) y Dashboard principal.
- Conectar `api.js` con el servidor y gestionar cierre de sesión sin pérdida de datos.
- Implementar tarjetas con horas, logros, edad del juego, botón de búsqueda automática de imagen, pestaña de lista de deseados, banner de recordatorio y panel de estadísticas mensuales.
- Implementar selector de Modo Oscuro, color primario y fondo personalizable.

## Etapa 5: Pruebas Automatizadas y Documentación Final (`tests/` y `README.md`)
- Ejecutar pruebas automatizadas verificando todas las reglas críticas.
- Actualizar `README.md` con instrucciones de instalación y ejecución.