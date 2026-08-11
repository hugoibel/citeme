/**
 * Genera informes de CiteMe en lote para una lista de negocios reales.
 *
 *   node lote.js            → todos los de negocios.json
 *   node lote.js 0 5        → solo del índice 0 al 4 (para no agotar la cuota)
 *
 * Sirve la app en localhost:8080 (origen autorizado en el Worker), la abre con
 * Edge en modo headless una vez por negocio y guarda el informe ya renderizado.
 * Cada informe queda listo para imprimir a PDF y mandárselo al negocio.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const APP = 'C:\\Users\\TechTablet\\citeme\\index.html';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SALIDA = path.join(__dirname, 'informes');
const NEGOCIOS = JSON.parse(fs.readFileSync(path.join(__dirname, 'negocios.json'), 'utf8'));

const desde = parseInt(process.argv[2] || '0', 10);
const hasta = parseInt(process.argv[3] || String(NEGOCIOS.length), 10);
const lote = NEGOCIOS.slice(desde, hasta);

if (!fs.existsSync(SALIDA)) fs.mkdirSync(SALIDA);

const servidor = http.createServer((req, res) => {
  const i = parseInt(new URL(req.url, 'http://x').searchParams.get('i') || '0', 10);
  const n = NEGOCIOS[i];
  const arranque = `
<script>
window.addEventListener('load', () => {
  document.querySelector('[data-lang="en"]').click();
  document.getElementById('fNombre').value = ${JSON.stringify(n.nombre)};
  document.getElementById('fCiudad').value = ${JSON.stringify(n.ciudad)};
  document.getElementById('fActividad').value = ${JSON.stringify(n.actividad)};
  document.getElementById('fPreguntas').value = '4';
  setTimeout(() => document.getElementById('btnGo').click(), 300);
});
</script>`;
  const html = fs.readFileSync(APP, 'utf8').replace('</body>', arranque + '</body>');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function analizar(indice) {
  return new Promise(resolve => {
    const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=200000',
      '--user-data-dir=' + path.join(SALIDA, '.perfil' + indice), '--dump-dom',
      'http://localhost:8080/?i=' + indice];
    execFile(EDGE, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => {
      resolve(stdout || '');
    });
  });
}

(async () => {
  await new Promise(r => servidor.listen(8080, '127.0.0.1', r));
  const resumen = [];

  for (let k = 0; k < lote.length; k++) {
    const i = desde + k;
    const n = NEGOCIOS[i];
    process.stdout.write(`[${k + 1}/${lote.length}] ${n.nombre} … `);

    const dom = await analizar(i);
    // El informe renderizado, sin scripts: listo para abrir e imprimir a PDF.
    const limpio = dom.replace(/<script[\s\S]*?<\/script>/g, '');
    const archivo = path.join(SALIDA, String(i).padStart(2, '0') + '-' + slug(n.nombre) + '.html');
    fs.writeFileSync(archivo, limpio, 'utf8');

    const mScore = dom.match(/<div class="val"><b>(\d+)<\/b>/);
    const citas = (dom.match(/class="pill p-si"/g) || []).length;
    const noCitas = (dom.match(/class="pill p-no"/g) || []).length;
    const rivales = [...dom.matchAll(/<span class="nm">([^<]+)<\/span>/g)].map(m => m[1]);
    const fuentes = [...dom.matchAll(/<span class="src">([^<]+)<b>/g)].map(m => m[1].trim());

    const fila = {
      sector: n.sector, negocio: n.nombre, ciudad: n.ciudad,
      puntuacion: mScore ? parseInt(mScore[1], 10) : null,
      citado: citas, total: citas + noCitas,
      rival: rivales[0] || '', fuentes: fuentes.slice(0, 3).join(' · '),
      archivo: path.basename(archivo)
    };
    resumen.push(fila);
    console.log(fila.puntuacion === null ? 'SIN INFORME' : fila.puntuacion + '/100 (' + citas + ' de ' + (citas + noCitas) + ')');
    fs.writeFileSync(path.join(SALIDA, 'resumen.json'), JSON.stringify(resumen, null, 2), 'utf8');
  }

  // Tabla ordenada: los peores primero, que son los mejores clientes.
  const orden = [...resumen].sort((a, b) => (a.puntuacion ?? 999) - (b.puntuacion ?? 999));
  const md = ['# Informes de CiteMe — Tampa Bay', '',
    'Ordenados de peor a mejor visibilidad: **los de arriba son los mejores clientes**,',
    'porque son los que más tienen que perder y más fácil es demostrárselo.', '',
    '| # | Negocio | Sector | Puntuación | Le cita | Quien se lo lleva | Informe |',
    '|---|---------|--------|-----------|---------|-------------------|---------|'];
  orden.forEach((f, i) => md.push(
    `| ${i + 1} | ${f.negocio} | ${f.sector} | **${f.puntuacion ?? '—'}**/100 | ${f.citado} de ${f.total} | ${f.rival || '—'} | \`${f.archivo}\` |`));
  md.push('', '## Cómo usarlos', '',
    '1. Abre el `.html` en el navegador y **Imprimir → Guardar como PDF**.',
    '2. Mándaselo al negocio sin pedir nada a cambio.',
    '3. A quien conteste, ofrécele la vigilancia mensual.', '');
  fs.writeFileSync(path.join(SALIDA, 'RESUMEN.md'), md.join('\n'), 'utf8');

  console.log('\nListo. ' + resumen.length + ' informes en ' + SALIDA);
  servidor.close();
  process.exit(0);
})();
