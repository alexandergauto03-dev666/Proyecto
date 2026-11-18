 # GameShelf Pro - Plan de Tareas (Tasks)

## Etapa 1: Documentación
- **ID:** T-01
- **Tarea:** Actualizar los 7 documentos en `docs/` con las reglas de frontend, backend, base de datos, tests y preguntas abiertas.
- **Agente:** Agente Documentador
- **Dependencias:** Ninguna
- **Cobertura:** Todo el alcance funcional y técnico
- **Estado:** Completado
- **Criterios de terminación:** Los 7 archivos están guardados en `docs/` sin reglas ambiguas.

---

## Etapa 2: Base de Datos y Autenticación
- **ID:** T-02
- **Tarea:** Crear `database/schema.sql` y configurar la conexión SQLite en `backend/db.js`.
- **Agente:** Agente Backend/DB
- **Dependencias:** T-01
- **Cobertura:** `specs.md` - Sección 2
- **Estado:** Completado
- **Criterios de terminación:** Al iniciar el servidor se crean automáticamente todas las tablas y restricciones `UNIQUE`.

- **ID:** T-03
- **Tarea:** Implementar registro, login, logout sin borrado de datos, bloqueo tras 5 intentos fallidos y desbloqueo por confirmación de correo en `backend/routes/auth.routes.js`.
- **Agente:** Agente Backend/Seguridad
- **Dependencias:** T-02
- **Cobertura:** `decisiones.md` (Preguntas 2 y 4); `specs.md` - Sección 3.2
- **Estado:** Completado
- **Criterios de terminación:** Al fallar 5 veces la contraseña bloquea la cuenta y exige el código de correo para reactivarla; cerrar sesión conserva todos los datos.

- **ID:** T-04
- **Tarea:** Implementar gestión de perfiles múltiples por propietario en `backend/routes/perfiles.routes.js` y middleware de propiedad en `backend/middleware/auth.js`.
- **Agente:** Agente Backend/Seguridad
- **Dependencias:** T-03
- **Cobertura:** `decisiones.md` (Pregunta 3); `specs.md` - Sección 3.3
- **Estado:** Completado
- **Criterios de terminación:** Un usuario puede crear y alternar entre sus propios perfiles, pero recibe error `403` si intenta acceder a perfiles de otra cuenta.

---

## Etapa 3: API de Videojuegos, Portadas, Estadísticas y Preferencias
- **ID:** T-05
- **Tarea:** Implementar CRUD de videojuegos y lista de deseados en `backend/routes/juegos.routes.js` con validación estricta de duplicados, horas, logros y edad del juego.
- **Agente:** Agente Backend Full
- **Dependencias:** T-04
- **Cobertura:** `decisiones.md` (Pregunta 1); `specs.md` - Sección 3.1 y 3.4
- **Estado:** Completado
- **Criterios de terminación:** Intentar agregar un juego repetido en el mismo perfil devuelve error indicando *"El juego ya está en tu biblioteca"*.

- **ID:** T-06
- **Tarea:** Implementar endpoint de búsqueda automática de imágenes (`GET /api/juegos/buscar-portada`) y endpoint de estadísticas (`GET /api/estadisticas/:perfilId`) con juego más jugado, recordatorio del menos usado (con días transcurridos) y datos mensuales.
- **Agente:** Agente Backend Full
- **Dependencias:** T-05
- **Cobertura:** `idea.md` - Sección 4.3, 4.5 y 4.7
- **Estado:** Completado
- **Criterios de terminación:** Devuelve portada automática por nombre y calcula correctamente horas máximas, días desde la última sesión del menos jugado y métricas del mes actual.

- **ID:** T-07
- **Tarea:** Implementar `backend/routes/preferencias.routes.js` para guardar modo oscuro, color primario y color de fondo por usuario.
- **Agente:** Agente Backend Full
- **Dependencias:** T-03
- **Cobertura:** `idea.md` - Sección 4.8
- **Estado:** Completado
- **Criterios de terminación:** Las preferencias visuales se guardan y recuperan al iniciar sesión nuevamente.

---

## Etapa 4: Frontend Completo y Personalizable
- **ID:** T-08
- **Tarea:** Crear vistas de Login/Registro/Desbloqueo por correo y selector de perfiles del usuario en `frontend/index.html` y `frontend/js/api.js`.
- **Agente:** Agente Frontend
- **Dependencias:** T-04
- **Cobertura:** `idea.md` - Sección 3 y 4.1
- **Estado:** Completado
- **Criterios de terminación:** Permite registrarse, iniciar sesión, desbloquear tras 5 fallos, cambiar entre perfiles propios y cerrar sesión conservando datos.

- **ID:** T-09
- **Tarea:** Implementar interfaz principal con CRUD de biblioteca, búsqueda automática de portada en el formulario, horas, logros, edad del juego, filtros y pestaña de Lista de Deseados.
- **Agente:** Agente Frontend
- **Dependencias:** T-06, T-08
- **Cobertura:** `idea.md` - Sección 4.2 a 4.6
- **Estado:** Completado
- **Criterios de terminación:** Todas las operaciones CRUD, alertas de duplicados y cambio entre biblioteca y deseados funcionan conectadas al backend.

- **ID:** T-10
- **Tarea:** Implementar paneles visuales de Juego Más Jugado, Recordatorio del Menos Usado ("hace cuánto"), Datos Mensuales y el panel de Modo Oscuro / Personalización de colores y fondo (`frontend/js/theme.js`).
- **Agente:** Agente UI/Frontend
- **Dependencias:** T-07, T-09
- **Cobertura:** `idea.md` - Sección 4.5, 4.7 y 4.8
- **Estado:** Completado
- **Criterios de terminación:** Cambiar modo oscuro, color principal o fondo actualiza la interfaz en tiempo real y persiste en la base de datos.

---

## Etapa 5: Pruebas Automatizadas y Cierre
- **ID:** T-11
- **Tarea:** Crear y ejecutar `tests/rules.test.js` probando: alta válida, rechazo de juego duplicado, bloqueo por 5 contraseñas incorrectas y desbloqueo por correo, acceso a perfiles propios vs ajenos, persistencia tras logout y cálculo de estadísticas.
- **Agente:** Agente QA / Testing
- **Dependencias:** T-07
- **Cobertura:** Todas las reglas de `specs.md` y `decisiones.md`
- **Estado:** Completado
- **Criterios de terminación:** Todos los tests automatizados pasan en verde (`PASS`).

- **ID:** T-12
- **Tarea:** Actualizar `docs/README.md` con instrucciones de instalación (`npm install`, inicio del servidor y ejecución de tests) y verificar funcionamiento completo.
- **Agente:** Agente Documentador / QA
- **Dependencias:** T-10, T-11
- **Cobertura:** Todo el proyecto
- **Estado:** Completado
- **Criterios de terminación:** Proyecto completo, probado y listo para entrega y presentación.