 # GameShelf Pro - Idea del Proyecto

## 1. Resumen del proyecto
GameShelf Pro es una aplicación web full-stack que permite a los usuarios registrados administrar su biblioteca personal de videojuegos, llevar un control detallado de sus horas de juego, logros y estadísticas mensuales, gestionar una lista de deseados y personalizar la apariencia de la interfaz.

## 2. Objetivos del proyecto
- Brindar un sistema seguro con registro e inicio de sesión de usuarios y múltiples perfiles por cuenta.
- Persistir toda la información en una base de datos real mediante un backend con reglas estrictas de validación.
- Registrar videojuegos evitando duplicados y buscando automáticamente sus portadas.
- Llevar seguimiento de horas jugadas, logros desbloqueados, clasificación por edad y estado del juego.
- Detectar automáticamente el juego más jugado y recordar el juego menos usado indicando hace cuánto no se juega.
- Gestionar una lista de deseados separada de los juegos ya adquiridos.
- Mostrar métricas y datos mensuales de actividad.
- Permitir alternar entre modo oscuro/claro y personalizar colores y fondo de la aplicación.
- Garantizar la calidad mediante una suite de pruebas automatizadas (`tests/`).

## 3. Usuarios y Perfiles
- **Cuenta de Usuario:** Persona registrada con nombre, correo electrónico y contraseña.
- **Perfiles del Propietario:** Un usuario autenticado puede crear y alternar entre distintos sub-perfiles propios (por ejemplo: *Principal*, *Competitivo*, *Retro*), manteniendo cada biblioteca aislada. Ningún usuario puede acceder a perfiles de otra cuenta.

## 4. Funcionalidades principales
1. **Autenticación y Seguridad:** Registro, inicio de sesión, cierre de sesión sin pérdida de datos y bloqueo tras 5 intentos fallidos de contraseña con verificación por correo.
2. **Gestión de Biblioteca (CRUD estricto):** Alta, consulta, edición y eliminación de videojuegos con validación de duplicados.
3. **Búsqueda automática de portadas:** Al ingresar el título del juego, la aplicación consulta automáticamente una API externa de videojuegos para sugerir y cargar su imagen de portada (con opción de URL manual o imagen por defecto).
4. **Seguimiento detallado:**
   - Horas jugadas acumuladas y fecha de última sesión.
   - Logros desbloqueados sobre el total de logros del juego.
   - Clasificación por edad del juego (`ATP`, `+7`, `+12`, `+16`, `+18`) y año de lanzamiento.
   - Estado: `Pendiente`, `Jugando`, `Terminado`.
5. **Indicadores inteligentes:**
   - **Juego más jugado:** Tarjeta destacada con el título que acumula más horas.
   - **Recordatorio del juego menos usado:** Aviso visible que indica qué juego tiene menor actividad y hace cuántos días/meses fue la última vez que se jugó.
6. **Lista de deseados (Wishlist):** Sección dedicada para guardar videojuegos que el usuario planea adquirir o jugar a futuro, permitiendo moverlos a la biblioteca con un clic.
7. **Datos mensuales:** Resumen estadístico del mes en curso (horas jugadas en el mes, juegos terminados, logros conseguidos y género predominante).
8. **Personalización visual y Modo Oscuro:** Selector de Modo Claro / Modo Oscuro, cambio de color principal (acento), estilo/color de fondo y guardado automático de preferencias por usuario.
9. **Búsqueda y filtros combinados:** Buscador por nombre y filtros simultáneos por género, plataforma, estado y clasificación por edad.

## 5. Reglas estrictas del proyecto
- No se puede registrar dos veces el mismo videojuego dentro del mismo perfil.
- Al cerrar sesión, ningún dato se elimina; toda la información permanece guardada en la base de datos.
- Solo se puede ingresar a perfiles creados dentro de la cuenta del usuario autenticado.
- Si se ingresa la contraseña incorrectamente 5 veces consecutivas, la cuenta se bloquea temporalmente y exige confirmación por correo electrónico.
- Ningún registro puede guardarse con campos obligatorios vacíos ni valores numéricos inválidos (horas negativas o logros obtenidos mayores al total).