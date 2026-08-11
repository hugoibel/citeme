/**
 * Sirve la app real desde localhost:8080 (origen autorizado en el Worker) y le
 * inyecta un arranque automático, para verificarla de punta a punta.
 *
 *   node server.js            → usa negocio.json
 *
 * Los datos van en negocio.json y NO por argumentos: los nombres con espacios y
 * apóstrofes ("Joe's Stone Crab") los parte PowerShell y se analiza otra cosa.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const APP = 'C:\\Users\\TechTablet\\citeme\\index.html';
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'negocio.json'), 'utf8'));

const arranque = `
<script>
window.addEventListener('load', () => {
  document.querySelector('[data-lang="${cfg.idioma || 'en'}"]').click();
  document.getElementById('fNombre').value = ${JSON.stringify(cfg.nombre)};
  document.getElementById('fCiudad').value = ${JSON.stringify(cfg.ciudad)};
  document.getElementById('fActividad').value = ${JSON.stringify(cfg.actividad)};
  document.getElementById('fPreguntas').value = ${JSON.stringify(String(cfg.preguntas || 4))};
  setTimeout(() => document.getElementById('btnGo').click(), 300);
});
</script>`;

http.createServer((req, res) => {
  const html = fs.readFileSync(APP, 'utf8').replace('</body>', arranque + '</body>');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(8080, '127.0.0.1', () => console.log('sirviendo:', cfg.nombre, '·', cfg.ciudad));
