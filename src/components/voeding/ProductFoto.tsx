'use client'

import { useState } from 'react'
import { Utensils } from 'lucide-react'

// Eén heldere, consistente productfoto voor de hele voedingsapp. Open Food Facts-
// URL's zijn niet altijd geldig; `onError` valt daarom terug op een net icoon in
// plaats van een kapot plaatje. Gedeeld door zoeken, recent en het dagoverzicht.

export function ProductFoto({ src, alt, size = 48, radius = 12 }: { src: string | null; alt: string; size?: number; radius?: number }) {
  const [mislukt, setMislukt] = useState(false)
  const toon = src !== null && src.length > 0 && !mislukt
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'var(--bg-subtle)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
      {toon ? (
        <img
          src={src ?? ''}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setMislukt(true)}
          style={{ width: size, height: size, objectFit: 'cover' }}
        />
      ) : (
        <Utensils size={Math.round(size * 0.42)} aria-hidden style={{ color: 'var(--text-4)' }} />
      )}
    </div>
  )
}
