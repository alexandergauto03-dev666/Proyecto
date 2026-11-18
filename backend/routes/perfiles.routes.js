const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');

function createProfilesRouter({ db }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const profiles = db.prepare('SELECT id, nombre, avatar FROM perfiles WHERE usuario_id = ? ORDER BY id').all(req.userId);
    res.json({ perfiles: profiles });
  });

  router.post('/', (req, res) => {
    const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    if (!nombre || nombre.length > 40) return res.status(400).json({ error: 'El nombre del perfil es obligatorio (máximo 40 caracteres).' });
    const result = db.prepare('INSERT INTO perfiles (usuario_id, nombre) VALUES (?, ?)').run(req.userId, nombre);
    res.status(201).json({ perfil: { id: result.lastInsertRowid, nombre, avatar: 'default' } });
  });

  return router;
}

module.exports = { createProfilesRouter };
