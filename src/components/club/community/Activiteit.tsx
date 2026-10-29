'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Hand, ThumbsUp } from 'lucide-react'
import type { Activiteit as Item } from '@/lib/club/community/model'
import { geledenLabel } from '@/lib/club/meldingen/model'
import { stuur } from '@/components/club/leden/stuur'
import { groepHref } from '@/lib/club/community/paden'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// Reacties op de eigen berichten: de meldingen van de community. Nieuwe
// reacties hebben een stip; bij het openen zet de app ze op gezien (zonder de
// pagina te verversen, zodat de stippen dit bezoek nog zichtbaar blijven).

interface Props {
  items: Item[]
  nieuw: number
  nu: string
  /** Basispad van de community (communityBasis). */
  basis: string
  alleenLezen: boolean
}

export function Activiteit({ items, nieuw, nu, basis, alleenLezen }: Props) {
  const taal = useTaal()
  const tc = useTekst(COMMUNITY)
  const t = tc.activiteit
  useEffect(() => {
    if (nieuw > 0 && !alleenLezen) void stuur('/api/club/lid/community/gezien', 'POST')
  }, [nieuw, alleenLezen])

  if (items.length === 0) return null
  const datum = new Date(nu)
  return (
    <section aria-labelledby="cm-activiteit-kop" className="club-cm-sectie">
      <h3 id="cm-activiteit-kop" className="club-lidapp-label">
        {t.titel}{nieuw > 0 && <span className="club-cm-teller">{t.nieuw(nieuw)}</span>}
      </h3>
      <ul className="club-cm-activiteit">
        {items.slice(0, 8).map((a) => (
          <li key={a.id} className={a.nieuw ? 'is-nieuw' : undefined}>
            <Link href={groepHref(basis, a.groepId)} prefetch={false}>
              <span className="club-cm-activiteit-icoon" aria-hidden>
                {a.soort === 'duim' ? <ThumbsUp size={16} /> : <Hand size={16} />}
              </span>
              <span>
                <strong>{a.wie ? t.wie(a.wie, tc.reactie[a.soort].werkwoord) : a.tekst}</strong>
                <span className="club-cm-activiteit-fragment">{t.op(a.bericht)}</span>
              </span>
              <time dateTime={a.op}>{geledenLabel(a.op, datum, taal)}</time>
              {a.nieuw && <span className="club-sr">{t.nieuwSr}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
