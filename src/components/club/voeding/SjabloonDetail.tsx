import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { VoedingSjabloon } from '@/lib/club/voeding/model'
import { DOEL_INFO } from '@/lib/club/voeding/rekenhulp'
import { MacroBord } from './MacroBord'
import { PlanInhoud } from './PlanInhoud'
import { doelLabel } from './weergave'

// Een sjabloon bekijken: doel, eiwitnorm, eventuele vaste dagdoelen, adviezen en dag.

interface SjabloonDetailProps {
  s: VoedingSjabloon
  wijzigHref: string
}

export function SjabloonDetail({ s, wijzigHref }: SjabloonDetailProps) {
  const vast = s.kcal !== null && s.eiwitG !== null && s.koolhydratenG !== null && s.vetG !== null
  return (
    <article className="club-kaart club-voeding club-voeding-blok" aria-labelledby="sjabloon-kop">
      <div className="club-sectiekop">
        <h2 id="sjabloon-kop">{s.naam}</h2>
        <Link href={wijzigHref} scroll={false} className="club-knop club-knop--klein">
          <Pencil size={14} aria-hidden /> Wijzigen
        </Link>
      </div>
      {s.omschrijving && <p className="club-voeding-hint">{s.omschrijving}</p>}
      <p className="club-voeding-meta">
        {doelLabel(s.doel)}
        {s.doel && ` (${DOEL_INFO[s.doel].uitleg.toLowerCase()})`}
        {s.eiwitPerKg !== null && ` · eiwit ${String(s.eiwitPerKg).replace('.', ',')} g per kilo`}
      </p>
      {vast ? (
        <MacroBord doelen={{ kcal: s.kcal as number, eiwitG: s.eiwitG as number, koolhydratenG: s.koolhydratenG as number, vetG: s.vetG as number }} compact />
      ) : (
        <p className="club-voeding-hint">Geen vaste dagdoelen: bij toepassen rekent Club per lid met de rekenhulp en het doel van dit sjabloon.</p>
      )}
      <PlanInhoud adviezen={s.adviezen} maaltijden={s.maaltijden} idPrefix={`sjabloon-${s.id}`} />
    </article>
  )
}
