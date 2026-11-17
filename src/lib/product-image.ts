import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { BlockList, isIP } from 'node:net'

import type { LookupAddress } from 'node:dns'

const blocked = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['192.88.99.0', 24],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blocked.addSubnet(address, prefix, 'ipv4')
const globalV6 = new BlockList()
globalV6.addSubnet('2000::', 3, 'ipv6')
blocked.addSubnet('2001::', 23, 'ipv6')
blocked.addSubnet('2001:db8::', 32, 'ipv6')
blocked.addSubnet('2002::', 16, 'ipv6')

export function isPublicAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 4) return !blocked.check(address, 'ipv4')
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6')
}

export function productUrl(value: string, base?: string): URL {
  if (value.length > 4096) throw new Error('URL too long')
  const url = new URL(value, base)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) {
    throw new Error('Unsupported URL')
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost') ||
      (isIP(hostname) && !isPublicAddress(hostname))) throw new Error('Private URL')
  url.hash = ''
  return url
}

function decodeHtml(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1))
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' } as Record<string, string>)[entity.toLowerCase()]
  })
}

// Only inspect metadata and explicit product images; never guess from logos or adverts.
export function extractProductImage(html: string, pageUrl: string): string | null {
  const candidates: { rank: number; value: string }[] = []
  const markup = html.replace(/<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>/gi, '')
  for (const tag of markup.match(/<(?:meta|link|img)\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {}
    for (const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4])
    }
    const name = (attrs.property || attrs.name || '').toLowerCase()
    if (['og:image', 'og:image:url', 'og:image:secure_url'].includes(name)) candidates.push({ rank: 0, value: attrs.content })
    if (name === 'twitter:image' || name === 'twitter:image:src') candidates.push({ rank: 1, value: attrs.content })
    if (attrs.itemprop === 'image') candidates.push({ rank: 2, value: attrs.content || attrs.href || attrs.src })
    if (attrs.rel === 'image_src') candidates.push({ rank: 3, value: attrs.href })
    if (attrs.id === 'landingImage') candidates.push({ rank: 2, value: attrs['data-old-hires'] || attrs.src })
  }
  // Some shops only publish Schema.org Product data, including arrays and @graph.
  function productImages(value: unknown, depth = 0): void {
    if (!value || typeof value !== 'object' || depth > 10) return
    if (Array.isArray(value)) { value.forEach((item) => productImages(item, depth + 1)); return }
    const item = value as Record<string, unknown>
    const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
    if (types.some((type) => type === 'Product' || type === 'https://schema.org/Product')) {
      const images = Array.isArray(item.image) ? item.image : [item.image]
      for (const image of images) {
        const source = typeof image === 'string' ? image : image && typeof image === 'object'
          ? (image as Record<string, unknown>).url || (image as Record<string, unknown>).contentUrl : null
        if (typeof source === 'string') candidates.push({ rank: 2, value: source })
      }
    }
    Object.values(item).forEach((child) => productImages(child, depth + 1))
  }
  for (const script of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { productImages(JSON.parse(script[1])) } catch { /* Invalid structured data is optional. */ }
  }
  for (const { value } of candidates.sort((a, b) => a.rank - b.rank)) {
    if (!value?.trim()) continue
    try { return productUrl(value.trim(), pageUrl).href } catch { /* Try the next metadata entry. */ }
  }
  return null
}

type Resource = { body: Buffer; type: string; url: string }

// DNS is checked once and pinned to the socket, including every redirect and the image.
async function readPublicResource(value: string, signal: AbortSignal, maxBytes: number, imageOnly = false): Promise<Resource> {
  let url = productUrl(value)
  for (let redirects = 0; redirects <= 3; redirects++) {
    signal.throwIfAborted()
    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
      const abort = () => reject(signal.reason)
      signal.addEventListener('abort', abort, { once: true })
      lookup(hostname, { all: true }).then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
    })
    signal.throwIfAborted()
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('Private address')
    const { address, family } = addresses[0]
    const response = await new Promise<{ location?: string } & Resource>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        agent: false,
        signal,
        family,
        // Keep Host and TLS certificate verification tied to the original URL.
        lookup: (_host, _options, callback) => callback(null, address, family),
        headers: { 'User-Agent': 'ChristmasPlanner/1.0 (product image preview)', Accept: imageOnly ? 'image/*' : 'text/html,image/*', 'Accept-Encoding': 'identity' },
      }, (res) => {
        const status = res.statusCode ?? 500
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.destroy()
          resolve({ body: Buffer.alloc(0), type: '', url: url.href, location: res.headers.location })
          return
        }
        const type = res.headers['content-type']?.split(';')[0].trim().toLowerCase() ?? ''
        const isImage = /^image\/(jpeg|png|webp|gif|avif)$/.test(type)
        if (status !== 200 || (!isImage && (imageOnly || !['text/html', 'application/xhtml+xml'].includes(type))) ||
            Number(res.headers['content-length']) > maxBytes || (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity')) {
          res.destroy()
          reject(new Error('Unsupported response'))
          return
        }
        const chunks: Buffer[] = []
        let bytes = 0
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > maxBytes) res.destroy(new Error('Resource too large'))
          else chunks.push(chunk)
        })
        res.on('error', reject)
        res.on('end', () => resolve({ body: Buffer.concat(chunks), type, url: url.href }))
      })
      request.on('error', reject)
      request.end()
    })
    if (!response.location) return response
    url = productUrl(response.location, url.href)
  }
  throw new Error('Too many redirects')
}

export async function loadProductImage(value: string, signal: AbortSignal): Promise<Resource | null> {
  const page = await readPublicResource(value, signal, 2 * 1024 * 1024)
  if (page.type.startsWith('image/')) return page
  const image = extractProductImage(page.body.toString('utf8'), page.url)
  return image ? readPublicResource(image, signal, 5 * 1024 * 1024, true) : null
}
