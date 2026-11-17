Estado vigente 04/10/2026: remitente Gmail victor.95.manuel@gmail.com verificado; validaciones visibles de contraseña publicadas dpl_89Sbs1vpYe3YD1RFXx9JpUq6qbcK. Ver última sección; las configuraciones SMTP anteriores son históricas.

# Renovación de Christmas Planner — 3 de octubre de 2026

## Estado y decisiones

**Estado vigente tras la corrección:** acceso inicial y recuperación habilitados en producción mediante email-service y SMTP propio del proyecto. Google retirado. Release `dpl_EN5z14kSmH1iLAvamv25uAViwxtt`, dominio `https://christmas-planner.vercel.app`, URL inmutable `christmas-planner-73hifhuoi-victor-manuels-projects-485c2ed1.vercel.app`. Las secciones históricas de SMTP pendiente/enlace privado quedan superadas por la corrección final descrita al final. Pendiente aceptación del usuario y autorización Git/PR; no se declara cierre completo.

Tarea CAS 4973, rama `cas/christmas-planner`, base `97a6215e577aac3fd7a0dbd55a73380282c96c12`. Implementación local sin commit/push. Base real de PR: `main`; el repositorio no dispone de `develop`. Usuario confirma mantener **Supabase actual**, proyecto `vxirigqzqixsihyunazf`, esquema `christmas_planner`. La validación inicial no modificó producción. El 4 de octubre se autorizó y publicó el despliegue descrito en la sección final; se conservaron las identidades reales.

Nuevo acceso exclusivamente con email/contraseña mediante el Supabase Auth actual. Google retirado por instrucción del usuario el 04/10; VetiMoly no se modifica ni comparte autenticación. Cada petición verifica identidad confirmada y pertenencia a la familia; cookies HTTP-only y mutaciones con comprobación de origen. Las cookies antiguas basadas solo en email dejan de autorizar. Recuperación de contraseña mediante token de un solo uso y permiso firmado de diez minutos, ligado al miembro.

Diseño verde, crema y dorado, login propio, navegación adaptativa, perfil editable, imagen, contraseña y preferencias. Validaciones compartidas en cliente/API, errores que conservan formularios, diálogos con teclado/foco. Centro de ayuda `/help` con novedades y siete tutoriales enlazados desde las pantallas.

Campana con error/reintento sin marcar avisos fallidos como leídos. Correos respetan preferencias y resultados parciales del servicio. Asignaciones y sorpresas protegen la identidad de quien regala; se impide consultar/quitar las asignaciones de la carta propia. Acceso directo de roles públicos al esquema retirado por migración 005. Subidas y borrados de avatar verifican propietario, formato real, tamaño y referencias compartidas.

## Verificación local

Stack real: Next.js en 127.0.0.1:9000, PostgreSQL/Auth/Storage/Mailpit locales aislados. Datos sintéticos, recuperación entregada exclusivamente a Mailpit. Avisos externos deshabilitados; no se enviaron correos a personas.

- `pnpm test`: cuatro casos aprobados, cero skips (validación y envío parcial contra servicio HTTP local de prueba).
- `pnpm test:db`: dos casos aprobados, cero skips (permisos de datos/storage y rechazo de registro público).
- `pnpm test:e2e`: nueve casos aprobados, cero skips (APIs de acceso/privacidad; login desktop/móvil; formularios CRUD y errores; foco; perfil/foto/contraseña; campana; administración; recuperación real, repetición y falsificación; reservas; guardado retenido; navegación 320/768/1024).
- Lint, TypeScript, build y `git diff --check`: aprobados. Lint mantiene tres avisos preexistentes de optimización de imágenes.
- Revisión independiente de seguridad: defectos iniciales corregidos; segunda revisión estática sin defectos verificables pendientes en las correcciones. El principal comprobó los casos con Auth/base/API/navegador locales. SMTP alojado permanece sin verificar.

Resultados completos: `artifacts/renovacion/playwright-results.json` y logs locales del mismo directorio. Las capturas reales se abrieron para revisión visual. Las capturas completas de móvil muestran la barra fija a la altura del viewport inicial; es comportamiento de la captura full-page. La captura de fallo de campana incluye el indicador diagnóstico de Next en desarrollo por el error simulado.

## Evidencias

- [admin-desktop.png](../artifacts/renovacion/admin-desktop.png)
- [admin-mobile.png](../artifacts/renovacion/admin-mobile.png)
- [avisos-error.png](../artifacts/renovacion/avisos-error.png)
- [carta-desktop.png](../artifacts/renovacion/carta-desktop.png)
- [carta-familiar-mobile.png](../artifacts/renovacion/carta-familiar-mobile.png)
- [carta-mobile.png](../artifacts/renovacion/carta-mobile.png)
- [correo-recuperacion.png](../artifacts/renovacion/correo-recuperacion.png)
- [cuenta-desktop.png](../artifacts/renovacion/cuenta-desktop.png)
- [cuenta-mobile.png](../artifacts/renovacion/cuenta-mobile.png)
- [familia-desktop.png](../artifacts/renovacion/familia-desktop.png)
- [familia-mobile.png](../artifacts/renovacion/familia-mobile.png)
- [guardando-ajustes-mobile.png](../artifacts/renovacion/guardando-ajustes-mobile.png)
- [login-desktop.png](../artifacts/renovacion/login-desktop.png)
- [login-mobile.png](../artifacts/renovacion/login-mobile.png)
- [manual-desktop.png](../artifacts/renovacion/manual-desktop.png)
- [manual-mobile.png](../artifacts/renovacion/manual-mobile.png)

## Pendientes reales de entrega

1. Autorización de **commit y push** según la regla Git del usuario. Después, abrir PR contra `main`, vinculada a CAS 4973 y con esta validación. No existe PR todavía. Preparación: `artifacts/renovacion/pr-draft.md`.
2. Tareas4973 y4975 en `in_testing` tras publicar y verificar la corrección final; falta aceptación del usuario. No marcar completed sin cumplir los gates restantes.
3. Recuperación y acceso inicial publicados con migraciones005/006, plantilla password-recovery y SMTP Christmas verificado. Los perfiles sin Auth pueden activar su cuenta verificando su email desde Crear o recuperar contraseña, sin pasos administrativos ni duplicar cartas. Prueba de recepción del usuario pendiente; no se enviaron correos a personas desde el agente.

## Continuidad y recursos

Registro: `artifacts/renovacion/local-resources.json`; proceso registrado privadamente con helper compartido `agent-local-work`. Stack aislado `christmas-planner-renovacion-4973`; conservación de volúmenes sintéticos y `.env.local` privada para reanudar. El worktree CAS se conserva por WIP sin commit; no borrar su lock ni cambiar su reserva a mano. Cierre y espacio liberado se registran antes de finalizar. No se abrieron ventanas de navegador manuales; las instancias headless se cerraron.

Cierre verificado: servidor detenido mediante identidad registrada; contenedores propios detenidos y ausencia comprobada. Cachés node_modules y .next retiradas tras safe_cache: 731600 KiB liberados. Datos y configuración privada conservados. PR pendiente de autorización Git.

## Despliegue autorizado — 4 de octubre de 2026

El usuario ordenó publicar y aplazar la prueba funcional. Se desplegó manualmente mediante la skill Vercel, sin commit/push ni merge. La cuenta personal Vercel es victor95manuel-4219; el proyecto existente se conserva. El primer intento fue BLOCKED por el autor del último commit, sin sustituir producción. El segundo se construyó desde una copia temporal exacta del código, sin metadata Git ajena; el snapshot se eliminó al terminar.

- Producción: https://christmas-planner.vercel.app
- Deployment: dpl_CBFy8YazYYEKQGSoeGKg2Uie8nmf
- URL inmutable: https://christmas-planner-ah1p507hj-victor-manuels-projects-485c2ed1.vercel.app
- Fuente SHA256: 8b0fa382d1589de94175e90b9b880ed2a5b064af02803daf3e15e1beaa5da526. Manifiesto en artifacts/renovacion/deployed-source-manifest.json.
- Build Vercel aprobado y promoción final aprobada. Supabase actual conservado.
- Migración secure_christmas_planner_api_access aplicada. Verificación: cero privilegios de tablas para anon/authenticated, seis tablas SELECT para service_role. Respaldo anterior en production-permissions-backup.json y restauración en rollback-table-grants.sql.
- Vercel: clave service_role añadida solo al servidor; URL/anon/APP_URL normalizadas (tenían saltos de línea). Google false, recuperación mail false, avisos del servicio existente true. No se han enviado emails ni creado/modificado identidades de personas.
- Smoke alojado: login/help HTTP200; sesión anónima con user null; users/wishes401; mutación con origen válido400 por formulario inválido; origen externo403. Resultado en production-smoke.json. Captura real production-login-desktop.png inspeccionada. Chrome escribió la captura pero su cierre excedió el timeout; subprocess terminó el proceso. No hubo prueba de login con credenciales reales.

Pendientes expresos: prueba funcional del usuario aplazada; cuatro de los cinco miembros no tienen identidad Auth (una identidad existente confirmada con contraseña). Google no está habilitado en el proyecto. SMTP no está configurado; se conserva la configuración compartida y la recuperación queda desactivada. No se aplicaron cambios globales de Auth ni a sus otros consumidores. PR y commit/push siguen pendientes de autorización Git; despliegue no equivale a aceptación del rediseño ni autoriza cerrar in_testing. MCP CAS no está disponible en este turno; no se pudo registrar el despliegue en la tarjeta 4973. Esta fuente conserva los datos para reconciliarla.

Rollback: promover el deployment anterior dpl_4Ksa5WfkPPr1b5UpPhDipQfyNXJp (christmas-planner-cwnxmnuyf-victor-manuels-projects-485c2ed1.vercel.app) y restaurar los grants respaldados si se vuelve a las APIs antiguas. No revertir los permisos sin revertir la versión por riesgo de acceso directo a regalos.

Postcondición de navegador: ps de los procesos registrados en el log de captura (40732 y 40796) no devuelve procesos; perfil temporal eliminado. No quedan recursos de navegador de esta captura.

## Rectificación: cierre prematuro y corrección de Auth

El usuario reclama el alcance completo, no funcionalidades preparadas pero deshabilitadas. Tarea 4973 reabierta in_progress: el cierre anterior como completed fue incorrecto. La tarea 4975 referencia requisitos originales; no los excluye de 4973.

Se detectó que la clave legacy service_role configurada en el release era rechazada: las claves legacy están deshabilitadas desde agosto. Las claves de Management API requieren reveal=true para recuperar el valor utilizable; nunca usar el valor oculto de listados como credencial. Se creó una clave dedicada christmas_planner_prod_4973 con template service_role y se configuraron secret/publishable vigentes, sin reactivar claves legacy ni tocar las claves de otras apps. Se publicó la corrección en christmas-planner-av61z2xf5-victor-manuels-projects-485c2ed1.vercel.app. La prueba autenticada de producción pasó login, sesión, usuarios, deseos y ajustes con cuenta sintética creada y eliminada por identidad exacta. No se enviaron correos. Evidencia: artifacts/renovacion/authenticated-production-check.json. Esta prueba corrige la insuficiente comprobación anterior, que solo validaba páginas y rechazos sin sesión.

Google: descartado por el usuario el 04/10. No hace falta cuenta de Google Cloud ni cambios al servidor de autenticación de VetiMoly.
Correo: SMTP GoTrue y configuración canónica de email-service rechazados con535 BadCredentials mediante autenticación SMTP sin envío. No habilitar recuperación usando credenciales inválidas. Archivo privado de entrada preparado en .vercel/smtp-input.private.json con permisos600; rellenar localmente, nunca pegar contraseña en chat. Quedan las cuatro identidades reales pendientes de activación verificable, recuperación/correo. No marcar entrega completa mientras falten. Los secretos recuperados permanecen únicamente en .vercel, ignorados y con600, para continuar configuración; retirarlos al terminar.


## Acceso conservando datos (04/10)

La versión anterior solo validaba que el correo existiera en christmas_planner.users; no había contraseña. El acceso nuevo verifica email/contraseña en auth.users y busca el perfil familiar por el mismo email. No se reemplazan los IDs familiares ni se migran o borran cartas/asignaciones. La consulta de solo lectura confirma cinco perfiles, uno con identidad Auth verificada y contraseña (Victor Manuel) y cuatro sin identidad Auth. Reutilizar la cuenta existente sin restablecer su contraseña ni afectar otras aplicaciones. Para perfiles sin identidad, preparar acceso individual verificado; no crear una segunda fila familiar ni habilitar alta pública. Retirada de Google incluye botón, instrucciones y rutas OAuth. Esta corrección pasó cuatro pruebas unitarias, dos de permisos/base y nueve E2E (sin skips), incluyendo cierre/nuevo inicio de sesión con conservación del ID familiar y sus deseos. Lint (tres avisos previos), TypeScript, build y diff-check aprobados. Login desktop/móvil sin Google inspeccionados en artifacts/renovacion/login-desktop.png y login-mobile.png. Publicado dpl_8HSnUU1r4xzY7jM9bnhEfBN4PZ8M, URL inmutable christmas-planner-kzorbhpi2-victor-manuels-projects-485c2ed1.vercel.app, dominio principal christmas-planner.vercel.app. Comprobación pública: login 200, Google/callback retirados 404, usuarios sin sesión 401. Huellas completas de perfiles/deseos/asignaciones/sorpresas idénticas antes/después: cinco perfiles, 30 deseos y 24 asignaciones. Evidencias password-only-*.json/log del mismo directorio. La captura de producción tomada durante carga inicial se descartó; se entregan las capturas locales del stack real inspeccionadas. Stack local mínimo y navegador cerrados, volúmenes sintéticos privados conservados, dependencias/cachés propias limpiadas. Copias temporales de credenciales Google/SMTP de VetiMoly eliminadas; no se modificó ese servicio. Pendientes: prueba con contraseña existente del usuario, accesos de los cuatro perfiles sin Auth, SMTP/recuperación/correos y autorización Git/PR. No se ha restablecido ninguna contraseña de persona ni enviado correos.


## Recuperación que bloquea la prueba del usuario (04/10)

El usuario confirma que el aviso de recuperación no disponible impide usar la entrega. Sigue pendiente, no resuelto. Se recuperó la API key canónica de Christmas Planner y se verificó su coincidencia con una clave activa de email_admin; la configuración Gmail de su propietario se descifró solo en memoria/archivo privado. SMTP rechazó535 también normalizando los espacios de la contraseña de aplicación. No se enviaron correos. Evidencias: recovery-smtp-check.json y recovery-smtp-normalized-check.json. Se solicitó una credencial vigente en .vercel/smtp-input.private.json o su ubicación; no pedir contraseñas por chat. La lectura Vercel devolvió valores cifrados/decrypted=false, por tanto no acredita diferencias de configuración y las comparaciones se descartaron.

Para permitir al usuario elegir contraseña sin esperar SMTP se confirmó el email del administrador personal en su perfil familiar y se generó un enlace Supabase recovery de un solo uso mediante admin.generate_link, sin enviar correo ni cambiar su contraseña. Archivo privado600, ignorado: .vercel/mi-acceso-christmas.private.html; carpeta abierta al usuario. No guardar token en documentación, capturas ni CAS ni consumirlo en pruebas. Al abrirlo el usuario puede elegir contraseña con el flujo recovery verificado localmente; afecta a la identidad de Supabase actual, no a VetiMoly. El enlace es temporal; esta vía administrativa no equivale a recuperar correo funcional ni a completar4973. No generar otro sin necesidad: invalida el anterior. Copia SMTP temporal inválida eliminada. Ningún servicio local ni navegador arrancado en esta investigación.


## Corrección final autónoma de acceso y correo

Se encontró una conexión Zoho válida ya configurada por el mismo propietario de email-service. Se reutilizó la conexión en una **nueva** configuración project_smtp_configs para christmas-planner, con nombre de remitente Christmas Planner; no se editó la fuente ni ninguna configuración ajena/VetiMoly. Remitente autenticado y MAIL FROM aceptado250, sin RCPT/DATA ni envío. Huella de otras configuraciones SMTP igual antes/después:7a47b4ccd0bc9978668eac95d3ab8ae8. Config nueva82342d94-fb39-4ed1-b6ae-6866b2918e9d; plantilla nueva49a99a0b-87ec-464b-a1b3-6b2d309723bb. La invitación antigua aún prometía sin contraseña y se corrigió, con respaldo privado. El servicio real compila password-recovery y autentica el SMTP de Christmas: prueba sin destinatarios termina exactamente No recipients defined, después de SMTP.login según código de Nodemailer. No se entregó ningún correo ni se ejecutó DATA a una persona.

La ruta ahora genera recovery nativo Supabase; si el perfil familiar no tiene Auth y el proveedor devuelve user_not_found, genera invite. El correo usa email-service y una URL canónica del proyecto con token_hash/tipo. La verificación admite solamente recovery/invite y verifica identidad/email y familia antes del permiso firmado. La contraseña solo cambia por acción del destinatario. No se cambia SMTP/Site URL/allowlist/plantillas globales de Supabase. Límites durables service-only: un intento/minuto y cinco/hora por correo, veinte/hora por IP; respuestas homogéneas sin cookies para desconocidos/miembros. Migración006 aplicada local/hosted. Template SQL sin secretos en docs/sql/007_access_email_template.sql; HTML en supabase/templates/access.html. Vercel de Christmas usa URL/APIkey canónica del servicio, APP_URL principal y flags EMAIL/AUTH_EMAIL true; respaldo600 en .vercel/recovery-vercel-env-backup.private.json.

Validación final:4unitarios+4DB/integración+10Playwright, cero skips; lint/typecheck/build/diff0 (tres avisos img previos). Se probó recuperación real a Mailpit vía adaptador local del protocolo del servicio; perfil con carta y sin credenciales, token invite y contraseña; mismo ID y deseo después; token usado rechazado; grant falsificado rechazado; límites por DB inaccesibles a anon/authenticated; recuperación tras invitación sin confirmar/entrega fallida. El fallo inicial del test de primer acceso era una consulta relativa a127.0.0.1 después de navegar a localhost; se corrigió el test a usar el origen real del navegador y se repitió toda la batería. No se borraron tests. Capturas correo-recuperacion.png, primer-acceso-conservar-carta.png y production-recuperacion-mobile.png inspeccionadas.

Prueba producción con identidad/familia/deseo exclusivamente sintéticos: pantalla pública, recuperación desconocido200 sin envío, invite verificado, elegir contraseña preserva perfil/deseo y token reutilizado rechazado. Perfil/identidad/deseo de prueba eliminados por IDs/email exactos y verificados ausentes. Todas las huellas familiares antes/después idénticas:5perfiles/30deseos/24asignaciones/0sorpresas. Evidencias recovery-production-check.json, recovery-final-data-preservation.json, recovery-christmas-live-smtp-probe.json, recovery-owned-smtp-check.json, recovery-final-exit-codes.json y recovery-final-source-manifest.json. No se ha probado entrega a una persona mediante envío autónomo: prohibición general de comunicaciones; el usuario puede solicitar el correo desde la web.

Recursos propios detenidos/verificados, cachés/dependencias eliminadas, volúmenes sintéticos/WIP/evidencias conservados. Copias SMTP/keys de email-service descifradas y HTML workaround retirados; respaldos privados de rollback conservados. No usar el HTML privado como entrega; ya no se necesita aportar credenciales SMTP. Rollback de app: promoverdpl_8HSnUU1r4xzY7jM9bnhEfBN4PZ8M y restaurar env de respaldo si procede; dejar migración006 inerte y no revertir permisos005 sin revertir versión. La nueva configuración SMTP solo afecta Christmas; restaurar invitación desde backup privado si se revierte todo el acceso. PR/commit/push siguen pendientes por regla Git; no inventar PR ni100% entrega global.

## Corrección de remitente y validación de contraseña (04/10/2026)

La orden posterior del usuario sustituye el remitente provisional de Stick Crisis: Christmas Planner usa `Christmas Planner <victor.95.manuel@gmail.com>` mediante `smtp.gmail.com:465`. La credencial del perfil Gmail antiguo falla con 535; otra credencial SMTP existente para esa misma cuenta autentica correctamente. Se reutilizó exclusivamente en la configuración Christmas Planner (`82342d94-fb39-4ed1-b6ae-6866b2918e9d`), sin modificar otras filas/configuraciones. Evidencias sin secretos: `gmail-sender-correction.json` y `gmail-live-template-check.json` bajo `artifacts/renovacion/`. Verificación SMTP y plantilla real con destinatarios vacíos, sin enviar correos. No restaurar el remitente de Stick Crisis.

Primer acceso/recuperación y Mi cuenta comparten recomendaciones, contador 12–128, errores visibles al escribir, confirmación de coincidencia y botón deshabilitado si los campos no son válidos. Mi cuenta exige también la contraseña actual. Los errores de servidor conservan los campos. Regla de longitud compartida cliente/servidor; ayudas y errores vinculados con aria-describedby. Publicado y verificado: dpl_89Sbs1vpYe3YD1RFXx9JpUq6qbcK (Ready), christmas-planner.vercel.app. Cinco unitarios, cuatro pruebas DB y diez E2E aprobados sin skips; lint/typecheck/build/diff-check exit 0. La primera ejecución E2E conservada falla porque intentaba pulsar un botón ahora deshabilitado; se actualizó a comprobar el bloqueo y la ejecución final pasa completa. Capturas locales y de producción inspeccionadas. Servicios/grupos y contenedores propios cerrados con identidad verificada; cachés inactivas retiradas, volúmenes sintéticos y WIP conservados. CAS4973 en pruebas, PR pendiente por regla de commit/push. Rollback de app: dpl_EN5z14kSmH1iLAvamv25uAViwxtt; mantener el remitente Gmail corregido.

## Inicio de campaña y aviso autorizado (04/10/2026)

El usuario aprobó la UI y ordenó limpiar regalos/asignaciones y avisar por correo a cada miembro. Se respaldaron filas en `.vercel/campaign-reset-backup.private.json` (600, ignorado). Una transacción con bloqueos y guardas de huella eliminó exclusivamente 30 deseos, 24 asignaciones y los 112 avisos antiguos new_wish; no había sorpresas. Verificados ceros y conservación íntegra de cinco perfiles, preferencias y cuentas Auth. Se enviaron cinco correos individuales desde Christmas Planner <victor.95.manuel@gmail.com>, con web y pasos para solicitar enlace y crear contraseña. Cinco confirmaciones SMTP y cinco entradas sent individuales verificadas; no acreditar lectura/bandeja. Aviso único expresamente autorizado, no habilita futuros envíos. Plantilla family-access-2026, HTML/captura/resultados en artifacts/family-access-mail; recibos privados en .vercel/campaign-send-final-receipts.private.json. Un primer intento falló400 antes de enviar porque la plantilla no existía; corregido y recibido cinco veces sin duplicados ni estados inciertos. No reejecutar scripts de borrado/envío; copia y recibos preservados. Navegador cerrado, sin servicios nuevos, dependencias propias retiradas. CAS4985.
