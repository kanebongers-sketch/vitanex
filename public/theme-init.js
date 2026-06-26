(function () {
  try {
    var t = localStorage.getItem('mf-thema');
    var r = document.documentElement;
    if (t === 'schemering') r.classList.add('thema-schemering');
    else if (t === 'licht') { /* no class = light */ }
    else if (t === 'systeem') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) r.classList.add('thema-donker');
    } else r.classList.add('thema-donker'); // default: dark
  } catch (e) {}
})();
