'use client'

import { useRouter } from 'next/navigation'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// Kies welk (demo)lid je in de voorvertoning bekijkt. Staat in de URL (?lid=).

export interface LidOptie {
  id: string
  naam: string
  heeftSchema: boolean
}

export function LidKiezer({ opties, gekozen, basisPad }: { opties: LidOptie[]; gekozen: string; basisPad: string }) {
  const router = useRouter()
  const t = useTekst(LEDENAPP).uitleg
  return (
    <label className="club-veld club-lidapp-kiezer">
      <span>{t.bekijkAls}</span>
      <select className="club-invoer" value={gekozen} onChange={(e) => router.push(`${basisPad}&lid=${encodeURIComponent(e.target.value)}`, { scroll: false })}>
        {opties.map((o) => (
          <option key={o.id} value={o.id}>
            {o.naam}
            {o.heeftSchema ? t.metSchema : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
