# GameShelf Pro

Biblioteca web de videojuegos con cuentas, perfiles aislados, wishlist, seguimiento de actividad y preferencias visuales. El frontend estático y la API REST se sirven desde el mismo proceso Express; los datos se guardan en SQLite.

## Requisitos

- Node.js 18 o superior y npm.
- No se requieren herramientas de compilación nativas; SQLite se ejecuta con `sql.js`.

## Instalación y ejecución

Desde la raíz del proyecto:

```bash
cd backend
npm install
npm start
```

Abre `http://localhost:3000`. En el primer inicio se crea `database/gameshelf.db` desde `database/schema.sql`. La API está bajo `/api` y el servidor entrega el frontend desde `/`.

En otra terminal, desde `backend/`, ejecuta la suite:

```bash
npm test
```

## Configuración opcional

El modo local registra el código de desbloqueo en la consola del servidor y lo devuelve en la respuesta de bloqueo para facilitar pruebas. Para enviar códigos por SMTP, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`. En producción también es obligatorio configurar `SESSION_SECRET`; establece `NODE_ENV=production` para cookies seguras y para no devolver el código de desbloqueo en la API.

`PORT` cambia el puerto (por defecto `3000`). `RAWG_API_KEY` habilita RAWG para buscar portadas; si no está configurado o falla la consulta, se prueba Wikipedia y finalmente se usa una imagen predeterminada.

## Pruebas incluidas

`tests/rules.test.js` verifica altas y validaciones, rechazo de duplicados, bloqueo y desbloqueo, cierre de sesión sin borrar datos, aislamiento de perfiles, wishlist, estadísticas mensuales y preferencias por cuenta.