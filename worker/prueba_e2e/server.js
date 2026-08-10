/**
 * Sirve la app real desde localhost:8080 (origen autorizado en el Worker) y le
 * inyecta un arranque automático para poder verificarla de punta a punta.
 */
const http = require('http');
const fs = require('fs');

const APP = 'C:\\Users\\TechTablet\\citeme\\index.html';
const NEGOCIO = process.argv[2] || "Joe's Stone Crab";
const CIUDAD = process.argv[3] || 'Miami Beach, FL';
const ACTIVIDAD = process.argv[4] || 'seafood restaurant';

const arranque = `
<script>
window.addEventListener('load', () => {
  document.querySelector('[data-lang="en"]').click();
  document.getElementById('fNombre').value = ${JSON.stringify(NEGOCIO)};
  document.getElementById('fCiudad').value = ${JSON.stringify(CIUDAD)};
  document.getElementById('fActividad').value = ${JSON.stringify(ACTIVIDAD)};
  document.getElementById('fPreguntas').value = '4';
  setTimeout(() => document.getElementById('btnGo').click(), 300);
});
</script>`;

http.createServer((req, res) => {
  const html = fs.readFileSync(APP, 'utf8').replace('</body>', arranque + '</body>');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(8080, '127.0.0.1', () => console.log('sirviendo la app en 8080'));
