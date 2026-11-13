# PPS · Sitio web

Sitio estático (HTML, CSS y JS sin compilación) de Proyectos Productos Soluciones S.A.C.

## Verlo en local

```bash
python3 -m http.server 4173
```

## Qué se edita y dónde

- `assets/js/config.js`: correo de ventas, WhatsApp, horarios de reunión, webhook de leads y URL del backend de IA.
- `assets/js/data.js`: clientes, etapas del proceso y tabla de proyectos.
- `assets/js/chat.js`: preguntas frecuentes del asistente (bloque `KB`).
- `index.html`: textos de cada sección.

## Asistente

Sin configuración, el chat responde con su base de preguntas frecuentes y agenda paso a paso.
Para respuestas con IA, despliega la carpeta `backend` (función serverless) en un hosting como Vercel,
define ahí la variable `ANTHROPIC_API_KEY` y pega la URL de la función en `chatEndpoint`.
La llave nunca va en este repositorio.
