const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { randomInt } = require('node:crypto');
const { requireAuth } = require('../middleware/auth');

function createAuthRouter({ db, sendUnlockCode }) {
  const router = Router();

  router.post('/registro', async (req, res) => {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const perfilNombre = typeof req.body.perfilNombre === 'string' && req.body.perfilNombre.trim()
      ? req.body.perfilNombre.trim()
      : 'Principal';
    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return res.status(400).json({ error: 'Completa nombre, correo válido y contraseña de al menos 8 caracteres.' });
    }

    try {
      const userResult = db.prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)')
        .run(nombre, email, await bcrypt.hash(password, 10));
      const userId = userResult.lastInsertRowid;
      const profileResult = db.prepare('INSERT INTO perfiles (usuario_id, nombre) VALUES (?, ?)').run(userId, perfilNombre);
      db.prepare('INSERT INTO preferencias_usuario (usuario_id) VALUES (?)').run(userId);
      req.session.userId = userId;
      return res.status(201).json({ usuario: { id: userId, nombre, email }, perfil: { id: profileResult.lastInsertRowid, nombre: perfilNombre } });
    } catch (error) {
      if (/UNIQUE constraint failed: usuarios.email/i.test(error.message)) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
      }
      throw error;
    }
  });

  router.post('/login', async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      if (!user) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      if (user.bloqueado) return res.status(423).json({ error: 'La cuenta está bloqueada. Confirma el código enviado a tu correo.' });
      const attempts = user.intentos_fallidos + 1;
      const locked = attempts >= 5;
      const code = locked ? String(randomInt(100000, 1000000)) : null;
      db.prepare('UPDATE usuarios SET intentos_fallidos = ?, bloqueado = ?, codigo_desbloqueo = ? WHERE id = ?')
        .run(attempts, locked ? 1 : 0, code, user.id);
      if (locked) {
        try {
          await sendUnlockCode({ email: user.email, nombre: user.nombre, code });
        } catch (error) {
          console.error('No se pudo enviar el código de desbloqueo:', error.message);
        }
        return res.status(423).json({ error: 'La cuenta está bloqueada. Confirma el código enviado a tu correo.' });
      }
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.', intentosRestantes: 5 - attempts });
    }
    if (user.bloqueado) return res.status(423).json({ error: 'La cuenta está bloqueada. Confirma el código enviado a tu correo.' });
    db.prepare('UPDATE usuarios SET intentos_fallidos = 0 WHERE id = ?').run(user.id);
    req.session.userId = user.id;
    return res.json({ usuario: { id: user.id, nombre: user.nombre, email: user.email } });
  });

  router.post('/desbloquear', (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body.codigo === 'string' ? req.body.codigo.trim() : '';
    const user = db.prepare('SELECT id, codigo_desbloqueo, bloqueado FROM usuarios WHERE email = ?').get(email);
    if (!user || !user.bloqueado || !code || user.codigo_desbloqueo !== code) {
      return res.status(400).json({ error: 'El correo o código de desbloqueo no es válido.' });
    }
    db.prepare('UPDATE usuarios SET bloqueado = 0, intentos_fallidos = 0, codigo_desbloqueo = NULL WHERE id = ?').run(user.id);
    return res.json({ mensaje: 'Cuenta desbloqueada. Ya puedes iniciar sesión.' });
  });

  router.post('/reenviar-codigo', async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const user = db.prepare('SELECT id, email, nombre FROM usuarios WHERE email = ? AND bloqueado = 1').get(email);
    if (user) {
      const code = String(randomInt(100000, 1000000));
      db.prepare('UPDATE usuarios SET codigo_desbloqueo = ? WHERE id = ?').run(code, user.id);
      try {
        await sendUnlockCode({ email: user.email, nombre: user.nombre, code });
      } catch (error) {
        console.error('No se pudo reenviar el código de desbloqueo:', error.message);
      }
    }
    return res.json({ mensaje: 'Si la cuenta está bloqueada, enviaremos un nuevo código a ese correo.' });
  });

  router.post('/logout', requireAuth, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('gameshelf.sid');
      res.json({ mensaje: 'Sesión cerrada.' });
    });
  });

  router.get('/me', requireAuth, (req, res) => {
    const user = db.prepare('SELECT id, nombre, email FROM usuarios WHERE id = ?').get(req.userId);
    if (!user) return res.status(401).json({ error: 'La sesión ya no es válida.' });
    res.json({ usuario: user });
  });

  return router;
}

module.exports = { createAuthRouter };
