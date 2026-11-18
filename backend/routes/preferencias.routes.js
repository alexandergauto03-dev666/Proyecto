const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');

const DEFAULTS = { modoOscuro: true, colorPrimario: '#42c8e8', colorFondo: '#10151d', estiloTarjeta: 'elevated' };
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function createPreferencesRouter({ db }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const row = db.prepare('SELECT modo_oscuro, color_primario, color_fondo, estilo_tarjeta FROM preferencias_usuario WHERE usuario_id = ?').get(req.userId);
    if (!row) return res.json({ preferencias: DEFAULTS });
    res.json({ preferencias: { modoOscuro: Boolean(row.modo_oscuro), colorPrimario: row.color_primario, colorFondo: row.color_fondo, estiloTarjeta: row.estilo_tarjeta } });
  });

  router.put('/', (req, res) => {
    const modoOscuro = req.body.modoOscuro;
    const colorPrimario = req.body.colorPrimario;
    const colorFondo = req.body.colorFondo;
    const estiloTarjeta = req.body.estiloTarjeta || 'elevated';
    if (typeof modoOscuro !== 'boolean' || !COLOR_PATTERN.test(colorPrimario) || !COLOR_PATTERN.test(colorFondo) || !['elevated', 'flat'].includes(estiloTarjeta)) {
      return res.status(400).json({ error: 'Las preferencias visuales no son válidas.' });
    }
    db.prepare(`INSERT INTO preferencias_usuario (usuario_id, modo_oscuro, color_primario, color_fondo, estilo_tarjeta)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(usuario_id) DO UPDATE SET
      modo_oscuro = excluded.modo_oscuro, color_primario = excluded.color_primario,
      color_fondo = excluded.color_fondo, estilo_tarjeta = excluded.estilo_tarjeta`)
      .run(req.userId, modoOscuro ? 1 : 0, colorPrimario, colorFondo, estiloTarjeta);
    res.json({ preferencias: { modoOscuro, colorPrimario, colorFondo, estiloTarjeta } });
  });

  return router;
}

module.exports = { createPreferencesRouter };
