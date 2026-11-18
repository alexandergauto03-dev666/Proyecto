const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createRequire } = require('node:module');
const backendRequire = createRequire(require.resolve('../backend/package.json'));
const request = backendRequire('supertest');
const { createDatabase } = require('../backend/db');
const { createApp } = require('../backend/server');

let accountSequence = 0;

async function createFixture() {
  const db = await createDatabase(':memory:');
  const sentCodes = [];
  const app = createApp({ db, sendMail: async (message) => sentCodes.push(message) });
  return { db, app, sentCodes };
}

async function register(app, label) {
  accountSequence += 1;
  const client = request.agent(app);
  const email = `${label}-${accountSequence}@example.test`;
  const response = await client.post('/api/auth/registro').send({
    nombre: label,
    email,
    password: 'secure-pass-123'
  });
  assert.equal(response.status, 201);
  return { client, email, user: response.body.usuario, profile: response.body.perfil };
}

function game(profileId, overrides = {}) {
  return {
    perfilId: profileId,
    titulo: 'Signal Bloom',
    descripcion: 'A personal favorite',
    genero: 'Indie',
    plataforma: 'PC',
    clasificacionEdad: '+7',
    anioLanzamiento: 2022,
    estado: 'Jugando',
    horasJugadas: 0,
    logrosObtenidos: 0,
    logrosTotales: 0,
    ultimaVezJugado: null,
    favorito: false,
    esDeseado: false,
    ...overrides
  };
}

function dateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

test('guarda videojuegos, rechaza duplicados normalizados y valida números', async (t) => {
  const { db, app } = await createFixture();
  t.after(() => db.close());
  const account = await register(app, 'player');
  const created = await account.client.post('/api/juegos').send(game(account.profile.id, { titulo: '  Signal   Bloom ' }));
  assert.equal(created.status, 201);
  assert.equal(created.body.juego.titulo, 'Signal   Bloom');

  const duplicate = await account.client.post('/api/juegos').send(game(account.profile.id, { titulo: 'signal bloom' }));
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error, 'El juego ya está en tu biblioteca');

  const invalidHours = await account.client.post('/api/juegos').send(game(account.profile.id, { titulo: 'Negative Hours', horasJugadas: -1 }));
  assert.equal(invalidHours.status, 400);
  const invalidAchievements = await account.client.post('/api/juegos').send(game(account.profile.id, { titulo: 'Too Many Trophies', logrosObtenidos: 2, logrosTotales: 1 }));
  assert.equal(invalidAchievements.status, 400);

  const updated = await account.client.put(`/api/juegos/${created.body.juego.id}`).send(game(account.profile.id, { ...created.body.juego, horasJugadas: 2.5 }));
  assert.equal(updated.status, 200);
  assert.equal(updated.body.juego.horasJugadas, 2.5);
  assert.equal((await account.client.delete(`/api/juegos/${created.body.juego.id}`)).status, 204);
});

test('bloquea en cinco fallos, desbloquea con correo y logout conserva datos', async (t) => {
  const { db, app, sentCodes } = await createFixture();
  t.after(() => db.close());
  const account = await register(app, 'security');
  const created = await account.client.post('/api/juegos').send(game(account.profile.id));
  assert.equal(created.status, 201);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal((await account.client.post('/api/auth/login').send({ email: account.email, password: 'wrong-password' })).status, 401);
  }
  const locked = await account.client.post('/api/auth/login').send({ email: account.email, password: 'wrong-password' });
  assert.equal(locked.status, 423);
  assert.equal(locked.body.codigoDesbloqueo, undefined);
  assert.deepEqual(Object.keys(locked.body), ['error']);
  assert.equal(sentCodes.length, 1);
  assert.equal(sentCodes[0].email, account.email);

  const alreadyLocked = await account.client.post('/api/auth/login').send({ email: account.email, password: 'wrong-password' });
  assert.equal(alreadyLocked.status, 423);
  assert.equal(alreadyLocked.body.codigoDesbloqueo, undefined);

  const resend = await account.client.post('/api/auth/reenviar-codigo').send({ email: account.email });
  assert.equal(resend.status, 200);
  assert.deepEqual(Object.keys(resend.body), ['mensaje']);
  assert.equal(sentCodes.length, 2);
  assert.notEqual(sentCodes[1].code, sentCodes[0].code);
  assert.equal(db.prepare('SELECT codigo_desbloqueo FROM usuarios WHERE email = ?').get(account.email).codigo_desbloqueo, sentCodes[1].code);

  const unknownEmail = await account.client.post('/api/auth/reenviar-codigo').send({ email: 'unknown@example.test' });
  assert.deepEqual(unknownEmail.body, resend.body);
  assert.equal(sentCodes.length, 2);
  assert.equal((await account.client.post('/api/auth/desbloquear').send({ email: account.email, codigo: sentCodes[0].code })).status, 400);

  const unlocked = await account.client.post('/api/auth/desbloquear').send({ email: account.email, codigo: sentCodes[1].code });
  assert.equal(unlocked.status, 200);
  assert.equal((await account.client.post('/api/auth/login').send({ email: account.email, password: 'secure-pass-123' })).status, 200);
  assert.equal((await account.client.post('/api/auth/logout')).status, 200);
  assert.equal((await account.client.get('/api/auth/me')).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM usuarios').get().count, 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM videojuegos').get().count, 1);
});

test('aísla perfiles entre cuentas, incluida la lectura y modificación de juegos', async (t) => {
  const { db, app } = await createFixture();
  t.after(() => db.close());
  const owner = await register(app, 'owner');
  const guest = await register(app, 'guest');
  const foreignGame = await guest.client.post('/api/juegos').send(game(guest.profile.id, { titulo: 'Private Game' }));
  assert.equal(foreignGame.status, 201);

  assert.equal((await owner.client.get(`/api/juegos?perfilId=${guest.profile.id}`)).status, 403);
  assert.equal((await owner.client.put(`/api/juegos/${foreignGame.body.juego.id}`).send(game(guest.profile.id))).status, 403);
  assert.equal((await owner.client.delete(`/api/juegos/${foreignGame.body.juego.id}`)).status, 403);
  const ownProfiles = await owner.client.get('/api/perfiles');
  assert.deepEqual(ownProfiles.body.perfiles.map((profile) => profile.id), [owner.profile.id]);
});

test('separa wishlist, calcula estadísticas mensuales y persiste preferencias', async (t) => {
  const { db, app } = await createFixture();
  t.after(() => db.close());
  const account = await register(app, 'metrics');
  const profileId = account.profile.id;
  const mostPlayed = await account.client.post('/api/juegos').send(game(profileId, {
    titulo: 'Hours Champion', horasJugadas: 14.5, logrosObtenidos: 2, logrosTotales: 8,
    ultimaVezJugado: dateDaysAgo(3), genero: 'RPG'
  }));
  assert.equal(mostPlayed.status, 201);
  const leastUsed = await account.client.post('/api/juegos').send(game(profileId, {
    titulo: 'Long Forgotten', horasJugadas: 1, logrosObtenidos: 1, logrosTotales: 4,
    ultimaVezJugado: dateDaysAgo(40), estado: 'Terminado', genero: 'Aventura'
  }));
  assert.equal(leastUsed.status, 201);
  const desired = await account.client.post('/api/juegos').send(game(profileId, {
    titulo: 'Future Purchase', esDeseado: true, estado: 'Deseado'
  }));
  assert.equal(desired.status, 201);

  assert.equal((await account.client.get(`/api/juegos?perfilId=${profileId}`)).body.juegos.length, 2);
  assert.equal((await account.client.get(`/api/juegos?perfilId=${profileId}&deseados=true`)).body.juegos.length, 1);
  const stats = await account.client.get(`/api/estadisticas/${profileId}`);
  assert.equal(stats.body.juegoMasJugado.titulo, 'Hours Champion');
  assert.equal(stats.body.juegoMenosUsado.titulo, 'Long Forgotten');
  assert.equal(stats.body.juegoMenosUsado.diasDesdeUltimaVez, 40);
  assert.equal(stats.body.mensual.horasJugadas, 15.5);
  assert.equal(stats.body.mensual.logrosConseguidos, 3);
  assert.equal(stats.body.mensual.juegosTerminados, 1);

  const preference = { modoOscuro: true, colorPrimario: '#123456', colorFondo: '#abcdef' };
  assert.equal((await account.client.put('/api/preferencias').send(preference)).status, 200);
  assert.deepEqual((await account.client.get('/api/preferencias')).body.preferencias, { ...preference, estiloTarjeta: 'elevated' });
});
