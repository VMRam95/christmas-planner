# Imágenes de productos — CAS 5830

Encargo: refrescar el baúl y mostrar la imagen del producto a partir del enlace en
Mis deseos. El 17/11/2026 el usuario ordenó incluir también la renovación publicada
que seguía sin commit. No hay autorización de merge o despliegue.

## Versión y fuentes

Renovación conservada en `9e08513`, desde el carril histórico
`.codeagentswarm/worktrees/christmas-planner`, con comparación SHA256 previa.
El original y sus datos privados permanecen intactos. Manifiesto de fuente:
`artifacts/product-images-5830/validation-baseline.json`. La rama de trabajo es
`cas/christmas-planner-2`, base de PR `main`.

Baúl común inicializado en el checkout principal. Refresco inicial completo:
repositorio y 36 tarjetas. Perfil versionado en `vault/sources.json`.

## Comportamiento

`GiftCard` incorpora una miniatura para los regalos con enlace, tanto propios
como familiares y sorpresas. No se cambia el esquema ni se guardan imágenes en
la base: los enlaces existentes funcionan sin editar el deseo ni migrar datos.
Cambiar el enlace reinicia la carga. Los regalos sin enlace mantienen su tarjeta
de texto. El enlace, la edición y las asignaciones conservan su comportamiento.

El endpoint autenticado `/api/product-image` lee Open Graph, Twitter Cards,
microdatos, Schema.org Product y la imagen principal de Amazon. Resuelve URLs
relativas y hasta tres redirecciones por recurso. Sirve la imagen desde el mismo
origen para evitar CORS, contenido mixto y revelar el visitante al servidor de la
tienda. No envía cookies, credenciales ni el referente a la tienda.

Solo HTTP/HTTPS en puertos estándar, sin credenciales. Rechaza direcciones
privadas/reservadas IPv4/IPv6 y comprueba todas las respuestas DNS antes de fijar
la IP de conexión; repite la comprobación para redirecciones e imágenes. Solo
admite JPEG, PNG, WebP, GIF y AVIF; excluye SVG y documentos arbitrarios. Plazo
total de ocho segundos, HTML hasta 2 MiB e imagen hasta 5 MiB; caché de navegador
privada de una hora. No ejecuta JavaScript ni elude restricciones de tiendas.

Mientras carga mantiene espacio reservado. Si no hay imagen, la tienda bloquea
el acceso, tarda demasiado o la imagen falla, aparece «Sin imagen» y el deseo
sigue operativo. No garantiza extracción en todas las tiendas.

## Validación y continuidad

La prueba inicial con la página oficial Creative Pebble Pro obtuvo un JPEG de
41.666 bytes en 3,2 segundos. Ocho pruebas de extracción/red pasaron sin skips,
y las cinco unitarias históricas también. Types y lint sobre la renovación
con imágenes pasan; lint conserva tres avisos previos de imágenes de avatar/admin.

Versión de producto validada: `4a2869b`. Resultado final: **13 unitarios, 4 DB,
14 E2E, cero skips**, types, lint y build con exit 0. Lint mantiene tres avisos
previos. La batería E2E completa tarda 42,9 segundos. Capturas de escritorio, móvil,
carta familiar, carga retenida y fallo abiertas e inspeccionadas. Informe completo:
`artifacts/product-images-5830/validation-summary.json`; logs y JSON de las
ejecuciones fallidas también se conservan.

Se corrigió un defecto real de la renovación: la recuperación cambiaba de origen
por usar el hostname interno de Next y perdía las cookies. `69ad22f` usa
redirecciones relativas y prueba que se conserva el origen. También elimina una
carrera de la prueba que cerraba avisos con índices después de su caducidad.
Los dos primeros resultados E2E (12/14 y 13/14) quedan registrados, sin ocultarlos.

Validación y limpieza verificadas. Falta registrar URL de PR; no se ha publicado producción.

| Criterio | Consumidor / condiciones | Estado |
| --- | --- | --- |
| Metadatos, URL relativa, enlace corto y producto real | Endpoint y tarjetas | Aprobado: unitarias y E2E real |
| DNS privado, redirección privada, formatos/tamaño y cancelación | Endpoint autenticado | Aprobado: unitarias y E2E autenticado |
| Deseo existente, creación, edición y recarga | Mi carta | Aprobado: E2E local |
| Imagen y acciones de asignación | Carta familiar y sorpresas | Aprobado: E2E local |
| Carga, fallo, sin enlace y contenido largo | Tarjetas compartidas | Aprobado: E2E local |
| 320/390/768/1024/1440 px, teclado, tacto y movimiento reducido | Navegador headless | Aprobado: E2E y capturas inspeccionadas |
| Batería histórica y build | Versión conjunta | Aprobado: 13 unitarias, 4 DB, 14 E2E, types, lint y build |

Recursos: `artifacts/product-images-5830/local-resources.json`. El stack de esta
tarea usa ID `christmas-planner-images-5830`; nunca parar ni reutilizar el stack
histórico por parecido. Puertos locales 9000, 56491/56492/56494/56496; configuración
privada del stack bajo `artifacts/product-images-5830/stack/`, ignorada por Git.
Conserva volúmenes sintéticos y cierra contenedores por IDs y generación verificados.

Medición local: redimensionado y comprobación de la tarjeta entre 30 y 56 ms;
no representa INP ni métricas de campo. La caja del producto mantiene posición y
tamaño antes/después del fallo. Emulación Chromium con tacto y teclado; sin móvil
físico, teclado virtual real, ni certificación de lector de pantalla/accesibilidad.

Capturas finales: [escritorio](../artifacts/product-images-5830/wishes-1440.png),
[móvil](../artifacts/product-images-5830/wishes-390.png),
[carta familiar](../artifacts/product-images-5830/family-390.png),
[carga retenida](../artifacts/product-images-5830/image-loading.png),
[sin imagen](../artifacts/product-images-5830/image-unavailable.png).

## Limpieza verificada

Next y adaptador de correo detenidos mediante sus journals de identidad y lease.
Los seis contenedores se comprobaron por ID, fecha y etiquetas antes de detener
el stack de esta tarea; sus IDs ya no existen. Se conservan volúmenes sintéticos,
configuración privada 600, código y evidencias. Navegadores de Playwright cerrados.

Cachés propias comprobadas sin referencias activas y retiradas: node_modules
628.172 KiB, .next 88.168 KiB y copia temporal de validación 466.388 KiB. Total
1.182.728 KiB, aproximadamente 1,13 GiB. Worktree CAS conservado sin tocar su lock.
El registro completo permanece en local-resources.json; no hay servicios ni
reservas de esta tarea pendientes de cierre.
