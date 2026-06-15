(function () {
  try {
    var t = localStorage.getItem('mf-thema');
    var r = document.documentElement;
    if (t === 'schemering') r.classList.add('thema-schemering');
    else if (t === 'donker') r.classList.add('thema-donker');
    else if (t === 'systeem' && window.matchMedia('(prefers-color-scheme: dark)').matches) r.classList.add('thema-donker');
  } catch (e) {}
})();
