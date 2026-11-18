const { Router } = require('express');
const { requireAuth, requireOwnedProfile } = require('../middleware/auth');

const RATINGS = new Set(['ATP', '+7', '+12', '+16', '+18']);
const STATUSES = new Set(['Pendiente', 'Jugando', 'Terminado', 'Deseado']);
const DEFAULT_COVER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="#245c45"/><path d="M0 340 190 190l115 100 130-150 205 180v100H0Z" fill="#c9ef74" opacity=".55"/><text x="38" y="370" fill="white" font-family="sans-serif" font-size="28">GameShelf</text></svg>');

function normalizeTitle(title) {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

function serializeGame(row) {
  return {
    id: row.id,
    perfilId: row.perfil_id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    genero: row.genero,
    plataforma: row.plataforma,
    clasificacionEdad: row.clasificacion_edad,
    anioLanzamiento: row.anio_lanzamiento,
    imagen: row.imagen,
    estado: row.estado,
    horasJugadas: row.horas_jugadas,
    logrosObtenidos: row.logros_obtenidos,
    logrosTotales: row.logros_totales,
    ultimaVezJugado: row.ultima_vez_jugado,
    favorito: Boolean(row.favorito),
    esDeseado: Boolean(row.es_deseado)
  };
}

function validateGame(body) {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const genero = typeof body.genero === 'string' ? body.genero.trim() : '';
  const plataforma = typeof body.plataforma === 'string' ? body.plataforma.trim() : '';
  const clasificacionEdad = body.clasificacionEdad;
  const estado = body.estado || 'Pendiente';
  const horasJugadas = body.horasJugadas === undefined ? 0 : Number(body.horasJugadas);
  const logrosObtenidos = body.logrosObtenidos === undefined ? 0 : Number(body.logrosObtenidos);
  const logrosTotales = body.logrosTotales === undefined ? 0 : Number(body.logrosTotales);
  const anioLanzamiento = body.anioLanzamiento === '' || body.anioLanzamiento == null ? null : Number(body.anioLanzamiento);
  const ultimaVezJugado = body.ultimaVezJugado || null;
  const imagen = typeof body.imagen === 'string' ? body.imagen.trim() : '';

  if (!titulo || titulo.length > 100 || !genero || genero.length > 60 || !plataforma || plataforma.length > 60) {
    return { error: 'Título, género y plataforma son obligatorios.' };
  }
  if (!RATINGS.has(clasificacionEdad)) return { error: 'La clasificación por edad no es válida.' };
  if (!STATUSES.has(estado)) return { error: 'El estado del juego no es válido.' };
  if (!Number.isFinite(horasJugadas) || horasJugadas < 0 || !Number.isInteger(logrosTotales) || logrosTotales < 0 || !Number.isInteger(logrosObtenidos) || logrosObtenidos < 0 || logrosObtenidos > logrosTotales) {
    return { error: 'Las horas y los logros deben ser valores válidos y no negativos; los logros obtenidos no pueden superar el total.' };
  }
  if (anioLanzamiento !== null && (!Number.isInteger(anioLanzamiento) || anioLanzamiento < 1950 || anioLanzamiento > 2100)) {
    return { error: 'El año de lanzamiento no es válido.' };
  }
  if (ultimaVezJugado && (!/^\d{4}-\d{2}-\d{2}$/.test(ultimaVezJugado) || Number.isNaN(Date.parse(ultimaVezJugado)) || new Date(ultimaVezJugado).toISOString().slice(0, 10) !== ultimaVezJugado)) {
    return { error: 'La última sesión debe tener una fecha válida en formato YYYY-MM-DD.' };
  }
  if (imagen && (!/^https?:\/\//i.test(imagen) || imagen.length > 2048)) return { error: 'La portada debe ser una URL HTTP o HTTPS válida.' };

  return {
    value: {
      titulo, titulo_normalizado: normalizeTitle(titulo), descripcion: typeof body.descripcion === 'string' ? body.descripcion.trim().slice(0, 1000) : '',
      genero, plataforma, clasificacion_edad: clasificacionEdad, anio_lanzamiento: anioLanzamiento,
      imagen, estado, horas_jugadas: horasJugadas, logros_obtenidos: logrosObtenidos,
      logros_totales: logrosTotales, ultima_vez_jugado: ultimaVezJugado,
      favorito: body.favorito === true || body.favorito === 1 ? 1 : 0,
      es_deseado: body.esDeseado === true || body.esDeseado === 1 || estado === 'Deseado' ? 1 : 0
    }
  };
}

function recordActivity(db, profileId, anioMes, { hours = 0, achievements = 0, completed = 0 }) {
  if (hours <= 0 && achievements <= 0 && completed <= 0) return;
  db.prepare(`INSERT INTO actividad_mensual (perfil_id, anio_mes, horas_sumadas, logros_sumados, juegos_terminados)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(perfil_id, anio_mes) DO UPDATE SET
      horas_sumadas = horas_sumadas + excluded.horas_sumadas,
      logros_sumados = logros_sumados + excluded.logros_sumados,
      juegos_terminados = juegos_terminados + excluded.juegos_terminados`)
    .run(profileId, anioMes, hours, achievements, completed);
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function createGamesRouter({ db, fetchImpl = globalThis.fetch }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/buscar-portada', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) return res.status(400).json({ error: 'Indica el título que quieres buscar.' });
    if (process.env.RAWG_API_KEY) {
      try {
        const rawg = await fetchImpl(`https://api.rawg.io/api/games?key=${encodeURIComponent(process.env.RAWG_API_KEY)}&search=${encodeURIComponent(query)}&page_size=1`, { signal: AbortSignal.timeout(4500) });
        if (rawg.ok) {
          const result = await rawg.json();
          if (result.results?.[0]?.background_image) return res.json({ imagen: result.results[0].background_image, fuente: 'RAWG' });
        }
      } catch {}
    }
    try {
      const wiki = await fetchImpl(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' video game')}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=640&format=json`, { signal: AbortSignal.timeout(4500), headers: { 'User-Agent': 'GameShelfPro/1.0 (cover lookup)' } });
      if (wiki.ok) {
        const result = await wiki.json();
        const page = Object.values(result.query?.pages || {})[0];
        if (page?.thumbnail?.source) return res.json({ imagen: page.thumbnail.source, fuente: 'Wikipedia' });
      }
    } catch {}
    res.json({ imagen: DEFAULT_COVER, fuente: 'predeterminada' });
  });

  router.get('/', requireOwnedProfile(db, (req) => req.query.perfilId), (req, res) => {
    const desiredOnly = req.query.deseados === 'true';
    const rows = db.prepare(`SELECT * FROM videojuegos WHERE perfil_id = ? AND es_deseado = ? ORDER BY titulo COLLATE NOCASE`)
      .all(req.profile.id, desiredOnly ? 1 : 0);
    res.json({ juegos: rows.map(serializeGame) });
  });

  router.post('/', requireOwnedProfile(db, (req) => req.body.perfilId), (req, res) => {
    const game = validateGame(req.body);
    if (game.error) return res.status(400).json({ error: game.error });
    const duplicate = db.prepare('SELECT id FROM videojuegos WHERE perfil_id = ? AND titulo_normalizado = ?').get(req.profile.id, game.value.titulo_normalizado);
    if (duplicate) return res.status(409).json({ error: 'El juego ya está en tu biblioteca' });
    const values = game.value;
    const result = db.prepare(`INSERT INTO videojuegos (
      perfil_id, titulo, titulo_normalizado, descripcion, genero, plataforma, clasificacion_edad,
      anio_lanzamiento, imagen, estado, horas_jugadas, logros_obtenidos, logros_totales,
      ultima_vez_jugado, favorito, es_deseado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.profile.id, values.titulo, values.titulo_normalizado, values.descripcion, values.genero, values.plataforma,
      values.clasificacion_edad, values.anio_lanzamiento, values.imagen, values.estado, values.horas_jugadas,
      values.logros_obtenidos, values.logros_totales, values.ultima_vez_jugado, values.favorito, values.es_deseado
    );
    const now = monthKey();
    recordActivity(db, req.profile.id, now, { hours: values.horas_jugadas, achievements: values.logros_obtenidos, completed: values.estado === 'Terminado' ? 1 : 0 });
    const saved = db.prepare('SELECT * FROM videojuegos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ juego: serializeGame(saved) });
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT g.*, p.usuario_id FROM videojuegos g JOIN perfiles p ON p.id = g.perfil_id WHERE g.id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'El juego no existe.' });
    if (existing.usuario_id !== req.userId) return res.status(403).json({ error: 'No tienes permiso para modificar este juego.' });
    const profileId = Number(req.body.perfilId);
    if (profileId !== existing.perfil_id) return res.status(403).json({ error: 'El juego no pertenece al perfil indicado.' });
    const game = validateGame(req.body);
    if (game.error) return res.status(400).json({ error: game.error });
    const duplicate = db.prepare('SELECT id FROM videojuegos WHERE perfil_id = ? AND titulo_normalizado = ? AND id != ?').get(existing.perfil_id, game.value.titulo_normalizado, id);
    if (duplicate) return res.status(409).json({ error: 'El juego ya está en tu biblioteca' });
    const values = game.value;
    db.prepare(`UPDATE videojuegos SET titulo = ?, titulo_normalizado = ?, descripcion = ?, genero = ?, plataforma = ?,
      clasificacion_edad = ?, anio_lanzamiento = ?, imagen = ?, estado = ?, horas_jugadas = ?, logros_obtenidos = ?,
      logros_totales = ?, ultima_vez_jugado = ?, favorito = ?, es_deseado = ? WHERE id = ?`).run(
      values.titulo, values.titulo_normalizado, values.descripcion, values.genero, values.plataforma,
      values.clasificacion_edad, values.anio_lanzamiento, values.imagen, values.estado, values.horas_jugadas,
      values.logros_obtenidos, values.logros_totales, values.ultima_vez_jugado, values.favorito, values.es_deseado, id
    );
    recordActivity(db, existing.perfil_id, monthKey(), {
      hours: Math.max(0, values.horas_jugadas - existing.horas_jugadas),
      achievements: Math.max(0, values.logros_obtenidos - existing.logros_obtenidos),
      completed: values.estado === 'Terminado' && existing.estado !== 'Terminado' ? 1 : 0
    });
    res.json({ juego: serializeGame(db.prepare('SELECT * FROM videojuegos WHERE id = ?').get(id)) });
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT g.id, p.usuario_id FROM videojuegos g JOIN perfiles p ON p.id = g.perfil_id WHERE g.id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'El juego no existe.' });
    if (existing.usuario_id !== req.userId) return res.status(403).json({ error: 'No tienes permiso para eliminar este juego.' });
    db.prepare('DELETE FROM videojuegos WHERE id = ?').run(id);
    res.status(204).end();
  });

  return router;
}

module.exports = { createGamesRouter, normalizeTitle, validateGame, serializeGame, monthKey };
