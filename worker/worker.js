/**
 * CiteMe — backend (Cloudflare Worker)
 *
 * Esconde la clave de Gemini para que la web pueda estar abierta al público.
 * La web llama a POST /ask y este Worker es el único que conoce la clave.
 *
 * Variables que hay que poner en Cloudflare:
 *   GEMINI_KEY   (secret)  → la clave de aistudio.google.com/apikey
 *   ORIGENES     (var)     → dominios permitidos, separados por comas
 *   MODELO       (var, opcional) → fija el modelo; por defecto se elige solo
 *   LIMITE_DIA   (var, opcional) → consultas por IP y día (por defecto 60)
 * Opcional: un KV llamado CUOTA para que el límite por IP sea de verdad.
 *
 * Nota: el catálogo de Gemini cambia solo y hay modelos que SIGUEN LISTADOS pero
 * ya no admiten cuentas nuevas (dan 404 al usarlos). Por eso no se fija un id:
 * se ordenan los disponibles de más nuevo a más viejo y, si uno da 404, se pasa
 * al siguiente y se recuerda el que funcionó.
 */

const API = 'https://generativelanguage.googleapis.com/v1beta';
const RESERVA = ['gemini-flash-latest', 'gemini-2.0-flash'];

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origen = req.headers.get('Origin') || '';
    const cors = cabecerasCORS(origen, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/' || url.pathname === '/health') {
      const lista = await candidatos(env);
      return json({ ok: true, servicio: 'citeme', modelo: lista[0] || null, clave: !!env.GEMINI_KEY }, 200, cors);
    }
    if (url.pathname === '/modelos') {
      return json({ disponibles: await candidatos(env), enUso: MODELO_OK }, 200, cors);
    }
    if (url.pathname !== '/ask') return json({ error: 'not found' }, 404, cors);
    if (req.method !== 'POST') return json({ error: 'use POST' }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origen no permitido' }, 403, {});
    if (!env.GEMINI_KEY) return json({ error: 'falta configurar GEMINI_KEY' }, 500, cors);

    // ── validación de entrada ──
    let body;
    try { body = await req.json(); } catch { return json({ error: 'json inválido' }, 400, cors); }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return json({ error: 'falta prompt' }, 400, cors);
    if (prompt.length > 8000) return json({ error: 'prompt demasiado largo' }, 413, cors);
    const buscar = body.buscar === true, wantJson = body.json === true;
    // Modelo concreto (diagnóstico); solo se acepta si está en el catálogo real.
    const pedido = typeof body.modelo === 'string' ? body.modelo : null;

    // ── control de gasto: tope por IP y día ──
    const ip = req.headers.get('CF-Connecting-IP') || 'anon';
    const tope = parseInt(env.LIMITE_DIA || '60', 10);
    if (env.CUOTA) {
      const clave = 'q:' + new Date().toISOString().slice(0, 10) + ':' + ip;
      const usadas = parseInt((await env.CUOTA.get(clave)) || '0', 10);
      if (usadas >= tope) return json({ error: 'daily limit reached' }, 429, cors);
      ctx.waitUntil(env.CUOTA.put(clave, String(usadas + 1), { expirationTtl: 172800 }));
    }

    // ── llamada a Gemini ──
    const peticion = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    if (buscar) peticion.tools = [{ google_search: {} }];
    else if (wantJson) peticion.generationConfig = { responseMimeType: 'application/json', temperature: 0 };

    const res = await llamarGemini(env, peticion, buscar, pedido);
    if (res.error) return json({ error: res.error, detalle: res.detalle }, res.status, cors);

    const c = res.datos.candidates && res.datos.candidates[0];
    return json({
      texto: (c?.content?.parts || []).map(p => p.text).filter(Boolean).join('\n').trim(),
      fuentes: (c?.groundingMetadata?.groundingChunks || [])
        .map(g => g.web && (g.web.domain || g.web.title)).filter(Boolean),
      modelo: res.modelo
    }, 200, cors);
  }
};

/* Prueba los modelos por orden hasta que uno responda; recuerda el que funcionó. */
let MODELO_OK = null;
async function llamarGemini(env, peticion, buscar, pedido) {
  const lista = await candidatos(env);
  let orden;
  if (pedido && lista.includes(pedido)) orden = [pedido];
  else if (buscar && env.MODELO_BUSQUEDA) {
    // La búsqueda web solo es gratis en algunos modelos: se elige aparte.
    orden = [env.MODELO_BUSQUEDA, ...lista.filter(m => m !== env.MODELO_BUSQUEDA)];
  } else {
    orden = MODELO_OK ? [MODELO_OK, ...lista.filter(m => m !== MODELO_OK)] : lista;
  }
  let ultimo = { error: 'sin modelos disponibles', status: 502, detalle: '' };

  for (const m of orden.slice(0, 4)) {
    let r;
    try {
      r = await fetch(API + '/models/' + m + ':generateContent?key=' + env.GEMINI_KEY, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(peticion)
      });
    } catch (e) {
      ultimo = { error: 'no se pudo contactar con el modelo', status: 502, detalle: '' };
      continue;
    }
    if (r.ok) { if (!buscar && !pedido) MODELO_OK = m; return { datos: await r.json(), modelo: m }; }

    const detalle = (await r.text().catch(() => '')).slice(0, 300);
    if (r.status === 429) return { error: 'quota exhausted', status: 429, detalle };
    // 404 = ese modelo no sirve para esta cuenta → probar el siguiente
    if (r.status === 404 || r.status === 400) {
      if (MODELO_OK === m) MODELO_OK = null;
      ultimo = { error: 'upstream ' + r.status, status: 502, detalle };
      continue;
    }
    return { error: 'upstream ' + r.status, status: 502, detalle };
  }
  return ultimo;
}

/* Modelos utilizables, del más nuevo al más viejo. */
let CACHE = null;
async function candidatos(env) {
  if (env.MODELO) return [env.MODELO];
  if (CACHE) return CACHE;
  if (!env.GEMINI_KEY) return RESERVA;
  try {
    const r = await fetch(API + '/models?key=' + env.GEMINI_KEY + '&pageSize=500');
    if (r.ok) {
      const d = await r.json();
      const usables = (d.models || [])
        .filter(x => (x.supportedGenerationMethods || []).includes('generateContent'))
        .map(x => x.name.replace('models/', ''))
        .filter(n => /^gemini/.test(n))
        .filter(n => !/embedding|aqa|image|imagen|tts|audio|live|vision|robotics|learnlm|thinking/i.test(n));
      if (usables.length) return (CACHE = usables.sort(comparar));
    }
  } catch (_) {}
  return RESERVA;
}

/* Más nuevo primero; flash antes que pro; nada de preview/exp/lite si hay algo estable. */
function comparar(a, b) {
  return puntuar(b) - puntuar(a) || a.localeCompare(b);
}
function puntuar(n) {
  const v = n.match(/gemini-(\d+)(?:[.-](\d+))?/);
  // Un alias sin número (gemini-flash-latest) siempre apunta a un modelo vivo:
  // es la apuesta más segura, por delante de cualquier versión concreta.
  const version = v ? parseFloat(v[1] + '.' + (v[2] || '0')) : (/latest/.test(n) ? 99 : 0);
  let p = version * 100;
  if (/latest/.test(n)) p += 45;          // los alias -latest siempre apuntan a algo vivo
  if (/flash/.test(n)) p += 30;           // suficiente para esta tarea y más barato
  if (/lite/.test(n)) p -= 25;
  if (/preview|exp/.test(n)) p -= 60;
  if (/\d{2}-\d{2}$/.test(n)) p -= 15;    // instantáneas con fecha: se retiran antes
  return p;
}

function cabecerasCORS(origen, env) {
  const permitidos = (env.ORIGENES || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (permitidos.includes(origen) || permitidos.includes('*')) h['Access-Control-Allow-Origin'] = origen || '*';
  return h;
}

const json = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
