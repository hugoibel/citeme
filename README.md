# CiteMe

Comprueba si la IA (ChatGPT, Gemini, Perplexity) recomienda un negocio local cuando un cliente
busca ese servicio en su ciudad — y enseña **por qué recomienda a otros**.

🔗 **https://hugoibel.github.io/citeme/** · informe de ejemplo: [`#sample`](https://hugoibel.github.io/citeme/#sample)

- `index.html` — la app entera (bilingüe EN/ES, sin dependencias, sin build).
- `worker/` — el backend de Cloudflare que esconde la clave de la API.
- `NEGOCIO.md` — el plan de negocio y los números.

---

## Estado del backend

✅ **Desplegado y funcionando**: `https://citeme-api.citemeai.workers.dev`
(cuenta `Hugoibel91@gmail.com`, subdominio `citemeai`, script `citeme-api`).
La web ya apunta a él. Comprobar en cualquier momento:
[`/health`](https://citeme-api.citemeai.workers.dev/health) → debe responder `{"ok":true,…}`.

✅ **Clave puesta y facturación activada**. Verificado de punta a punta el 2026-08-11 con un
negocio real de Miami Beach: 4 preguntas, 3 citas detectadas, competidores y fuentes reales.

## 1. Volver a desplegar el backend (si lo cambias)

Solo hace falta si editas `worker/worker.js`.

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

Ya está hecho — `index.html` tiene:

```js
const BACKEND = localStorage.getItem('citeme_backend') || "https://citeme-api.citemeai.workers.dev";
```

> Para apuntar a otro backend sin tocar el código: abre la consola del navegador y ejecuta
> `localStorage.setItem('citeme_backend','https://…workers.dev')`, recarga y listo.

## 2. Poner la clave de Gemini (ya hecho — aquí por si hay que rehacerlo)

1. Consigue la clave en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key**.
2. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **citeme-api** →
   **Settings** → **Variables and Secrets** → **Add**:
   - Type: **Secret** · Name: `GEMINI_KEY` · Value: la clave · **Deploy**.
3. Comprueba que [`/health`](https://citeme-api.citemeai.workers.dev/health) sigue OK y prueba
   la web: ya no debe pedir clave a nadie.

Por línea de comandos sería `cd worker && npx wrangler secret put GEMINI_KEY`.

## 3. Control del gasto

**La búsqueda web de Gemini ya no entra en el plan gratuito** (comprobado modelo por modelo en
agosto de 2026: todos devuelven `429 quota exhausted`, y algunos 2.5 ni existen ya para cuentas
nuevas). Hace falta activar la facturación en Google; a cambio entran **5.000 búsquedas gratis
al mes**, y solo se paga a partir de ahí ($14 por cada 1.000).

Para que la factura no pueda dispararse, el Worker lleva **dos topes** (KV `CUOTA`, ya creado)
que solo cuentan las consultas con búsqueda, que son las únicas que cuestan:

| Tope | Valor | Equivale a |
|---|---|---|
| `TOPE_GLOBAL_DIA` | 150 búsquedas/día | 4.500/mes → **por debajo de las 5.000 gratis** |
| `LIMITE_DIA` (por IP) | 20 búsquedas/día | 5 análisis gratis por visitante |

Consulta el gasto en cualquier momento en
[`/consumo`](https://citeme-api.citemeai.workers.dev/consumo). Para cambiar los topes: panel del
Worker → Settings → Variables. Los análisis de 10 y 15 preguntas están bloqueados en la web
pública (son los de pago).

### Endpoints de diagnóstico

- `/health` — estado y si la clave está puesta.
- `/modelos` — catálogo real de la cuenta, ordenado como los elige el Worker.
- `/consumo` — búsquedas gastadas hoy y topes vigentes.

## 4. Poner tu contacto

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
