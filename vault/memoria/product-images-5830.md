# Imágenes de productos · CAS 5830

La renovación de producción seguía sin commit en el carril histórico. El usuario
ordenó «incluye todo» el 17/11/2026. Se conserva en 9e08513; el original no se toca.
Corrección de recuperación 69ad22f; imágenes 4a2869b. Rama cas/christmas-planner-2,
base main. Sin autorización de merge o despliegue.

La imagen se extrae del enlace para los deseos nuevos y existentes sin migrar datos.
Tarjetas propias, familiares y sorpresas usan el mismo componente. Fallback
«Sin imagen» si la tienda bloquea la extracción. Endpoint autenticado con controles
DNS/redirecciones, límite de tamaño y plazo total de ocho segundos.

Validación conjunta: 13 unitarios, 4 DB, 14 E2E sin skips, types/lint/build exit 0;
tres avisos previos de lint. Capturas móvil/escritorio/familiar/carga/fallo abiertas.
Dos primeras ejecuciones E2E fallaron: defecto de redirección de recuperación y
carrera del test al cerrar avisos; ambos corregidos y logs conservados.

Fuente canónica: [docs/product-images.md](../../docs/product-images.md).
Pruebas y capturas: artifacts/product-images-5830/. Instrucciones: AGENTS.md.
Limpieza verificada: dos procesos y seis contenedores propios cerrados; cachés
retiradas, 1,13 GiB liberados. Datos sintéticos, configuración privada y worktree
CAS conservados. Pendiente registrar URL de PR.
