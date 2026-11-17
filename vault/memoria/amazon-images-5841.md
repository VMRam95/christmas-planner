# Corrección de imágenes de Amazon — 17/11/2026

El usuario ordenó corregir y desplegar el fallo mostrado en JOYROOM y CREATIVE.
La causa se reprodujo desde Vercel (escritorio Amazon 503), y la solución usa
metadatos de la ficha móvil pública sin cambiar enlaces guardados ni la seguridad.
Los errores ya no se cachean; `v=2` evita los 404 antiguos del navegador.

Fuente canónica: [estado, validación y recursos](../../docs/product-images.md#regresión-de-amazon-en-vercel--cas-5841-17112026).
15 unitarias, 4 DB, 15 E2E, types, lint y build aprobados. Ambas fotos comprobadas
con la función real desde Vercel y en la carta local, móvil y escritorio.
No se modificaron datos familiares, Auth ni SMTP de producción.
