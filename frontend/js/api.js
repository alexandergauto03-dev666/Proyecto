(function () {
  'use strict';

  async function request(path, options) {
    const settings = options || {};
    const response = await fetch(path, {
      method: settings.method || 'GET',
      credentials: 'same-origin',
      headers: settings.body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: settings.body === undefined ? undefined : JSON.stringify(settings.body)
    });
    const result = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result?.error || 'No se pudo completar la solicitud.');
      error.status = response.status;
      error.data = result;
      throw error;
    }
    return result;
  }

  window.GameShelfAPI = {
    request,
    me: () => request('/api/auth/me'),
    register: (body) => request('/api/auth/registro', { method: 'POST', body }),
    login: (body) => request('/api/auth/login', { method: 'POST', body }),
    unlock: (body) => request('/api/auth/desbloquear', { method: 'POST', body }),
    resendUnlockCode: (email) => request('/api/auth/reenviar-codigo', { method: 'POST', body: { email } }),
    logout: () => request('/api/auth/logout', { method: 'POST', body: {} }),
    profiles: () => request('/api/perfiles'),
    createProfile: (nombre) => request('/api/perfiles', { method: 'POST', body: { nombre } }),
    games: (profileId, desired) => request(`/api/juegos?perfilId=${encodeURIComponent(profileId)}&deseados=${desired}`),
    createGame: (body) => request('/api/juegos', { method: 'POST', body }),
    updateGame: (id, body) => request(`/api/juegos/${encodeURIComponent(id)}`, { method: 'PUT', body }),
    deleteGame: (id) => request(`/api/juegos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    cover: (title) => request(`/api/juegos/buscar-portada?q=${encodeURIComponent(title)}`),
    stats: (profileId) => request(`/api/estadisticas/${encodeURIComponent(profileId)}`),
    preferences: () => request('/api/preferencias'),
    savePreferences: (body) => request('/api/preferencias', { method: 'PUT', body })
  };
})();
