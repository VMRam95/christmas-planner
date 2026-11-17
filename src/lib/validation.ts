export const isId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
export const isEmail = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
export function giftError(data: { title?: unknown; description?: unknown; url?: unknown; priority?: unknown }, partial = false): string | null {
  if ((!partial || data.title !== undefined) && (typeof data.title !== 'string' || !data.title.trim() || data.title.trim().length > 120)) return 'El título debe tener entre 1 y 120 caracteres.'
  if (data.description != null && (typeof data.description !== 'string' || data.description.length > 2000)) return 'La descripción admite hasta 2.000 caracteres.'
  if (data.url != null && data.url !== '') {
    if (typeof data.url !== 'string' || data.url.length > 2048) return 'El enlace no es válido.'
    try { const url = new URL(data.url.trim()); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return 'Utiliza un enlace http o https sin credenciales.' } catch { return 'Introduce un enlace completo, como https://tienda.com/producto.' }
  }
  if (data.priority !== undefined && ![1, 2, 3].includes(data.priority as number)) return 'Selecciona una prioridad válida.'
  return null
}

export function passwordError(value: unknown): string | null {
  return typeof value !== 'string' || value.length < 12 || value.length > 128
    ? 'La contraseña debe tener entre 12 y 128 caracteres.'
    : null
}
