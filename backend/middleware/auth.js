function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  req.userId = req.session.userId;
  next();
}

function requireOwnedProfile(db, getProfileId) {
  return (req, res, next) => {
    const profileId = Number(getProfileId(req));
    if (!Number.isInteger(profileId) || profileId < 1) {
      return res.status(400).json({ error: 'El perfil indicado no es válido.' });
    }
    const profile = db.prepare('SELECT id, usuario_id, nombre FROM perfiles WHERE id = ?').get(profileId);
    if (!profile || profile.usuario_id !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este perfil.' });
    }
    req.profile = profile;
    next();
  };
}

module.exports = { requireAuth, requireOwnedProfile };
