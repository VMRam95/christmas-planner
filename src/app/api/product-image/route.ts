import { getSession } from '@/lib/auth'
import { loadProductImage, productUrl } from '@/lib/product-image'

import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'
const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: NextRequest): Promise<Response> {
  if (!await getSession()) return new Response(null, { status: 401, headers: noStore })
  const url = request.nextUrl.searchParams.get('url')
  try { productUrl(url ?? '') } catch { return new Response(null, { status: 400, headers: noStore }) }

  const headers = { 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' }
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8000)])
    const image = await loadProductImage(url!, signal)
    if (image) return new Response(new Uint8Array(image.body), { headers: { ...headers, 'Content-Type': image.type } })
  } catch { /* Store unavailable, blocked preview or missing image: keep the wish usable. */ }
  return new Response(null, { status: 404, headers: { ...headers, ...noStore } })
}
