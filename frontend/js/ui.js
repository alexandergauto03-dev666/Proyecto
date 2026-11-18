(function () {
  "use strict";

  function option(value, label) {
    var item = document.createElement("option");
    item.value = value;
    item.textContent = label;
    return item;
  }

  function setSelectOptions(select, values, placeholder) {
    select.replaceChildren(option("", placeholder));
    values.forEach(function (value) { select.appendChild(option(value, value)); });
  }

  function initializeOptions(storage) {
    setSelectOptions(document.getElementById("game-genre"), storage.genres, "Seleccionar genero");
    setSelectOptions(document.getElementById("game-platform"), storage.platforms, "Seleccionar plataforma");
    setSelectOptions(document.getElementById("game-status"), storage.statuses, "Seleccionar estado");
    setSelectOptions(document.getElementById("filter-genre"), storage.genres, "Todos");
    setSelectOptions(document.getElementById("filter-platform"), storage.platforms, "Todas");
    setSelectOptions(document.getElementById("filter-status"), storage.statuses, "Todos");
  }

  function renderUsers(users, activeUserId) {
    var select = document.getElementById("user-select");
    select.replaceChildren();
    users.forEach(function (user) {
      var item = option(user.id, user.nombre);
      item.selected = user.id === activeUserId;
      select.appendChild(item);
    });
  }

  function createCover(game) {
    var colors = [["#244f43", "#c2e679"], ["#a95343", "#f1bc72"], ["#304b67", "#9ec3c7"], ["#8a6c38", "#f0d47a"]];
    var index = Array.from(game.nombre).reduce(function (sum, character) { return sum + character.charCodeAt(0); }, 0) % colors.length;
    var title = game.nombre.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="' + colors[index][0] + '"/><stop offset="1" stop-color="' + colors[index][1] + '"/></linearGradient></defs><rect width="640" height="420" fill="url(#g)"/><circle cx="510" cy="90" r="130" fill="#fff" opacity=".1"/><path d="M0 340 190 190l115 100 130-150 205 180v100H0Z" fill="#101b17" opacity=".24"/><text x="42" y="355" fill="#fff" font-family="sans-serif" font-size="38" font-weight="bold">' + title + '</text><text x="44" y="388" fill="#fff" opacity=".76" font-family="sans-serif" font-size="13" letter-spacing="3">GAMESHELF COLLECTION</text></svg>';
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function createImage(game, className) {
    var image = document.createElement("img");
    image.className = className;
    image.alt = "Portada de " + game.nombre;
    image.src = game.imagen || createCover(game);
    image.addEventListener("error", function () {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = "true";
      image.src = createCover(game);
    });
    return image;
  }

  function makeButton(text, className, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.setAttribute("aria-label", label);
    return button;
  }

  function renderGames(games, totalCount) {
    var grid = document.getElementById("library-grid");
    var empty = document.getElementById("empty-state");
    var hasFilters = Boolean(document.getElementById("search-input").value || document.getElementById("filter-genre").value || document.getElementById("filter-platform").value || document.getElementById("filter-status").value || document.getElementById("filter-favorites").checked);
    grid.replaceChildren();
    document.getElementById("results-count").textContent = games.length + (games.length === 1 ? " juego" : " juegos") + (totalCount !== games.length ? " de " + totalCount : "");
    document.getElementById("library-summary").textContent = totalCount + (totalCount === 1 ? " juego en tu biblioteca." : " juegos en tu biblioteca.");
    empty.hidden = games.length > 0;
    grid.hidden = games.length === 0;
    document.getElementById("empty-title").textContent = totalCount === 0 ? "Todavia no hay juegos" : "No encontramos coincidencias";
    document.getElementById("empty-message").textContent = totalCount === 0 ? "Agrega tu primer videojuego para empezar tu coleccion." : (hasFilters ? "Prueba cambiando o limpiando los filtros." : "Agrega un videojuego para completar tu coleccion.");
    document.getElementById("empty-add").hidden = totalCount > 0;

    games.forEach(function (game) {
      var card = document.createElement("article");
      card.className = "game-card";
      card.dataset.gameId = game.id;
      var cover = document.createElement("div");
      cover.className = "game-cover";
      cover.appendChild(createImage(game, "game-cover-image"));
      var favorite = makeButton(game.favorito ? "&#9733;" : "&#9734;", "favorite-button" + (game.favorito ? " is-favorite" : ""), game.favorito ? "Quitar de favoritos" : "Marcar como favorito");
      favorite.innerHTML = game.favorito ? "&#9733;" : "&#9734;";
      favorite.dataset.action = "favorite";
      cover.appendChild(favorite);
      var content = document.createElement("div");
      content.className = "game-card-content";
      var tags = document.createElement("div");
      tags.className = "game-tags";
      var genre = document.createElement("span");
      genre.textContent = game.genero;
      var platform = document.createElement("span");
      platform.textContent = game.plataforma;
      tags.append(genre, platform);
      var title = document.createElement("h3");
      title.textContent = game.nombre;
      title.title = game.nombre;
      var statusRow = document.createElement("div");
      statusRow.className = "status-row";
      var badge = document.createElement("span");
      badge.className = "status-badge status-" + game.estado.toLowerCase();
      badge.textContent = game.estado;
      var statusSelect = document.createElement("select");
      statusSelect.className = "card-status-select";
      statusSelect.setAttribute("aria-label", "Cambiar estado de " + game.nombre);
      statusSelect.dataset.action = "status";
      ["Pendiente", "Jugando", "Terminado"].forEach(function (status) {
        var item = option(status, status);
        item.selected = status === game.estado;
        statusSelect.appendChild(item);
      });
      statusRow.append(badge, statusSelect);
      var actions = document.createElement("div");
      actions.className = "card-actions";
      var detail = makeButton("Ver detalle", "text-action", "Ver detalle de " + game.nombre);
      detail.dataset.action = "detail";
      var edit = makeButton("Editar", "text-action", "Editar " + game.nombre);
      edit.dataset.action = "edit";
      var remove = makeButton("Eliminar", "text-action text-danger", "Eliminar " + game.nombre);
      remove.dataset.action = "delete";
      actions.append(detail, edit, remove);
      content.append(tags, title, statusRow, actions);
      card.append(cover, content);
      grid.appendChild(card);
    });
  }

  function renderDetail(game) {
    var content = document.getElementById("detail-content");
    content.replaceChildren();
    var close = makeButton("&#10005;", "icon-button detail-close", "Cerrar detalle");
    close.innerHTML = "&#10005;";
    close.dataset.close = "detail-dialog";
    var image = createImage(game, "detail-cover");
    var body = document.createElement("div");
    body.className = "detail-body";
    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = game.genero + " / " + game.plataforma;
    var title = document.createElement("h2");
    title.textContent = game.nombre;
    var description = document.createElement("p");
    description.className = "detail-description";
    description.textContent = game.descripcion || "Sin descripcion.";
    var meta = document.createElement("dl");
    meta.className = "detail-meta";
    [["Estado", game.estado], ["Fecha de lanzamiento", game.fechaLanzamiento || "Sin fecha"], ["Favorito", game.favorito ? "Si" : "No"]].forEach(function (pair) {
      var group = document.createElement("div");
      var term = document.createElement("dt");
      term.textContent = pair[0];
      var value = document.createElement("dd");
      value.textContent = pair[1];
      group.append(term, value);
      meta.appendChild(group);
    });
    var edit = makeButton("Editar videojuego", "button button-primary", "Editar " + game.nombre);
    edit.dataset.action = "edit-detail";
    edit.dataset.gameId = game.id;
    body.append(eyebrow, title, description, meta, edit);
    content.append(close, image, body);
  }

  var statusOptions = ["Pendiente", "Jugando", "Terminado"];

  function initializeApiOptions() {
    setSelectOptions(document.getElementById("game-genre"), ["Acción", "Aventura", "RPG", "Estrategia", "Deportes", "Simulación", "Indie", "Otro"], "Seleccionar género");
    setSelectOptions(document.getElementById("game-platform"), ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Móvil", "Otra"], "Seleccionar plataforma");
    setSelectOptions(document.getElementById("game-rating"), ["ATP", "+7", "+12", "+16", "+18"], "Seleccionar clasificación");
    setSelectOptions(document.getElementById("game-status"), statusOptions, "Seleccionar estado");
    setSelectOptions(document.getElementById("filter-genre"), ["Acción", "Aventura", "RPG", "Estrategia", "Deportes", "Simulación", "Indie", "Otro"], "Todos");
    setSelectOptions(document.getElementById("filter-platform"), ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Móvil", "Otra"], "Todas");
    setSelectOptions(document.getElementById("filter-status"), statusOptions, "Todos");
    setSelectOptions(document.getElementById("filter-age"), ["ATP", "+7", "+12", "+16", "+18"], "Todas");
  }

  function renderProfiles(profiles, activeId) {
    var select = document.getElementById("user-select");
    select.replaceChildren();
    profiles.forEach(function (profile) {
      var item = option(String(profile.id), profile.nombre);
      item.selected = String(profile.id) === String(activeId);
      select.appendChild(item);
    });
  }

  function renderApiGames(games, totalCount, desired) {
    var grid = document.getElementById("library-grid");
    var empty = document.getElementById("empty-state");
    var hasFilters = Boolean(document.getElementById("search-input").value || document.getElementById("filter-genre").value || document.getElementById("filter-platform").value || document.getElementById("filter-status").value || document.getElementById("filter-age").value || document.getElementById("filter-favorites").checked);
    grid.replaceChildren();
    document.getElementById("results-count").textContent = games.length + (games.length === 1 ? " juego" : " juegos") + (totalCount !== games.length ? " de " + totalCount : "");
    document.getElementById("results-heading").textContent = desired ? "Lista de deseados" : "Tu colección";
    document.getElementById("library-summary").textContent = totalCount + (totalCount === 1 ? " juego" : " juegos") + (desired ? " por descubrir." : " en tu biblioteca.");
    empty.hidden = games.length > 0;
    grid.hidden = games.length === 0;
    document.getElementById("empty-title").textContent = totalCount === 0 ? (desired ? "Tu lista está vacía" : "Todavía no hay juegos") : "No encontramos coincidencias";
    document.getElementById("empty-message").textContent = totalCount === 0 ? (desired ? "Guarda aquí los juegos que quieres descubrir." : "Agrega tu primer videojuego para empezar tu colección.") : (hasFilters ? "Prueba cambiando o limpiando los filtros." : "Agrega un videojuego para completar tu colección.");
    document.getElementById("empty-add").hidden = desired || totalCount > 0;

    games.forEach(function (game) {
      var card = document.createElement("article");
      card.className = "game-card";
      card.dataset.gameId = game.id;
      var cover = document.createElement("div");
      cover.className = "game-cover";
      var image = document.createElement("img");
      image.className = "game-cover-image";
      image.alt = "Portada de " + game.titulo;
      image.src = game.imagen || fallbackCover();
      image.addEventListener("error", function () { image.src = fallbackCover(); }, { once: true });
      cover.appendChild(image);
      var favorite = makeButton(game.favorito ? "★" : "☆", "favorite-button" + (game.favorito ? " is-favorite" : ""), game.favorito ? "Quitar de favoritos" : "Marcar como favorito");
      favorite.dataset.action = "favorite";
      cover.appendChild(favorite);
      var content = document.createElement("div");
      content.className = "game-card-content";
      var tags = document.createElement("div");
      tags.className = "game-tags";
      [game.genero, game.plataforma, game.clasificacionEdad].forEach(function (value, index) {
        var tag = document.createElement("span");
        if (index === 2) tag.className = "age-badge";
        tag.textContent = value;
        tags.appendChild(tag);
      });
      var title = document.createElement("h3");
      title.textContent = game.titulo;
      var meta = document.createElement("p");
      meta.className = "game-meta";
      meta.textContent = game.horasJugadas + " h · " + game.logrosObtenidos + "/" + game.logrosTotales + " logros";
      var progress = document.createElement("div");
      progress.className = "achievement-progress";
      var progressValue = game.logrosTotales ? Math.round((game.logrosObtenidos / game.logrosTotales) * 100) : 0;
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", "Progreso de logros de " + game.titulo);
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(progressValue));
      var progressBar = document.createElement("span");
      progressBar.style.width = progressValue + "%";
      progress.appendChild(progressBar);
      var statusRow = document.createElement("div");
      statusRow.className = "status-row";
      var badge = document.createElement("span");
      badge.className = "status-badge status-" + game.estado.toLowerCase();
      badge.textContent = game.estado;
      statusRow.appendChild(badge);
      if (!desired) {
        var status = document.createElement("select");
        status.className = "card-status-select";
        status.setAttribute("aria-label", "Cambiar estado de " + game.titulo);
        status.dataset.action = "status";
        statusOptions.forEach(function (value) {
          var item = option(value, value);
          item.selected = value === game.estado;
          status.appendChild(item);
        });
        statusRow.appendChild(status);
      }
      var actions = document.createElement("div");
      actions.className = "card-actions";
      var cardActions = [["Detalle", "detail"], ["Editar", "edit"]];
      if (!desired) cardActions.push(["+1h", "add-hour"]);
      cardActions.push([desired ? "A biblioteca" : "Deseados", "wishlist"], ["Eliminar", "delete"]);
      cardActions.forEach(function (action) {
        var button = makeButton(action[0], "text-action" + (action[1] === "delete" ? " text-danger" : ""), action[0] + " " + game.titulo);
        button.dataset.action = action[1];
        actions.appendChild(button);
      });
      content.append(tags, title, meta, progress, statusRow, actions);
      card.append(cover, content);
      grid.appendChild(card);
    });
  }

  function fallbackCover() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="#245c45"/><path d="M0 340 190 190l115 100 130-150 205 180v100H0Z" fill="#c9ef74" opacity=".55"/><text x="38" y="370" fill="white" font-family="sans-serif" font-size="28">GameShelf</text></svg>';
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function renderStats(stats) {
    var most = document.getElementById("most-played");
    var least = document.getElementById("least-used");
    most.replaceChildren();
    least.replaceChildren();
    [[most, "MÁS JUGADO", stats.juegoMasJugado, stats.juegoMasJugado ? stats.juegoMasJugado.horasJugadas + " horas" : "Registra tus primeras horas"],
      [least, "PARA VOLVER A JUGAR", stats.juegoMenosUsado, stats.juegoMenosUsado ? (stats.juegoMenosUsado.diasDesdeUltimaVez == null ? "Aún no hay una última sesión registrada" : "Hace " + stats.juegoMenosUsado.diasDesdeUltimaVez + " días") : "Sin datos"]]
      .forEach(function (entry) {
        var label = document.createElement("span"); label.className = "stat-label"; label.textContent = entry[1];
        var title = document.createElement("strong"); title.textContent = entry[2] ? entry[2].titulo : "Sin datos";
        var detail = document.createElement("span"); detail.className = "stat-detail"; detail.textContent = entry[3];
        entry[0].append(label, title, detail);
      });
    var month = stats.mensual;
    var monthly = document.getElementById("monthly-summary");
    monthly.replaceChildren();
    ["RESUMEN · " + month.anioMes, month.horasJugadas + " h jugadas", month.juegosTerminados + " terminados · " + month.logrosConseguidos + " logros · " + (month.generoPredominante || "sin género predominante")]
      .forEach(function (text, index) {
        var item = document.createElement(index === 1 ? "strong" : "span");
        item.className = index === 0 ? "stat-label" : "stat-detail";
        item.textContent = text;
        monthly.appendChild(item);
      });
  }

  function renderApiDetail(game) {
    var content = document.getElementById("detail-content");
    content.replaceChildren();
    var close = makeButton("×", "icon-button detail-close", "Cerrar detalle");
    close.dataset.close = "detail-dialog";
    var image = document.createElement("img");
    image.className = "detail-cover";
    image.alt = "Portada de " + game.titulo;
    image.src = game.imagen || fallbackCover();
    var body = document.createElement("div");
    body.className = "detail-body";
    var eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = game.genero + " / " + game.plataforma;
    var title = document.createElement("h2"); title.textContent = game.titulo;
    var description = document.createElement("p"); description.className = "detail-description"; description.textContent = game.descripcion || "Sin descripción.";
    var meta = document.createElement("dl"); meta.className = "detail-meta";
    [["Estado", game.esDeseado ? "Deseado" : game.estado], ["Clasificación", game.clasificacionEdad], ["Lanzamiento", game.anioLanzamiento || "Sin año"], ["Horas jugadas", game.horasJugadas], ["Logros", game.logrosObtenidos + " / " + game.logrosTotales], ["Última sesión", game.ultimaVezJugado || "Sin registrar"]].forEach(function (pair) {
      var group = document.createElement("div"); var term = document.createElement("dt"); term.textContent = pair[0]; var value = document.createElement("dd"); value.textContent = String(pair[1]); group.append(term, value); meta.appendChild(group);
    });
    var edit = makeButton("Editar videojuego", "button button-primary", "Editar " + game.titulo);
    edit.dataset.action = "edit-detail";
    edit.dataset.gameId = game.id;
    body.append(eyebrow, title, description, meta, edit);
    content.append(close, image, body);
  }

  window.GameShelfUI = { initializeOptions: initializeApiOptions, renderUsers: renderProfiles, renderGames: renderApiGames, renderStats: renderStats, renderDetail: renderApiDetail };
})();
