# Christmas Planner

Organizador privado de regalos familiares. La carta propia oculta todas las asignaciones; las cartas ajenas muestran disponibilidad, sin revelar quién regala salvo las asignaciones del propio usuario. Los regalos sorpresa se ocultan a su destinatario.

Next.js 16, React 19, TypeScript, Tailwind 4 y Supabase. El servicio alojado se mantiene: proyecto `vxirigqzqixsihyunazf`, esquema `christmas_planner`. Release publicado el 4 de octubre de 2026 con migraciones de permisos y límites 005/006 y recuperación habilitada; estado en `docs/renovacion-2026.md`.

## Desarrollo local

Usar el worktree de la tarea y comprobar reservas/puertos antes de arrancar. La configuración de Supabase identifica un stack aislado `christmas-planner-renovacion-4973`, con API 56491, PostgreSQL 56492 y Mailpit 56494. La aplicación usa el puerto **9000**. No reutilizar una instancia local ajena.

```sh
pnpm install
supabase start
# Obtener las claves del stack local en un fichero privado; no pegarlas en el chat.
supabase status -o env > /ruta/privada/local-supabase.env
pnpm seed:local
pnpm dev --hostname 127.0.0.1 --port 9000
```

Antes del seed y del servidor, preparar `.env.local` con permisos 600:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:56491
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY local>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY local>
NEXT_PUBLIC_APP_URL=http://127.0.0.1:9000
EMAIL_SERVICE_URL=http://127.0.0.1:56496
EMAIL_SERVICE_API_KEY=synthetic-mailpit-only
EMAIL_DELIVERY_ENABLED=true
AUTH_EMAIL_DELIVERY_ENABLED=true
```

Arrancar también `node scripts/local-email-service.mjs` (127.0.0.1:56496) con el gestor de procesos propio. La clave local es `synthetic-mailpit-only`; el adaptador solo acepta destinatarios `@example.test` y captura en Mailpit. `AUTH_EMAIL_DELIVERY_ENABLED=true` en ese stack entrega exclusivamente a Mailpit. No utilizar SMTP externo ni copiar las credenciales alojadas para pruebas. El seed rechaza cualquier URL distinta de la API local y crea únicamente identidades de prueba; sus credenciales están en `scripts/seed-local.mjs`. No se importan datos familiares reales.

## Validación

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm test:db
pnpm build
pnpm test:e2e
```

Playwright requiere Chromium instalado (`pnpm exec playwright install chromium`) y el stack local arrancado. Se ejecuta en headless, con un worker y cuentas sintéticas. La batería comprueba acceso familiar, cookies, origen, permisos, privacidad, CRUD de deseos, conservación de formularios ante fallos, perfil, foto, contraseña, preferencias, errores de avisos, recuperación de un solo uso y responsive. Las capturas y resultados se guardan en `artifacts/renovacion/`.

## Activación en el Supabase actual

Requiere una entrega revisada y autorización de despliegue. Preparar y verificar antes de publicar:

1. El perfil familiar conserva su ID y sus datos. En Crear o recuperar contraseña se genera un enlace nativo recovery para identidades existentes o invite para perfiles aún sin identidad. Solo quien verifica el enlace recibido puede elegir contraseña; no hay altas públicas ni contraseñas por defecto. No se cambian credenciales existentes automáticamente.
2. Aplicar `005_secure_api_access.sql` y `006_auth_email_rate_limit.sql` con el release: retira el acceso directo a tablas del esquema a `anon` y `authenticated`; las APIs usan `service_role` tras verificar identidad y permisos. Configurar obligatoriamente `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor. Los helpers de consulta de navegador antiguos no son una vía válida de acceso.
3. Mantener confirmación de email activa. No cambiar la política global de registro sin revisar los demás consumidores del proyecto. La allowlist familiar se valida en cada solicitud del servidor.
4. El acceso utiliza exclusivamente correo y contraseña. No se comparte autenticación con VetiMoly ni se configura Google. Mantener las identidades existentes del Supabase actual.
5. La recuperación usa el email-service existente, plantilla `christmas-planner/password-recovery` y SMTP específico del proyecto (Gmail verificado; ver la corrección final en docs/renovacion-2026.md). El SQL reproducible de plantilla está en `docs/sql/007_access_email_template.sql`; no contiene secretos. Se conserva SMTP, Site URL, allowlist y plantillas globales de Supabase y la configuración de otras apps. Configurar `NEXT_PUBLIC_APP_URL` con el dominio de la app, claves server-only del servicio y `AUTH_EMAIL_DELIVERY_ENABLED=true`/`EMAIL_DELIVERY_ENABLED=true` después de verificar el remitente. El enlace contiene un token nativo de un solo uso, verificado como recovery o invite antes de emitir el permiso firmado de diez minutos. Límites durables: un intento por minuto y cinco por hora por correo, veinte por hora por IP; no se revela pertenencia familiar.
6. Para los avisos de deseos e invitaciones, configurar `EMAIL_SERVICE_URL`, `EMAIL_SERVICE_API_KEY` y `EMAIL_DELIVERY_ENABLED=true`. Usan el servicio existente y las plantillas `christmas-planner/gift-added` e `invitation`. No hay avisos al destinatario de una asignación. Las preferencias se verifican antes de enviar; un error de lectura impide el envío. El correo es independiente de la campana.
7. Verificar Storage: bucket público `christmas-avatars`, formatos de imagen admitidos y límite de 2 MB. Subidas y borrados se realizan por APIs autenticadas; no habilitar escrituras públicas. La API impide borrar fotos ajenas o compartidas.
8. Probar una cuenta familiar, una ajena, una desactivada, recuperación, permisos, campana y correo en el entorno autorizado antes de cerrar la entrega.

La autenticación invalida las antiguas cookies de identificación por email. No hay una contraseña inicial automática para los miembros existentes.

## Ayuda y novedades

`/help` es el centro de ayuda accesible desde el login y la navegación. Incluye novedades y tutoriales de acceso, familia, carta, sorpresas, cuenta, avisos y administración. Las pantallas enlazan a su apartado. Toda actualización que cambie un flujo debe actualizar también su tutorial y las novedades de esta página.

## Seguridad y operación

La identidad se obtiene con `auth.getUser()`, nunca de una cookie de usuario sin verificar. Las cookies son HTTP-only; las mutaciones comprueban el origen. La recuperación utiliza un permiso firmado, ligado al miembro, con diez minutos de duración, emitido solo después de verificar el token de recuperación en Auth. La salida cierra la sesión del dispositivo actual.

Las migraciones y configuración de Auth alojadas son un gate de publicación. No utilizar `supabase db push` contra el proyecto alojado durante las pruebas locales. Cerrar únicamente el stack local de la tarea con el mismo `project_id`, revalidando IDs y generación, y conservar sus datos sintéticos/evidencias. El servidor de desarrollo se registra con el helper compartido `agent-local-work`.

Referencias: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [plantillas de email](https://supabase.com/docs/guides/auth/auth-email-templates).
