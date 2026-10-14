'use client'

import { useRouter } from 'next/navigation'

// Kies welk (demo)lid je in de voorvertoning bekijkt. Staat in de URL (?lid=).

export interface LidOptie {
  id: string
  naam: string
  heeftSchema: boolean
}

export function LidKiezer({ opties, gekozen, basisPad }: { opties: LidOptie[]; gekozen: string; basisPad: string }) {
  const router = useRouter()
  return (
    <label className="club-veld club-lidapp-kiezer">
      <span>Bekijk als</span>
      <select className="club-invoer" value={gekozen} onChange={(e) => router.push(`${basisPad}&lid=${encodeURIComponent(e.target.value)}`, { scroll: false })}>
        {opties.map((o) => (
          <option key={o.id} value={o.id}>
            {o.naam}
            {o.heeftSchema ? ' (met schema)' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
