// Aplica el tema guardado (o el del sistema) antes de que se dibuje la página,
// para evitar un parpadeo. Es un archivo aparte y no un <script> en línea para
// cumplir la Content-Security-Policy (script-src 'self').
(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("demo-bolsa:theme");
    if (saved === "light" || saved === "dark") theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch {
    // Sin acceso al almacenamiento: se usa el tema oscuro.
  }
  document.documentElement.dataset.theme = theme;
  if (theme === "light") {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#f4f6f9");
  }
})();
