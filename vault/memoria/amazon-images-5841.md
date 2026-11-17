# Corrección de imágenes de Amazon — 17/11/2026

El usuario ordenó corregir y desplegar el fallo mostrado en JOYROOM y CREATIVE.
La causa se reprodujo desde Vercel (escritorio Amazon 503), y la solución usa
metadatos de la ficha móvil pública sin cambiar enlaces guardados ni la seguridad.
Los errores ya no se cachean; `v=2` evita los 404 antiguos del navegador.

Fuente canónica: [estado, validación y recursos](../../docs/product-images.md#regresión-de-amazon-en-vercel--cas-5841-17112026).
15 unitarias, 4 DB, 15 E2E, types, lint y build aprobados. Ambas fotos comprobadas
con la función real desde Vercel y en la carta local, móvil y escritorio.
No se modificaron datos familiares, Auth ni SMTP de producción.

PR #2 fusionada a main, producto b04a9cd, merge970b6bb y Vercel
`dpl_3WZEVKUjsWsQTb13JtysaaTRKxT2` READY en christmas-planner.vercel.app.
Producción pública verificada, imágenes reales comprobadas desde Vercel y stack
local. Limpieza5841 terminada (540MiB), tres previews y credencial temporal
retiradas; se conservan datos sintéticos, configuración y evidencias. La tarjeta
5841 permanece en revisión humana, sin trabajo ejecutable pendiente del agente.
