# Christmas Planner

**Project Name**: christmas-planner

Aplicación privada de regalos familiares. Stack: Next.js 16, React 19, TypeScript,
Tailwind 4 y Supabase. Conserva el tema verde, crema y dorado, los componentes y
la autenticación existentes. Usa pnpm.

## Contexto y fuentes

- [README.md](README.md): arranque, configuración y pruebas locales.
- [Baúl](vault/INDEX.md): fuentes y último refresco. Ejecuta
  `python3 -B ~/.agents/skills/baul/scripts/baul.py refresh` desde el checkout
  principal; nunca inicialices otro baúl en un worktree.
- [Renovación publicada](docs/renovacion-2026.md): historial de producción y
  decisiones; las secciones antiguas pueden estar superadas por las posteriores.
- [Imágenes de productos](docs/product-images.md): implementación, pruebas,
  evidencias, recursos y estado de la entrega actual.

## Seguridad y cambios

- Verifica la sesión con `getSession()` antes de acceder a datos. Solo miembros
  familiares confirmados. Acceso mediante email/contraseña, sin Google.
- La carta propia nunca revela asignaciones. Las sorpresas se ocultan a su
  destinatario y las cartas ajenas no revelan identidades de otros regaladores.
- Mantén validación compartida, comprobación de origen en mutaciones y
  `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor.
- Supabase alojado: `vxirigqzqixsihyunazf`, esquema `christmas_planner`.
  No modificar configuración global de Auth, datos, permisos o SMTP al probar.
- Las imágenes externas pasan por `/api/product-image`: conserva comprobación de
  DNS y redirecciones, conexión a la IP validada, formatos, tamaños y plazo total.
- Todo cambio de flujo debe actualizar tutorial y novedades de `/help`.

## Pruebas y recursos

- Aplicación local en `127.0.0.1:9000`. Antes de arrancar, revisa puertos y
  registros; usa `agent-local-work` y registra procesos con identidad de inicio.
- Prueba con Supabase local aislado y usuarios sintéticos. Conserva volúmenes y
  datos; no reutilices el stack de otro carril. La configuración histórica usa
  `christmas-planner-renovacion-4973`; una prueba nueva debe tener su propio ID.
- `pnpm test`, `pnpm test:db`, `pnpm type-check`, `pnpm lint`, `pnpm build` y
  `pnpm test:e2e`. La batería E2E incluye la extracción de imágenes con un producto
  real externo; requiere red. `pnpm test:product-images:e2e` ejecuta solo ese flujo.
- Navegador siempre headless con perfil propio. Inspecciona capturas móvil y
  escritorio y registra límites de emulación, accesibilidad y rendimiento.
- Correo local: adaptador `scripts/local-email-service.mjs` y Mailpit. Ningún
  correo real durante las pruebas. Configuración y claves locales privadas, con 600.

## Git y entrega

- Base real: `main`; no existe `develop`. Vercel despliega automáticamente desde
  `main`: abrir PR no autoriza merge ni publicación.
- Commits con identidad personal, Conventional Commits en inglés y sin atribuciones.
- La renovación anterior se conservó sin modificar su carril original, y se
  incorporó a esta rama por orden expresa «incluye todo» del 17/11/2026.
- Al terminar, detén solo recursos registrados de tu generación y conserva
  código, evidencias, configuración y datos. No retires locks de worktrees CAS.
