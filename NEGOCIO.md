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

## Números

- Coste por auditoría: **~0,30 $** (Gemini regala 5.000 consultas con búsqueda al mes ≈ 250
  auditorías; Cloudflare Workers gratis hasta 100.000 peticiones/día).
- Informe $99 → margen 99 %. Suscripción $49/mes → coste ~0,60 $/mes por cliente.
- **Objetivo 90 días: 25 suscriptores = $1.225/mes** con ~15 $ de coste.

## Escalera

1. **Gratis** — 4 preguntas. Capta y asusta.
2. **$99** — informe completo de 15 preguntas, competidores, fuentes y plan.
3. **$49/mes** — vigilancia: aviso cuando entras, cuando caes y quién te adelanta.
4. **$299/mes marca blanca** — agencias y consultores locales revendiendo a sus clientes.

## Estado

- [x] App bilingüe (EN/ES) funcionando, un solo archivo.
- [x] Backend en Cloudflare Workers con la clave escondida, CORS cerrado y tope por IP.
- [x] Informe imprimible a PDF — es el entregable de pago.
- [x] Publicada en GitHub Pages.
- [x] Worker desplegado en https://citeme-api.citemeai.workers.dev y conectado a la web.
- [ ] Pegar el secreto `GEMINI_KEY` en el panel del Worker (paso 2 del README).
- [ ] Poner WhatsApp/correo en la constante `CONTACTO`.
- [ ] Cobro: enlace de pago de Stripe pegado en los botones de plan.

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
