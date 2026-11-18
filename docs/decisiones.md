 # GameShelf Pro - Registro de Decisiones

## Parte A: Decisiones funcionales

### 1. Unicidad de juegos por perfil
**Decisión:** El sistema no permite duplicados dentro de un mismo perfil. El frontend y el backend comparan el título normalizado con `trim().toLowerCase()`; los títulos pueden repetirse en perfiles distintos. Si ya existe en el perfil activo, se bloquea el alta y se muestra el mensaje exacto: *"El juego ya está en tu biblioteca"*.

### 2. Persistencia al cerrar sesión
**Decisión:** No se pierde ningún dato. Al cerrar sesión solo se elimina el token/sesión activa en el navegador, pero todos los perfiles, videojuegos, horas, logros, lista de deseados y preferencias visuales permanecen almacenados de forma segura en la base de datos del servidor.

### 3. Acceso a perfiles
**Decisión:** Sí, siempre y cuando esos perfiles pertenezcan al propietario de la cuenta que inició sesión. Cada cuenta puede administrar múltiples perfiles internos y cambiar entre ellos libremente, pero el backend bloquea cualquier intento de consultar o modificar perfiles pertenecientes a otro usuario registrado.

### 4. Bloqueo y desbloqueo de cuenta
**Decisión:** El backend lleva un contador de intentos fallidos por cuenta. Al alcanzar los **5 intentos incorrectos**, la cuenta entra en estado `bloqueada` y el sistema genera un código de confirmación enviado al correo electrónico registrado. El usuario debe ingresar manualmente ese código para desbloquear el acceso y volver a iniciar sesión. El código nunca se incluye en respuestas HTTP ni se autocompleta en la interfaz; en desarrollo local, si SMTP no está configurado, se imprime únicamente en la terminal del servidor.

---

## Parte B: Decisiones técnicas adicionales (para evitar ambigüedades)

### 5. Edad del juego
**Decisión:** Se contemplan ambos sentidos habituales: la **clasificación por edad recomendada** (`ATP`, `+7`, `+12`, `+16`, `+18`) como campo obligatorio de filtrado, y el **año de lanzamiento** para calcular automáticamente cuántos años tiene el juego desde su estreno.

### 6. Búsqueda automática de portadas
**Decisión:** El backend expone un endpoint de búsqueda (`/api/juegos/buscar-portada?q=nombre`) que consulta una API pública de videojuegos (RAWG / Wikipedia API con fallback automático) para devolver la portada oficial. Si no hay conexión o no se encuentra imagen, asigna una portada por defecto sin bloquear el guardado.

### 7. Recordatorio del juego menos usado
**Decisión:** Cada videojuego guarda la fecha `ultimaVezJugado` (ISO `YYYY-MM-DD`). El sistema identifica el juego activo con la fecha más antigua (o menor cantidad de horas) y calcula la diferencia en días respecto a la fecha actual (ej. *"Hace 38 días que no jugás a..."*).

### 8. Registro de datos mensuales
**Decisión:** Se crea una tabla `HistorialActividad` en la base de datos que registra cada actualización de horas, logros o juegos terminados con su fecha (`anio`, `mes`), permitiendo calcular con exactitud las estadísticas del mes actual sin depender de estimaciones.

### 9. Temas y contraste automático
**Decisión:** El modo oscuro es el predeterminado y el modo claro está disponible. Los colores se almacenan en `PreferenciasUsuario`. Al aplicar o cambiar el fondo en cualquiera de los temas, se calcula su luminancia y se derivan automáticamente el color del texto, el texto secundario, la superficie de tarjetas y los bordes para mantener el contraste. El texto de los botones también se elige según la luminancia del color primario.

### 10. Stack tecnológico
**Decisión:**
- **Frontend:** HTML5, CSS3 (variables dinámicas + Grid/Flexbox) y JavaScript ES6+ modular.
- **Backend:** Node.js con Express.js, validación estricta en servidor y autenticación con hash de contraseñas.
- **Base de datos:** SQLite (archivo local `database/gameshelf.db` inicializado con `database/schema.sql`) por ser relacional, portable y no requerir instalaciones externas pesadas.
- **Tests:** Suite automatizada con Node Test Runner / Jest + Supertest ejecutando pruebas sobre reglas CRUD, bloqueo por 5 intentos, duplicados y aislamiento de perfiles.