/**
 * Lee los informes ya generados y saca la tabla de trabajo.
 *
 *   node resumir.js
 *
 * Se hace a partir de los HTML (y no del resumen que deja lote.js) para que
 * los números salgan iguales aunque la tanda se haya hecho en varias veces.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'informes');
const NEG = JSON.parse(fs.readFileSync(path.join(__dirname, 'negocios.json'), 'utf8'));

const filas = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort().map(f => {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const i = parseInt(f.slice(0, 2), 10);
  const n = NEG[i] || {};
  const score = html.match(/<div class="val"><b>(\d+)<\/b>/);
  const si = (html.match(/class="pill p-si"/g) || []).length;
  const no = (html.match(/class="pill p-no"/g) || []).length;
  const rivales = [...html.matchAll(/<span class="nm">([^<]+)<\/span>/g)].map(m => m[1]);
  const fuentes = [...html.matchAll(/<span class="src">([^<]+)<b>/g)].map(m => m[1].trim());
  return {
    archivo: f, negocio: n.nombre || f, sector: n.sector || '', ciudad: n.ciudad || '',
    punt: score ? parseInt(score[1], 10) : null,
    citado: si, total: si + no,
    rival: rivales[0] || '—', fuentes: fuentes.slice(0, 3).join(' · ') || '—'
  };
}).filter(f => f.punt !== null);

filas.sort((a, b) => a.punt - b.punt || a.citado - b.citado);

const md = ['# Informes de CiteMe — Tampa Bay', '',
  'Ordenados de **peor a mejor visibilidad**. Los de arriba son tus mejores clientes:',
  'son los que más tienen que perder y a los que más rápido se lo demuestras.', '',
  '| # | Negocio | Sector | Puntuación | Le cita | Quien se lo lleva | Informe |',
  '|--:|---------|--------|-----------:|---------|-------------------|---------|'];
filas.forEach((f, i) => md.push(
  `| ${i + 1} | ${f.negocio} | ${f.sector} | **${f.punt}**/100 | ${f.citado} de ${f.total} | ${f.rival} | \`${f.archivo}\` |`));

const ceros = filas.filter(f => f.punt === 0);
md.push('', '## Resumen', '',
  `- Negocios analizados: **${filas.length}**`,
  `- **Invisibles del todo (0/100): ${ceros.length}** — ni una sola mención en ninguna pregunta`,
  `- Puntuación media: **${Math.round(filas.reduce((a, f) => a + f.punt, 0) / filas.length)}/100**`,
  '', '## Cómo usarlos', '',
  '1. Abre el `.html` en el navegador y **Imprimir → Guardar como PDF**.',
  '2. Mándaselo al negocio sin pedir nada a cambio.',
  '3. A quien conteste, ofrécele la vigilancia mensual.', '');

fs.writeFileSync(path.join(DIR, 'RESUMEN.md'), md.join('\n'), 'utf8');
console.log(md.join('\n'));
