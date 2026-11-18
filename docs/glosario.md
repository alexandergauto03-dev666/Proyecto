 # GameShelf Pro - Glosario de Funciones y Conceptos

- **Autenticación y Bloqueo por Intentos:** Mecanismo que bloquea la cuenta tras 5 intentos incorrectos y requiere un código enviado por correo, ingresado manualmente, para desbloquearla.
- **Perfiles del Propietario:** Sub-bibliotecas independientes dentro de una misma cuenta de usuario registrada.
- **Juegos Únicos por Perfil:** No se permite registrar dos veces el mismo título en un perfil; la unicidad no se comparte entre perfiles distintos.
- **Validación de Duplicados:** Control en backend y base de datos que impide registrar dos veces el mismo título en un perfil.
- **Búsqueda Automática de Portadas:** Consulta automatizada por nombre del videojuego para obtener su imagen oficial sin carga manual.
- **Horas Jugadas y Más Jugado:** Registro acumulativo de tiempo de juego que permite destacar automáticamente el título con mayor cantidad de horas.
- **Logros:** Seguimiento numérico y porcentual de los logros desbloqueados respecto al total disponible del juego.
- **Edad del Juego:** Clasificación por edad recomendada (`ATP`, `+7`, `+12`, `+16`, `+18`) junto al año de estreno.
- **Recordatorio de Menos Usado:** Indicador que detecta el juego con mayor inactividad y calcula hace cuántos días se jugó por última vez.
- **Lista de Deseados (Wishlist):** Colección separada de juegos que el usuario aún no posee pero desea adquirir.
- **Datos Mensuales:** Métricas acumuladas del mes calendario actual (horas, logros y juegos completados).
- **Personalización de Estilo:** Capacidad de alternar modo oscuro/claro y modificar variables visuales (color principal y fondo) persistidas en la base de datos. El contraste de textos, superficies y bordes se adapta automáticamente a la luminancia del fondo; el texto de los botones contrasta con el color principal.