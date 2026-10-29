'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { roosterHref, type RoosterStaat } from '@/lib/club/rooster/url'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'

// Filters op zaal, lestype en instructeur. Ze staan in de URL, zodat een
// gefilterde week te delen is ("alle spinning van Kim").

interface Optie {
  id: string
  naam: string
}

interface Props {
  staat: RoosterStaat
  zalen: Optie[]
  lestypen: Optie[]
  instructeurs: Optie[]
}

const VELDEN = [
  { sleutel: 'zaal', label: 'zaal', leeg: 'alleZalen' },
  { sleutel: 'lestype', label: 'les', leeg: 'alleLessen' },
  { sleutel: 'instructeur', label: 'instructeur', leeg: 'alleInstructeurs' },
] as const

export function RoosterFilters({ staat, zalen, lestypen, instructeurs }: Props) {
  const router = useRouter()
  const t = useTekst(ROOSTER).filters
  const opties = { zaal: zalen, lestype: lestypen, instructeur: instructeurs }
  const actief = Boolean(staat.zaal || staat.lestype || staat.instructeur)

  function kies(sleutel: (typeof VELDEN)[number]['sleutel'], waarde: string) {
    router.push(roosterHref(staat, { [sleutel]: waarde || null, les: null }), { scroll: false })
  }

  return (
    <form className="club-rooster-filters" role="search" aria-label={t.label} onSubmit={(e) => e.preventDefault()}>
      {VELDEN.map((v) => (
        <label key={v.sleutel} className="club-rooster-filter" data-actief={staat[v.sleutel] ? true : undefined}>
          <span className="club-sr">{t[v.label]}</span>
          <select value={staat[v.sleutel] ?? ''} onChange={(e) => kies(v.sleutel, e.target.value)}>
            <option value="">{t[v.leeg]}</option>
            {opties[v.sleutel].map((o) => (
              <option key={o.id} value={o.id}>
                {o.naam}
              </option>
            ))}
          </select>
        </label>
      ))}
      {actief && (
        <button
          type="button"
          className="club-knop club-knop--stil club-knop--klein"
          onClick={() => router.push(roosterHref(staat, { zaal: null, lestype: null, instructeur: null, les: null }), { scroll: false })}
        >
          <X aria-hidden size={14} />
          {t.wis}
        </button>
      )}
    </form>
  )
}
