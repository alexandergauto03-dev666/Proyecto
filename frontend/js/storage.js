(function () {
  "use strict";

  var STORAGE_KEY = "gameshelf.data.v1";
  var GENRES = ["Acción", "Aventura", "RPG", "Estrategia", "Deportes", "Simulación", "Indie", "Otro"];
  var PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Móvil", "Otra"];
  var STATUSES = ["Pendiente", "Jugando", "Terminado"];
  var memoryState = null;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "gs-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function demoState() {
    var userId = "user-default";
    return {
      users: [{ id: userId, nombre: "Mi biblioteca" }, { id: "user-second", nombre: "Jugador 2" }],
      activeUserId: userId,
      games: [
        { id: "demo-1", usuarioId: userId, nombre: "Hollow Knight", descripcion: "Una aventura de exploracion en un reino subterraneo lleno de secretos.", genero: "Indie", plataforma: "PC", fechaLanzamiento: "2017-02-24", imagen: "", estado: "Jugando", favorito: true },
        { id: "demo-2", usuarioId: userId, nombre: "Stardew Valley", descripcion: "Una granja por restaurar, vecinos por conocer y un valle por descubrir.", genero: "Simulación", plataforma: "Nintendo Switch", fechaLanzamiento: "2016-02-26", imagen: "", estado: "Pendiente", favorito: false },
        { id: "demo-3", usuarioId: userId, nombre: "Celeste", descripcion: "Acompana a Madeline en su ascenso a la montana Celeste.", genero: "Indie", plataforma: "PlayStation", fechaLanzamiento: "2018-01-25", imagen: "", estado: "Terminado", favorito: true },
        { id: "demo-4", usuarioId: userId, nombre: "Hades", descripcion: "Abrete paso desde el inframundo en esta aventura de acción.", genero: "Acción", plataforma: "PC", fechaLanzamiento: "2020-09-17", imagen: "", estado: "Pendiente", favorito: false },
        { id: "demo-5", usuarioId: userId, nombre: "Animal Crossing: New Horizons", descripcion: "Construye una nueva vida en una isla a tu propio ritmo.", genero: "Simulación", plataforma: "Nintendo Switch", fechaLanzamiento: "2020-03-20", imagen: "", estado: "Jugando", favorito: false }
      ]
    };
  }

  function normalizeState(state) {
    if (!state || !Array.isArray(state.users) || !Array.isArray(state.games)) return demoState();
    var users = state.users.filter(function (user) {
      return user && typeof user.id === "string" && typeof user.nombre === "string";
    });
    var games = state.games.filter(function (game) {
      return game && typeof game.id === "string" && users.some(function (user) { return user.id === game.usuarioId; });
    }).map(function (game) {
      var legacyGenres = { Accion: "Acción", Simulacion: "Simulación" };
      var legacyPlatforms = { Movil: "Móvil" };
      return Object.assign({}, game, {
        genero: GENRES.indexOf(game.genero) >= 0 ? game.genero : (legacyGenres[game.genero] || "Otro"),
        plataforma: PLATFORMS.indexOf(game.plataforma) >= 0 ? game.plataforma : (legacyPlatforms[game.plataforma] || "Otra"),
        estado: STATUSES.indexOf(game.estado) >= 0 ? game.estado : "Pendiente",
        favorito: game.favorito === true
      });
    });
    var activeUserId = users.some(function (user) { return user.id === state.activeUserId; }) ? state.activeUserId : (users[0] && users[0].id);
    return { users: users, games: games, activeUserId: activeUserId };
  }

  function readState() {
    if (memoryState) return memoryState;
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      memoryState = stored ? normalizeState(JSON.parse(stored)) : demoState();
      writeState();
    } catch (error) {
      memoryState = demoState();
    }
    return memoryState;
  }

  function writeState() {
    if (!memoryState) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch (error) {
      // The in-memory copy keeps the app usable when browser storage is blocked.
    }
  }

  function getState() {
    return JSON.parse(JSON.stringify(readState()));
  }

  function getGames(userId) {
    return readState().games.filter(function (game) { return game.usuarioId === userId; }).map(function (game) { return Object.assign({}, game); });
  }

  function saveGame(userId, values) {
    var state = readState();
    if (!state.users.some(function (user) { return user.id === userId; })) throw new Error("El perfil seleccionado no existe.");
    var name = typeof values.nombre === "string" ? values.nombre.trim() : "";
    if (!name || GENRES.indexOf(values.genero) < 0 || PLATFORMS.indexOf(values.plataforma) < 0) throw new Error("Completa nombre, genero y plataforma.");
    if (STATUSES.indexOf(values.estado) < 0) throw new Error("El estado seleccionado no es valido.");
    var existing = values.id && state.games.find(function (game) { return game.id === values.id && game.usuarioId === userId; });
    var game = {
      id: existing ? existing.id : makeId(),
      usuarioId: userId,
      nombre: name,
      descripcion: typeof values.descripcion === "string" ? values.descripcion.trim() : "",
      genero: values.genero,
      plataforma: values.plataforma,
      fechaLanzamiento: typeof values.fechaLanzamiento === "string" ? values.fechaLanzamiento : "",
      imagen: typeof values.imagen === "string" ? values.imagen.trim() : "",
      estado: values.estado,
      favorito: values.favorito === true
    };
    if (existing) state.games[state.games.indexOf(existing)] = game;
    else state.games.unshift(game);
    writeState();
    return Object.assign({}, game);
  }

  function updateGame(userId, gameId, changes) {
    var existing = readState().games.find(function (game) { return game.id === gameId && game.usuarioId === userId; });
    if (!existing) return null;
    return saveGame(userId, Object.assign({}, existing, changes, { id: gameId }));
  }

  function deleteGame(userId, gameId) {
    var state = readState();
    var before = state.games.length;
    state.games = state.games.filter(function (game) { return !(game.id === gameId && game.usuarioId === userId); });
    if (state.games.length === before) return false;
    writeState();
    return true;
  }

  function addUser(name) {
    var cleanName = typeof name === "string" ? name.trim() : "";
    if (!cleanName) throw new Error("Escribe un nombre para el perfil.");
    var state = readState();
    var user = { id: makeId(), nombre: cleanName };
    state.users.push(user);
    state.activeUserId = user.id;
    writeState();
    return Object.assign({}, user);
  }

  function setActiveUser(userId) {
    var state = readState();
    if (!state.users.some(function (user) { return user.id === userId; })) return false;
    state.activeUserId = userId;
    writeState();
    return true;
  }

  window.GameShelfStorage = {
    genres: GENRES.slice(),
    platforms: PLATFORMS.slice(),
    statuses: STATUSES.slice(),
    getState: getState,
    getGames: getGames,
    saveGame: saveGame,
    updateGame: updateGame,
    deleteGame: deleteGame,
    addUser: addUser,
    setActiveUser: setActiveUser
  };
})();
