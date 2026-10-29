import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { VoedingSjabloon } from '@/lib/club/voeding/model'
import { MacroBord } from './MacroBord'
import { PlanInhoud } from './PlanInhoud'
import { doelLabel } from './weergave'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

// Een sjabloon bekijken: doel, eiwitnorm, eventuele vaste dagdoelen, adviezen en dag.

interface SjabloonDetailProps {
  s: VoedingSjabloon
  wijzigHref: string
}

export async function SjabloonDetail({ s, wijzigHref }: SjabloonDetailProps) {
  const taal = await getTaal()
  const tv = VOEDING[taal]
  const t = tv.sjabloonDetail
  const vast = s.kcal !== null && s.eiwitG !== null && s.koolhydratenG !== null && s.vetG !== null
  return (
    <article className="club-kaart club-voeding club-voeding-blok" aria-labelledby="sjabloon-kop">
      <div className="club-sectiekop">
        <h2 id="sjabloon-kop">{s.naam}</h2>
        <Link href={wijzigHref} scroll={false} className="club-knop club-knop--klein">
          <Pencil size={14} aria-hidden /> {t.wijzigen}
        </Link>
      </div>
      {s.omschrijving && <p className="club-voeding-hint">{s.omschrijving}</p>}
      <p className="club-voeding-meta">
        {doelLabel(s.doel, taal)}
        {s.doel && ` (${tv.doel[s.doel].uitleg.toLowerCase()})`}
        {s.eiwitPerKg !== null && t.eiwit(formatGetal(s.eiwitPerKg, taal))}
      </p>
      {vast ? (
        <MacroBord doelen={{ kcal: s.kcal as number, eiwitG: s.eiwitG as number, koolhydratenG: s.koolhydratenG as number, vetG: s.vetG as number }} compact taal={taal} />
      ) : (
        <p className="club-voeding-hint">{t.geenVast}</p>
      )}
      <PlanInhoud adviezen={s.adviezen} maaltijden={s.maaltijden} idPrefix={`sjabloon-${s.id}`} taal={taal} />
    </article>
  )
}
