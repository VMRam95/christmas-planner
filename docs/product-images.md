# Imágenes de productos — CAS 5830

Encargo: refrescar el baúl y mostrar la imagen del producto a partir del enlace en
Mis deseos. El 17/11/2026 el usuario ordenó incluir también la renovación publicada
que seguía sin commit. El usuario aprobó el cierre y ordenó push, merge, despliegue, actualización del baúl
y limpieza local el 17/11/2026.

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

Versión de producto validada: `b07cf1d`. Resultado final: **13 unitarios, 4 DB,
14 E2E, cero skips**, types, lint y build con exit 0. Lint mantiene tres avisos
previos. La batería E2E completa tarda 53,7 segundos. Capturas de escritorio, móvil,
carta familiar, carga retenida y fallo abiertas e inspeccionadas. Informe completo:
`artifacts/product-images-5830/validation-summary.json`; logs y JSON de las
ejecuciones fallidas también se conservan.

Se corrigió un defecto real de la renovación: la recuperación cambiaba de origen
por usar el hostname interno de Next y perdía las cookies. `69ad22f` usa
redirecciones relativas y prueba que se conserva el origen. También elimina una
carrera de la prueba que cerraba avisos con índices después de su caducidad.
Los dos primeros resultados E2E (12/14 y 13/14) quedan registrados, sin ocultarlos.

PR [#1](https://github.com/VMRam95/christmas-planner/pull/1) fusionada a main
en `4cb083805cabde660e07c7be20631af98a5a18e7` y publicada en producción. Una comprobación adicional del enlace corto de
Amazon del deseo real detectó HTML mayor de 2 MiB. La revisión `b07cf1d` analiza
solo el prefijo acotado y cierra la descarga, conservando el límite y el rechazo de
imágenes grandes. La extracción del enlace real devuelve un JPEG de 53.717 bytes.
La URL del deseo se consultó en una transacción de solo lectura; ningún dato remoto
se modificó. La batería completa se repitió con ese mismo enlace: 14/14 E2E, cero skips,
13 unitarios y 4 DB; types, lint y build exit 0. Las cinco capturas finales
muestran esa imagen real de Amazon y se han abierto e inspeccionado.

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

Medición local: redimensionado y comprobación de la tarjeta entre 29 y 70 ms;
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

La segunda generación, usada para la regresión con el enlace original de Amazon,
también se cerró verificando sus nuevos IDs y journals. El recibo final, el resumen
y las capturas corresponden a `b07cf1d`; no quedan pruebas de producto pendientes
del agente. Revisión del usuario, merge y despliegue aprobados y ejecutados; ver el cierre siguiente.


## Cierre autorizado y publicación — 17/11/2026

La PR #1 se fusionó con merge commit a `main`, base real del proyecto; no existe
`develop`. Se verificó que el árbol de producto del merge es idéntico a `b07cf1d`,
cuya batería completa y capturas figuran en este documento. Todos los cambios de
producto están publicados en GitHub. Después de sincronizar el checkout principal
se releyeron AGENTS.md y CLAUDE.md; el ajuste local de exclusión de CAS se conservó
sin incorporarlo a los commits y se retiró el stash temporal de un solo fichero.

Vercel publicó automáticamente el merge como
`dpl_HXamTfdMTwGK1YdTeMpoEmYsy7Am`, estado **READY**, con el alias
https://christmas-planner.vercel.app. Fuente Git y autor personal contrastados con
la API de Vercel. URL de esta publicación:
https://christmas-planner-qo7q27ipi-victor-manuels-projects-485c2ed1.vercel.app.
Rollback previo conservado: `dpl_89Sbs1vpYe3YD1RFXx9JpUq6qbcK`.
La documentación de cierre puede generar otra publicación con el mismo producto;
el recibo vivo final queda en `artifacts/product-images-5830/production-current.json`.

Verificación real en producción, sin modificar datos familiares, Auth o SMTP:
login y ayuda 200; novedades de imágenes visibles; sesión anónima sin usuario;
usuarios/deseos/imagen sin sesión 401; mutación de origen externo 403; tipo de
recuperación no admitido 307 con Location relativa. Nueve comprobaciones aprobadas,
cero errores JavaScript y ausencia de desbordamiento a 1440 y 390 px. Las dos
capturas públicas se abrieron e inspeccionaron. El flujo privado autenticado de la
imagen se verificó en el stack local idéntico; no se crearon cuentas/datos de prueba
en producción ni se consumieron enlaces de recuperación de personas.

Evidencias publicadas: `production-baseline.json`, `production-release.json`,
`production-smoke.json`, `production-help-desktop.png` y `production-help-mobile.png`
en `artifacts/product-images-5830/`. El registro completo de recursos se conserva
también en el checkout principal. El navegador headless de producción se cerró en
finally; no se arrancó un stack local nuevo, node_modules y .next siguen ausentes,
y las generaciones de procesos/contenedores propias siguen liberadas. Se retienen
los worktrees CAS por sus locks de Desktop, los datos sintéticos y las evidencias;
no se han desbloqueado ni borrado rutas gestionadas por la app.

Baúl: perfil y memoria versionados; INDEX y espejos generados se conservan localmente
para poder actualizar el estado del Kanban sin generar publicaciones de producto
por cada captura del estado. El cierre se reconcilia con la tarjeta 5830 y se ejecuta
`baul.py update` desde el checkout principal.

## Regresión de Amazon en Vercel — CAS 5841, 17/11/2026

La prueba local anterior no acreditaba la respuesta de Amazon desde el servidor
alojado. Se reprodujo el fallo con los dos productos comunicados: JOYROOM
B0G3N54XSC y CREATIVE B0DXW25R3D. Desde Vercel, Node 24 en iad1, la ficha de
escritorio devuelve 503 aunque el CDN de imágenes responde 200. La ficha móvil
pública `/gp/aw/d/ASIN` devuelve metadatos e imagen válidos para ambos.

El extractor normaliza solo las fichas de dominios Amazon reconocidos, tanto
URLs directas como destinos de enlaces cortos. Conserva el enlace original del
deseo, el User-Agent honesto y las comprobaciones de DNS, conexión fijada,
redirecciones, formato, tamaño y plazo total. No incorpora fotos prefijadas por
producto. Los errores del endpoint llevan `no-store`; las imágenes correctas
mantienen caché privada. El componente usa `v=2` para evitar los 404 anteriores
que el navegador podía conservar durante una hora. Ayuda y novedades actualizadas.

La misma función de producto se ejecutó en una preview temporal del proyecto
Vercel, con únicamente dos enlaces públicos fijos y sin leer cartas ni modificar
Auth, datos o SMTP alojados. Resultado: JOYROOM JPEG de 143.907 bytes en 1.284 ms;
CREATIVE JPEG de 53.717 bytes en 1.182 ms. Evidencias de antes/después en
`artifacts/amazon-images-5841/cloud-{baseline,fixed}-{joyroom,creative}.json`.
Las fotos se abrieron e inspeccionaron.

Validación: 15 unitarias, 4 DB, 15 E2E, cero skips; types, lint y build con exit 0.
Tres avisos previos de lint. Stack sintético aislado `christmas-planner-amazon-5841`.
La E2E nueva carga ambos productos en la carta real, comprueba `naturalWidth`
y la versión de caché, y captura 1440 y 390 px. La regresión conserva CRUD,
cartas familiares, sorpresas, privacidad, carga y fallo, teclado y tacto emulado,
y anchos 320/390/768/1024/1440. Capturas nuevas inspeccionadas:
[escritorio](../artifacts/amazon-images-5841/amazon-wishes-1440.png) y
[móvil](../artifacts/amazon-images-5841/amazon-wishes-390.png). Redimensionado y
comprobación local: 31–74 ms; no representa INP de campo. Sin dispositivo físico
ni certificación de lector de pantalla. Resumen y hashes del código probado:
`artifacts/amazon-images-5841/validation-summary.json`.

Registro privado de recursos: `artifacts/amazon-images-5841/local-resources.json`.
La preview de diagnóstico es temporal y nunca se promueve a producción. La CLI de
Vercel creó una credencial de acceso a previews al usar `curl`; su identidad se
registró de forma privada para revocar solo esa credencial durante el cierre.
PR, publicación, comprobación final y recibo de limpieza se añaden al cerrar.
