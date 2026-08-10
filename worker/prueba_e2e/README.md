# Prueba de punta a punta

Sirve la app real en `localhost:8080` (uno de los orígenes autorizados en el Worker) y le
inyecta un arranque automático: rellena el formulario y pulsa el botón solo. Sirve para
comprobar el circuito completo web → Worker → Gemini → informe sin tocar nada a mano.

```bash
node server.js "Joe's Stone Crab" "Miami Beach, FL" "seafood restaurant"
```

Y en otra ventana, para verlo sin abrir el navegador a mano:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --headless=new --disable-gpu --no-sandbox --virtual-time-budget=240000 `
  --user-data-dir=$env:TEMP\e2e --dump-dom http://localhost:8080/ > salida.html
```

En `salida.html` busca `id="pLog"` (el registro de cada consulta) y `class="val"` (la
puntuación). Un negocio muy conocido debe dar puntuación **alta**: si diera 0, el fallo estaría
en la detección de nombres, no en el backend.

## Por qué así y no con curl

- PowerShell 5.1 no negocia TLS con Cloudflare (`No se puede crear un canal seguro SSL/TLS`).
- El sandbox del plugin MCP de Cloudflare solo deja llamar a la API de Cloudflare.
- Desde `file://` el origen es `null` y el Worker lo rechaza, que es justo lo que debe hacer.

El navegador desde `localhost:8080` es el único camino que reproduce lo que hace un visitante.
