(function () {
  'use strict';

  window.addEventListener('DOMContentLoaded', function () {
    var api = window.GameShelfAPI;
    var ui = window.GameShelfUI;
    var theme = window.GameShelfTheme;
    var authView = document.getElementById('auth-view');
    var appHeader = document.querySelector('.topbar');
    var appMain = document.querySelector('.page-shell');
    var gameDialog = document.getElementById('game-dialog');
    var detailDialog = document.getElementById('detail-dialog');
    var userDialog = document.getElementById('user-dialog');
    var gameForm = document.getElementById('game-form');
    var userForm = document.getElementById('user-form');
    var activeProfileId = null;
    var currentGames = [];
    var showingWishlist = false;
    var toastTimer;
    var preferenceTimer;

    function notify(message) {
      var toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('is-visible');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
    }

    function showAuth(panel) {
      authView.hidden = false;
      appHeader.hidden = true;
      appMain.hidden = true;
      document.querySelectorAll('.auth-form').forEach(function (form) { form.hidden = form.id !== panel + '-form'; });
      document.querySelectorAll('.auth-tab').forEach(function (tab) {
        var selected = tab.dataset.authPanel === panel;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
      document.querySelectorAll('.auth-tab').forEach(function (tab) { tab.hidden = panel === 'unlock'; });
    }

    function showApp() {
      authView.hidden = true;
      appHeader.hidden = false;
      appMain.hidden = false;
    }

    function setAuthError(formId, message) {
      document.getElementById(formId + '-error').textContent = message || '';
    }

    function formValues(form) {
      return Object.fromEntries(new FormData(form).entries());
    }

    function findGame(id) {
      return currentGames.find(function (game) { return String(game.id) === String(id); });
    }

    function applyFilters(games) {
      var query = document.getElementById('search-input').value.trim().toLocaleLowerCase();
      var genre = document.getElementById('filter-genre').value;
      var platform = document.getElementById('filter-platform').value;
      var status = document.getElementById('filter-status').value;
      var age = document.getElementById('filter-age').value;
      var favoriteOnly = document.getElementById('filter-favorites').checked;
      return games.filter(function (game) {
        return (!query || game.titulo.toLocaleLowerCase().includes(query)) &&
          (!genre || game.genero === genre) && (!platform || game.plataforma === platform) &&
          (!status || game.estado === status) && (!age || game.clasificacionEdad === age) &&
          (!favoriteOnly || game.favorito);
      });
    }

    async function refreshCollection() {
      if (!activeProfileId) return;
      var response = await api.games(activeProfileId, showingWishlist);
      currentGames = response.juegos;
      ui.renderGames(applyFilters(currentGames), currentGames.length, showingWishlist);
      if (!showingWishlist) {
        var stats = await api.stats(activeProfileId);
        ui.renderStats(stats);
      }
    }

    async function refreshApp() {
      var results = await Promise.all([api.profiles(), api.preferences()]);
      var profiles = results[0].perfiles;
      if (!profiles.length) {
        var created = await api.createProfile('Principal');
        profiles = [created.perfil];
      }
      if (!profiles.some(function (profile) { return String(profile.id) === String(activeProfileId); })) activeProfileId = profiles[0].id;
      ui.renderUsers(profiles, activeProfileId);
      theme.apply(results[1].preferencias);
      await refreshCollection();
    }

    function clearGameErrors() {
      document.getElementById('form-error').textContent = '';
      gameForm.querySelectorAll('[aria-invalid="true"]').forEach(function (field) { field.removeAttribute('aria-invalid'); });
    }

    function openGameForm(game) {
      gameForm.reset();
      clearGameErrors();
      document.getElementById('game-id').value = game ? game.id : '';
      document.getElementById('game-dialog-title').textContent = game ? 'Editar videojuego' : 'Nuevo videojuego';
      document.getElementById('game-name').value = game ? game.titulo : '';
      document.getElementById('game-description').value = game ? game.descripcion : '';
      document.getElementById('game-genre').value = game ? game.genero : '';
      document.getElementById('game-platform').value = game ? game.plataforma : '';
      document.getElementById('game-status').value = game ? game.estado : 'Pendiente';
      document.getElementById('game-rating').value = game ? game.clasificacionEdad : '';
      document.getElementById('game-year').value = game ? game.anioLanzamiento || '' : '';
      document.getElementById('game-hours').value = game ? game.horasJugadas : 0;
      document.getElementById('game-achievements').value = game ? game.logrosObtenidos : 0;
      document.getElementById('game-achievements-total').value = game ? game.logrosTotales : 0;
      document.getElementById('game-last-played').value = game ? game.ultimaVezJugado || '' : '';
      document.getElementById('game-image').value = game ? game.imagen : '';
      document.getElementById('game-favorite').checked = game ? game.favorito : false;
      document.getElementById('game-wishlist').checked = game ? game.esDeseado : false;
      gameDialog.showModal();
      document.getElementById('game-name').focus();
    }

    async function saveGame(event) {
      event.preventDefault();
      clearGameErrors();
      if (!gameForm.reportValidity()) return;
      var id = document.getElementById('game-id').value;
      var wishlist = document.getElementById('game-wishlist').checked;
      var body = {
        perfilId: Number(activeProfileId),
        titulo: document.getElementById('game-name').value.trim(),
        descripcion: document.getElementById('game-description').value,
        genero: document.getElementById('game-genre').value,
        plataforma: document.getElementById('game-platform').value,
        clasificacionEdad: document.getElementById('game-rating').value,
        anioLanzamiento: document.getElementById('game-year').value || null,
        imagen: document.getElementById('game-image').value.trim(),
        estado: wishlist ? 'Deseado' : document.getElementById('game-status').value,
        horasJugadas: Number(document.getElementById('game-hours').value),
        logrosObtenidos: Number(document.getElementById('game-achievements').value),
        logrosTotales: Number(document.getElementById('game-achievements-total').value),
        ultimaVezJugado: document.getElementById('game-last-played').value || null,
        favorito: document.getElementById('game-favorite').checked,
        esDeseado: wishlist
      };
      try {
        if (id) await api.updateGame(id, body);
        else await api.createGame(body);
        gameDialog.close();
        await refreshCollection();
        notify(id ? 'Videojuego actualizado.' : 'Videojuego guardado.');
      } catch (error) {
        document.getElementById('form-error').textContent = error.message;
      }
    }

    async function updateGame(game, changes) {
      try {
        await api.updateGame(game.id, Object.assign({}, game, changes, { perfilId: Number(activeProfileId) }));
        await refreshCollection();
      } catch (error) { notify(error.message); }
    }

    ui.initializeOptions();
    showAuth('login');

    document.querySelectorAll('[data-auth-panel]').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelectorAll('.auth-form').forEach(function (form) { setAuthError(form.id.replace('-form', ''), ''); });
        showAuth(button.dataset.authPanel);
      });
    });

    document.getElementById('login-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      setAuthError('login', '');
      try {
        await api.login(formValues(event.currentTarget));
        await refreshApp();
        showApp();
      } catch (error) {
        if (error.status === 423) {
          showAuth('unlock');
          document.querySelector('#unlock-form [name="email"]').value = document.querySelector('#login-form [name="email"]').value;
          document.querySelector('#unlock-form [name="codigo"]').value = '';
          setAuthError('unlock', error.message + ' Ingresa el código recibido por correo.');
        } else setAuthError('login', error.message);
      }
    });

    document.getElementById('register-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      setAuthError('register', '');
      try {
        await api.register(formValues(event.currentTarget));
        await refreshApp();
        showApp();
      } catch (error) { setAuthError('register', error.message); }
    });

    document.getElementById('unlock-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      setAuthError('unlock', '');
      try {
        await api.unlock(formValues(event.currentTarget));
        showAuth('login');
        setAuthError('login', 'Cuenta desbloqueada. Ya puedes iniciar sesión.');
      } catch (error) { setAuthError('unlock', error.message); }
    });

    document.getElementById('resend-code-button').addEventListener('click', async function (event) {
      var email = document.querySelector('#unlock-form [name="email"]');
      if (!email.reportValidity()) return;
      var button = event.currentTarget;
      button.disabled = true;
      setAuthError('unlock', '');
      try {
        var result = await api.resendUnlockCode(email.value);
        setAuthError('unlock', result.mensaje);
        document.querySelector('#unlock-form [name="codigo"]').value = '';
      } catch (error) {
        setAuthError('unlock', error.message);
      } finally {
        button.disabled = false;
      }
    });

    document.getElementById('logout-button').addEventListener('click', async function () {
      try { await api.logout(); } catch (error) { notify(error.message); }
      activeProfileId = null;
      currentGames = [];
      showAuth('login');
    });

    document.getElementById('user-select').addEventListener('change', async function (event) {
      activeProfileId = event.target.value;
      try { await refreshCollection(); } catch (error) { notify(error.message); }
    });

    document.getElementById('add-user').addEventListener('click', function () {
      userForm.reset();
      document.getElementById('user-form-error').textContent = '';
      userDialog.showModal();
      document.getElementById('user-name').focus();
    });

    userForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      var name = document.getElementById('user-name').value.trim();
      try {
        var result = await api.createProfile(name);
        activeProfileId = result.perfil.id;
        userDialog.close();
        await refreshApp();
        notify('Perfil creado.');
      } catch (error) { document.getElementById('user-form-error').textContent = error.message; }
    });

    ['new-game', 'empty-add'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', function () { openGameForm(null); });
    });
    gameForm.addEventListener('submit', saveGame);

    document.getElementById('find-cover').addEventListener('click', async function (event) {
      var title = document.getElementById('game-name').value.trim();
      var button = event.currentTarget;
      if (!title) { document.getElementById('game-name').focus(); return; }
      button.disabled = true;
      try {
        var result = await api.cover(title);
        document.getElementById('game-image').value = result.fuente === 'predeterminada' ? '' : result.imagen;
        notify(result.fuente === 'predeterminada' ? 'No se encontró portada; se usará la imagen predeterminada.' : 'Portada encontrada.');
      } catch (error) { notify(error.message); }
      finally { button.disabled = false; }
    });

    document.getElementById('library-grid').addEventListener('click', async function (event) {
      var button = event.target.closest('[data-action]');
      if (!button || button.dataset.action === 'status') return;
      var card = button.closest('[data-game-id]');
      var game = card && findGame(card.dataset.gameId);
      if (!game) return;
      if (button.dataset.action === 'favorite') await updateGame(game, { favorito: !game.favorito });
      else if (button.dataset.action === 'detail') { ui.renderDetail(game); detailDialog.showModal(); }
      else if (button.dataset.action === 'edit') openGameForm(game);
      else if (button.dataset.action === 'add-hour') await updateGame(game, { horasJugadas: Number(game.horasJugadas) + 1, ultimaVezJugado: new Date().toISOString().slice(0, 10) });
      else if (button.dataset.action === 'wishlist') await updateGame(game, { esDeseado: !game.esDeseado, estado: game.esDeseado ? 'Pendiente' : 'Deseado' });
      else if (button.dataset.action === 'delete' && window.confirm('¿Eliminar "' + game.titulo + '"?')) {
        try { await api.deleteGame(game.id); await refreshCollection(); notify('Videojuego eliminado.'); }
        catch (error) { notify(error.message); }
      }
    });

    document.getElementById('library-grid').addEventListener('change', async function (event) {
      if (event.target.dataset.action !== 'status') return;
      var game = findGame(event.target.closest('[data-game-id]').dataset.gameId);
      if (game) await updateGame(game, { estado: event.target.value });
    });

    document.getElementById('detail-content').addEventListener('click', function (event) {
      var button = event.target.closest('[data-action="edit-detail"]');
      if (!button) return;
      var game = findGame(button.dataset.gameId);
      detailDialog.close();
      if (game) openGameForm(game);
    });

    document.addEventListener('click', function (event) {
      var closeButton = event.target.closest('[data-close]');
      if (closeButton) document.getElementById(closeButton.dataset.close).close();
      if ([gameDialog, detailDialog, userDialog].includes(event.target)) event.target.close();
    });

    document.getElementById('show-library').addEventListener('click', async function () {
      showingWishlist = false;
      document.getElementById('show-library').classList.add('is-active');
      document.getElementById('show-library').setAttribute('aria-pressed', 'true');
      document.getElementById('show-wishlist').classList.remove('is-active');
      document.getElementById('show-wishlist').setAttribute('aria-pressed', 'false');
      await refreshCollection();
    });

    document.getElementById('show-wishlist').addEventListener('click', async function () {
      showingWishlist = true;
      document.getElementById('show-wishlist').classList.add('is-active');
      document.getElementById('show-wishlist').setAttribute('aria-pressed', 'true');
      document.getElementById('show-library').classList.remove('is-active');
      document.getElementById('show-library').setAttribute('aria-pressed', 'false');
      await refreshCollection();
    });

    ['search-input', 'filter-genre', 'filter-platform', 'filter-status', 'filter-age', 'filter-favorites'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { ui.renderGames(applyFilters(currentGames), currentGames.length, showingWishlist); });
      document.getElementById(id).addEventListener('change', function () { ui.renderGames(applyFilters(currentGames), currentGames.length, showingWishlist); });
    });

    document.getElementById('clear-filters').addEventListener('click', function () {
      ['search-input', 'filter-genre', 'filter-platform', 'filter-status', 'filter-age'].forEach(function (id) { document.getElementById(id).value = ''; });
      document.getElementById('filter-favorites').checked = false;
      ui.renderGames(applyFilters(currentGames), currentGames.length, showingWishlist);
    });

    async function persistTheme() {
      var preferences = theme.readControls();
      theme.apply(preferences);
      var status = document.getElementById('preferences-status');
      status.textContent = 'Guardando…';
      window.clearTimeout(preferenceTimer);
      preferenceTimer = window.setTimeout(async function () {
        try { await api.savePreferences(preferences); status.textContent = 'Guardado'; }
        catch (error) { status.textContent = error.message; }
      }, 250);
    }
    document.getElementById('theme-form').addEventListener('input', persistTheme);
    document.getElementById('theme-form').addEventListener('change', persistTheme);
    document.getElementById('theme-toggle').addEventListener('click', function () {
      document.getElementById('theme-dark').checked = !document.getElementById('theme-dark').checked;
      document.getElementById('theme-background').value = document.getElementById('theme-dark').checked ? '#10151d' : '#f4f6f9';
      persistTheme();
    });

    api.me().then(async function () {
      await refreshApp();
      showApp();
    }).catch(function () { showAuth('login'); });
    document.documentElement.dataset.ready = 'true';
  });
})();
