require('dotenv').config();
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const { createDatabase } = require('./db');
const { sendUnlockCode } = require('./mailer');
const { createAuthRouter } = require('./routes/auth.routes');
const { createProfilesRouter } = require('./routes/perfiles.routes');
const { createGamesRouter } = require('./routes/juegos.routes');
const { createStatsRouter } = require('./routes/estadisticas.routes');
const { createPreferencesRouter } = require('./routes/preferencias.routes');

function createApp(options = {}) {
  const db = options.db;
  const sendMail = options.sendMail || sendUnlockCode;
  const sessionSecret = options.sessionSecret || process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'gameshelf-local-development-secret');
  if (!db) throw new Error('createApp requiere una conexión de base de datos.');
  if (!sessionSecret) throw new Error('Configura SESSION_SECRET antes de iniciar en producción.');
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(session({
    name: 'gameshelf.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 24 * 7 }
  }));

  app.use('/api/auth', createAuthRouter({ db, sendUnlockCode: sendMail }));
  app.use('/api/perfiles', createProfilesRouter({ db }));
  app.use('/api/juegos', createGamesRouter({ db }));
  app.use('/api/estadisticas', createStatsRouter({ db }));
  app.use('/api/preferencias', createPreferencesRouter({ db }));
  app.use(express.static(path.resolve(__dirname, '../frontend')));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint no encontrado.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error interno.' });
  });
  return app;
}

async function start() {
  const db = await createDatabase();
  const app = createApp({ db });
  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => console.log(`GameShelf disponible en http://localhost:${port}`));
}

if (require.main === module) start().catch((error) => {
  console.error('No se pudo iniciar GameShelf:', error);
  process.exitCode = 1;
});

module.exports = { createApp };
