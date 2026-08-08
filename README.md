# CiteMe

Comprueba si la IA (ChatGPT, Gemini, Perplexity) recomienda un negocio local cuando un cliente
busca ese servicio en su ciudad — y enseña **por qué recomienda a otros**.

🔗 **https://hugoibel.github.io/citeme/** · informe de ejemplo: [`#sample`](https://hugoibel.github.io/citeme/#sample)

- `index.html` — la app entera (bilingüe EN/ES, sin dependencias, sin build).
- `worker/` — el backend de Cloudflare que esconde la clave de la API.
- `NEGOCIO.md` — el plan de negocio y los números.

---

## 1. Desplegar el backend (10 minutos, gratis)

Sin esto la web funciona, pero cada visitante tendría que poner su propia clave. Con esto
funciona para cualquiera.

### Camino A — desde el panel (sin instalar nada)

1. Crea cuenta en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Start with Hello World!** → nombre: `citeme-api` → **Deploy**.
2. **Edit code**, borra todo y pega el contenido de `worker/worker.js`. **Deploy**.
3. **Settings → Variables and Secrets**:
   - `GEMINI_KEY` → tipo **Secret** → tu clave de [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   - `ORIGENES` → tipo **Text** → `https://hugoibel.github.io`
   - `LIMITE_DIA` → tipo **Text** → `60`
4. Copia la URL que te da (algo como `https://citeme-api.TU-CUENTA.workers.dev`) y compruébala
   en el navegador: debe responder `{"ok":true,...}`.

### Camino B — por línea de comandos

```bash
cd worker
npx wrangler login
npx wrangler secret put GEMINI_KEY     # pega la clave cuando la pida
npx wrangler deploy
```

### Conectar la web con el backend

Edita `index.html`, línea de la constante `BACKEND`, y pon tu URL:

```js
const BACKEND = localStorage.getItem('citeme_backend') || "https://citeme-api.TU-CUENTA.workers.dev";
```

Haz `git add index.html && git commit -m "conectar backend" && git push`. En 1 minuto está vivo.

> Para probarlo sin publicar: abre la consola del navegador en la web y ejecuta
> `localStorage.setItem('citeme_backend','https://…workers.dev')`, recarga y listo.

## 2. Control del gasto

- Gemini regala **5.000 consultas con búsqueda al mes**. Un análisis gratuito (4 preguntas)
  gasta ~9 → unos **550 análisis gratis al mes**. Sin tarjeta en Google Cloud **no puede
  cobrarte nada**: cuando se agota, el backend devuelve `quota exhausted`.
- El Worker corta a **60 consultas por IP y día**. Para que el tope sea infalible, crea el KV:
  `npx wrangler kv namespace create CUOTA` y descomenta el bloque en `wrangler.toml`.
- Los análisis de 10 y 15 preguntas quedan bloqueados en la web pública (son los de pago).

## 3. Poner tu contacto

En `index.html`:

```js
const CONTACTO = { whatsapp:"1XXXXXXXXXX", email:"tucorreo@…" };   // WhatsApp con el 1 delante, sin +
const PRECIOS  = { informe:"$99", vigilancia:"$49" };
```

## Cómo trabajar en local

Doble clic en `index.html`. Para el modo público hace falta servirlo por http:

```bash
python -m http.server 8080     # luego abre http://localhost:8080
```
