# CiteMe — visibilidad de negocios locales en la IA (Florida / EE.UU.)

**Qué vendo:** le digo a un negocio local si ChatGPT/Gemini/Perplexity lo recomiendan cuando un
cliente busca su servicio en su ciudad, le enseño a quién recomiendan en su lugar y le doy el
plan para entrar. Autoservicio, **en inglés y español**, a precio de negocio pequeño.

## Por qué ahora (datos, agosto 2026)

| Dato | Cifra | Fuente |
|---|---|---|
| Negocios locales recomendados por ChatGPT | **1,2 %** (vs 35,9 % en el 3-pack de Google) | SOCi Local Visibility Index 2026 — 350.000 ubicaciones de EE.UU. |
| Uso de IA para descubrir negocios locales | **6 % → 45 %** en un año | SOCi / Similarweb |
| Conversión del tráfico que manda ChatGPT | **15,9 %** vs 1,76 % de Google orgánico | Similarweb 2026 |
| Ingreso por visita de IA en campaña navideña | **+32 %** frente al resto | Adobe |

El 98,8 % de los negocios es invisible para la IA **y no lo sabe**. Ese desconocimiento es el producto.

## El hueco

| Competidor | Precio | A quién sirve |
|---|---|---|
| Profound | 499 $/mes | marcas grandes |
| Peec AI | 89 €/mes | e-commerce, en inglés |
| Agencias GEO | 1.500-5.000 $/mes | empresas medianas |
| **CiteMe** | **gratis → $99 → $49/mes** | **negocios locales de barrio** |

Todos venden un **panel que mide**. CiteMe enseña **la palanca**: al consultar con búsqueda
activa, la IA revela qué webs concretas lee para recomendar en ese sector y esa ciudad
(Yelp, Google, Healthgrades, Angi, BBB, Nextdoor…). Eso convierte el informe en algo accionable.

## La ventaja injusta en Florida

Miami-Dade, Broward y Orange tienen decenas de miles de negocios **de dueño hispano** cuya
presencia online está en español, dispersa y sin fichas estructuradas — justo lo que la IA no
sabe leer. Están **aún más invisibles** que la media. Yo hablo su idioma, la app está en los
dos, y ningún competidor de $500/mes va a bajar a atender a un taller de Hialeah.

Sectores que mejor pagan: dentistas, clínicas estéticas, abogados (accidentes, inmigración),
reformas y techos, HVAC, veterinarios, autoescuelas, talleres.

## Números (verificados en producción, agosto 2026)

La búsqueda web de Gemini **ya no está en el plan gratuito**. Con la facturación activada hay
**5.000 búsquedas gratis al mes** y después $14 por cada 1.000 ($0,014 cada una).

| Concepto | Búsquedas | Coste |
|---|---|---|
| Análisis gratuito (gancho) | 4 | $0,056 — o **$0** dentro de las 5.000 |
| Informe completo | 15 | $0,21 → se vende a **$99** |
| Vigilancia mensual | 15/mes | $0,21/mes → se vende a **$49/mes** |

Las 5.000 gratis dan para **~1.250 análisis al mes sin pagar nada**. El Worker corta a 150
búsquedas/día (4.500/mes) para no salirse de ahí, y a 20 por visitante. Cloudflare es gratis
hasta 100.000 peticiones/día.

- **Objetivo 90 días: 25 suscriptores = $1.225/mes** con ~$5 de coste.

## Escalera

1. **Gratis** — 4 preguntas. Capta y asusta.
2. **$99** — informe completo de 15 preguntas, competidores, fuentes y plan.
3. **$49/mes** — vigilancia: aviso cuando entras, cuando caes y quién te adelanta.
4. **$299/mes marca blanca** — agencias y consultores locales revendiendo a sus clientes.

## Estado (última sesión: 2026-08-08)

- [x] App bilingüe (EN/ES) funcionando, un solo archivo.
- [x] Publicada en GitHub Pages → https://hugoibel.github.io/citeme/
- [x] Backend desplegado → https://citeme-api.citemeai.workers.dev (`/health` responde `clave:true`).
- [x] Clave de Gemini guardada como *Secret* y verificada: las consultas **sin** búsqueda
      responden `200` con `gemini-flash-latest`.
- [x] Topes de gasto activos (KV `CUOTA`): 150 búsquedas/día globales, 20 por visitante.
- [x] Informe imprimible a PDF — es el entregable de pago.

### 👉 POR DÓNDE SEGUIR

1. **Activar la facturación de Google** (lo único que bloquea el producto).
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → fila de tu clave →
   columna **Plan** → **Set up Billing**. Sin esto, las consultas **con búsqueda** devuelven
   `429 quota exhausted` y el análisis no puede completarse: es el núcleo del producto.
   Comprobado que **ningún** modelo del catálogo permite búsqueda en el plan gratuito.
2. **Prueba de punta a punta** (pendiente, ~2 min). Sirve la app en `localhost:8080` con
   `scratchpad/prueba/server.js`, que rellena el formulario y pulsa el botón solo; se vuelca
   con Edge headless. Negocio de prueba recomendado: *Joe's Stone Crab · Miami Beach, FL ·
   seafood restaurant* (existe y es muy citado → debe dar puntuación ALTA, lo que valida
   también la detección positiva).
3. **Poner el contacto**: constante `CONTACTO` en `index.html` (WhatsApp con el 1 delante).
4. **Cobro**: enlaces de pago de Stripe en los botones de plan.
5. Luego ya: los primeros 20 informes gratis (abajo).

## Primeros 7 días

1. **Hoy** — desplegar el Worker (10 min) y poner el contacto.
2. **Día 1** — analizar 20 negocios de tu zona. Guardar cada informe en PDF. Coste: ~0 $.
3. **Día 2-3** — mandar el PDF **gratis** a esos 20: *"I checked whether AI recommends your
   business in [city]. Here's the result, no strings attached."* El informe vende solo porque
   le enseña al competidor que le está robando los clientes.
4. **Día 4-7** — a quien conteste, ofrecerle la vigilancia de $49/mes. Con 3 que entren, validado.

## Regla

No prometer posiciones. Se vende **medición y diagnóstico**, no un puesto garantizado en la
respuesta de la IA: eso no lo controla nadie.
