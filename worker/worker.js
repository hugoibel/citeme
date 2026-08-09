/**
 * CiteMe — backend (Cloudflare Worker)
 *
 * Esconde la clave de Gemini para que la web pueda estar abierta al público.
 * La web llama a POST /ask y este Worker es el único que conoce la clave.
 *
 * Variables que hay que poner en Cloudflare:
 *   GEMINI_KEY   (secret)  → la clave de aistudio.google.com/apikey
 *   ORIGENES     (var)     → dominios permitidos, separados por comas
 *                            ej: https://hugoibel.github.io,http://localhost:8080
 *   MODELO       (var, opcional) → por defecto se autodetecta
 *   LIMITE_DIA   (var, opcional) → consultas por IP y día (por defecto 60)
 * Opcional: un KV llamado CUOTA para que el límite por IP sea de verdad.
 */

const MODELOS_PREF = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const API = 'https://generativelanguage.googleapis.com/v1beta';

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origen = req.headers.get('Origin') || '';
    const cors = cabecerasCORS(origen, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/' || url.pathname === '/health')
      return json({ ok: true, servicio: 'citeme', modelo: await modelo(env) }, 200, cors);
    if (url.pathname !== '/ask') return json({ error: 'not found' }, 404, cors);
    if (req.method !== 'POST') return json({ error: 'use POST' }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origen no permitido' }, 403, {});
    if (!env.GEMINI_KEY) return json({ error: 'falta configurar GEMINI_KEY' }, 500, cors);

    // ── control de gasto: tope por IP y día ──
    const ip = req.headers.get('CF-Connecting-IP') || 'anon';
    const tope = parseInt(env.LIMITE_DIA || '60', 10);
    if (env.CUOTA) {
      const hoy = new Date().toISOString().slice(0, 10);
      const clave = 'q:' + hoy + ':' + ip;
      const usadas = parseInt((await env.CUOTA.get(clave)) || '0', 10);
      if (usadas >= tope) return json({ error: 'daily limit reached' }, 429, cors);
      ctx.waitUntil(env.CUOTA.put(clave, String(usadas + 1), { expirationTtl: 172800 }));
    }

    // ── validación de entrada ──
    let body;
    try { body = await req.json(); } catch { return json({ error: 'json inválido' }, 400, cors); }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) return json({ error: 'falta prompt' }, 400, cors);
    if (prompt.length > 8000) return json({ error: 'prompt demasiado largo' }, 413, cors);
    const buscar = body.buscar === true, wantJson = body.json === true;

    // ── llamada a Gemini ──
    const peticion = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    if (buscar) peticion.tools = [{ google_search: {} }];
    else if (wantJson) peticion.generationConfig = { responseMimeType: 'application/json', temperature: 0 };

    const m = await modelo(env);
    let r;
    try {
      r = await fetch(API + '/models/' + m + ':generateContent?key=' + env.GEMINI_KEY, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(peticion)
      });
    } catch (e) { return json({ error: 'no se pudo contactar con el modelo' }, 502, cors); }

    if (!r.ok) {
      const detalle = (await r.text().catch(() => '')).slice(0, 300);
      // 429 = cuota mensual agotada; se lo decimos claro al cliente sin filtrar la clave
      return json({ error: r.status === 429 ? 'quota exhausted' : 'upstream ' + r.status, detalle }, r.status === 429 ? 429 : 502, cors);
    }

    const d = await r.json();
    const c = d.candidates && d.candidates[0];
    return json({
      texto: (c?.content?.parts || []).map(p => p.text).filter(Boolean).join('\n').trim(),
      fuentes: (c?.groundingMetadata?.groundingChunks || [])
        .map(g => g.web && (g.web.domain || g.web.title)).filter(Boolean)
    }, 200, cors);
  }
};

/* Detecta un modelo válido una vez y lo cachea en el aislado (los ids cambian con el tiempo). */
let MODELO_CACHE = null;
async function modelo(env) {
  if (env.MODELO) return env.MODELO;
  if (MODELO_CACHE) return MODELO_CACHE;
  try {
    const r = await fetch(API + '/models?key=' + env.GEMINI_KEY + '&pageSize=200');
    if (r.ok) {
      const d = await r.json();
      const dis = (d.models || [])
        .filter(x => (x.supportedGenerationMethods || []).includes('generateContent'))
        .map(x => x.name.replace('models/', ''))
        .filter(n => !/embedding|aqa|image|tts|vision|live|native-audio/i.test(n));
      const elegido = MODELOS_PREF.find(p => dis.includes(p))
        || dis.sort((a, b) => (/flash/.test(a) ? 0 : 1) - (/flash/.test(b) ? 0 : 1))[0];
      if (elegido) return (MODELO_CACHE = elegido);
    }
  } catch (_) {}
  return MODELOS_PREF[0];
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
