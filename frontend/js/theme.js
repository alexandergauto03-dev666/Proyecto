(function () {
  'use strict';

  function colorChannels(hex) {
    var value = hex.replace('#', '');
    return [0, 2, 4].map(function (offset) { return parseInt(value.slice(offset, offset + 2), 16) / 255; });
  }

  function luminance(hex) {
    return colorChannels(hex).map(function (channel) {
      return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    }).reduce(function (total, channel, index) { return total + channel * [0.2126, 0.7152, 0.0722][index]; }, 0);
  }

  function mix(first, second, amount) {
    var a = colorChannels(first);
    var b = colorChannels(second);
    return '#' + a.map(function (channel, index) {
      return Math.round((channel + (b[index] - channel) * amount) * 255).toString(16).padStart(2, '0');
    }).join('');
  }

  function contrastText(hex) {
    var value = luminance(hex);
    var whiteContrast = 1.05 / (value + 0.05);
    var darkContrast = (value + 0.05) / 0.05;
    return whiteContrast >= darkContrast ? '#ffffff' : '#000000';
  }

  function contrastRatio(first, second) {
    var values = [luminance(first), luminance(second)].sort(function (a, b) { return b - a; });
    return (values[0] + 0.05) / (values[1] + 0.05);
  }

  function mutedColor(background, text) {
    var result = text;
    for (var amount = 0.01; amount <= 0.7; amount += 0.01) {
      var candidate = mix(text, background, amount);
      if (contrastRatio(candidate, background) < 4.5) break;
      result = candidate;
    }
    return result;
  }

  function apply(preferences) {
    const root = document.documentElement;
    var textColor = contrastText(preferences.colorFondo);
    var darkBackground = textColor === '#ffffff';
    root.dataset.theme = darkBackground ? 'dark' : 'light';
    var text = darkBackground ? '#ffffff' : '#000000';
    var muted = mutedColor(preferences.colorFondo, text);
    var surface = mix(preferences.colorFondo, text, darkBackground ? 0.075 : 0.045);
    var border = mix(preferences.colorFondo, text, darkBackground ? 0.2 : 0.16);
    var accentText = contrastText(preferences.colorPrimario);
    root.style.setProperty('--paper', preferences.colorFondo);
    root.style.setProperty('--ink', text);
    root.style.setProperty('--text-color', text);
    root.style.setProperty('--muted', muted);
    root.style.setProperty('--text-muted', muted);
    root.style.setProperty('--surface', surface);
    root.style.setProperty('--card-bg', surface);
    root.style.setProperty('--line', border);
    root.style.setProperty('--border-color', border);
    root.style.setProperty('--green', preferences.colorPrimario);
    root.style.setProperty('--accent-fg', accentText);
    root.style.setProperty('--green-dark', mix(preferences.colorPrimario, darkBackground ? '#000000' : '#ffffff', 0.22));
    const accent = document.getElementById('theme-dark');
    const primary = document.getElementById('theme-primary');
    const background = document.getElementById('theme-background');
    if (accent) accent.checked = darkBackground;
    if (primary) primary.value = preferences.colorPrimario;
    if (background) background.value = preferences.colorFondo;
  }

  function readControls() {
    return {
      modoOscuro: document.getElementById('theme-dark').checked,
      colorPrimario: document.getElementById('theme-primary').value,
      colorFondo: document.getElementById('theme-background').value,
      estiloTarjeta: 'elevated'
    };
  }

  window.GameShelfTheme = { apply, readControls };
})();
