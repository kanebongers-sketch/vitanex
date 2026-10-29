'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

// Keuzelijst met maanden. De adressen zijn op de server gemaakt; hier wordt
// alleen genavigeerd. Vorige en volgende maand staan als gewone links ernaast,
// die werken ook zonder JavaScript.

export interface MaandOptie {
  maand: string
  label: string
  href: string
}

export function MaandKiezer({ opties, gekozen, label }: { opties: MaandOptie[]; gekozen: string; label: string }) {
  const router = useRouter()
  const [bezig, start] = useTransition()

  function kies(maand: string) {
    const optie = opties.find((o) => o.maand === maand)
    if (optie) start(() => router.push(optie.href, { scroll: false }))
  }

  return (
    <label className="club-cijfers-maandkeuze">
      <span className="club-sr">{label}</span>
      <select className="club-invoer" value={gekozen} onChange={(e) => kies(e.target.value)} aria-busy={bezig || undefined}>
        {opties.map((o) => (
          <option key={o.maand} value={o.maand}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
