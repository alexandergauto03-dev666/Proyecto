const { Router } = require('express');
const { requireAuth, requireOwnedProfile } = require('../middleware/auth');
const { monthKey, serializeGame } = require('./juegos.routes');

function createStatsRouter({ db, now = () => new Date() }) {
  const router = Router();
  router.use(requireAuth);
  router.get('/:perfilId', requireOwnedProfile(db, (req) => req.params.perfilId), (req, res) => {
    const profileId = req.profile.id;
    const mostPlayed = db.prepare('SELECT * FROM videojuegos WHERE perfil_id = ? AND es_deseado = 0 ORDER BY horas_jugadas DESC, titulo COLLATE NOCASE LIMIT 1').get(profileId);
    const leastUsed = db.prepare(`SELECT * FROM videojuegos WHERE perfil_id = ? AND es_deseado = 0
      ORDER BY CASE WHEN ultima_vez_jugado IS NULL THEN 0 ELSE 1 END, ultima_vez_jugado ASC, horas_jugadas ASC LIMIT 1`).get(profileId);
    const currentDate = now();
    const month = monthKey(currentDate);
    const monthly = db.prepare('SELECT horas_sumadas, logros_sumados, juegos_terminados FROM actividad_mensual WHERE perfil_id = ? AND anio_mes = ?').get(profileId, month)
      || { horas_sumadas: 0, logros_sumados: 0, juegos_terminados: 0 };
    const genre = db.prepare(`SELECT genero, COUNT(*) AS cantidad FROM videojuegos WHERE perfil_id = ? AND es_deseado = 0
      GROUP BY genero ORDER BY cantidad DESC, genero COLLATE NOCASE LIMIT 1`).get(profileId);
    let daysSinceLastPlayed = null;
    if (leastUsed?.ultima_vez_jugado) {
      const lastPlayed = new Date(`${leastUsed.ultima_vez_jugado}T00:00:00Z`);
      daysSinceLastPlayed = Math.max(0, Math.floor((Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()) - lastPlayed.getTime()) / 86400000));
    }
    res.json({
      juegoMasJugado: mostPlayed ? serializeGame(mostPlayed) : null,
      juegoMenosUsado: leastUsed ? { ...serializeGame(leastUsed), diasDesdeUltimaVez: daysSinceLastPlayed } : null,
      mensual: {
        anioMes: month,
        horasJugadas: monthly.horas_sumadas,
        logrosConseguidos: monthly.logros_sumados,
        juegosTerminados: monthly.juegos_terminados,
        generoPredominante: genre?.genero || null
      }
    });
  });
  return router;
}

module.exports = { createStatsRouter };
