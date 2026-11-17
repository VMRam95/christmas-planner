'use client'

import { useState } from 'react'

export function ProductImage({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background sm:h-28 sm:w-28">
      {!loaded && <span className="px-2 text-center text-xs text-muted" role="img" aria-label={failed ? 'Sin imagen del producto' : 'Cargando imagen del producto'}>
        <span aria-hidden="true" className="mb-1 block text-2xl">🎁</span>
        {failed ? 'Sin imagen' : 'Cargando imagen'}
      </span>}
      {!failed && (
        // The authenticated endpoint validates and proxies external images without exposing the visitor.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/product-image?url=${encodeURIComponent(url)}`}
          alt={title}
          width={112}
          height={112}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full bg-white object-contain p-1 ${loaded ? '' : 'opacity-0'}`}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  )
}
