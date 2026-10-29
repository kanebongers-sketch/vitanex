'use client'

import { useEffect, useState } from 'react'
import { ArrowUpCircle, BellOff, Smartphone, BellRing, CalendarCheck, CalendarClock, CalendarX, Hourglass } from 'lucide-react'
import { geledenLabel, type LedenappMelding } from '@/lib/club/meldingen/model'
import type { Soort } from '@/lib/club/meldingen/soorten'
import { LegeStaat } from '@/components/club/app/LegeStaat'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MELDINGEN } from '@/lib/aiyourgym/taal/woorden/club/meldingen'
import './meldingen.css'

// De meldingen van een lid in de ledenapp: bevestigingen, herinneringen en
// annuleringen, nieuwste bovenaan. Presentatief: de data komt van de server
// (haalLedenappMeldingen in src/lib/club/meldingen/opslag.ts). Met gelezenUrl
// zet het component nieuwe meldingen na het openen op gelezen (POST, zonder body).

export interface LedenappMeldingenProps {
  meldingen: readonly LedenappMelding[]
  /** POST-adres dat alle meldingen van dit lid op gelezen zet; leeg = niet bijhouden. */
  gelezenUrl?: string
  /** ISO-tijdstip voor "x minuten geleden" (standaard: nu). */
  nu?: string
}

type Toon = 'ok' | 'let' | 'info'

const ICOON: Record<Soort, { Icoon: typeof BellRing; toon: Toon }> = {
  les_geboekt: { Icoon: CalendarCheck, toon: 'ok' },
  les_wachtlijst: { Icoon: Hourglass, toon: 'info' },
  les_afgemeld: { Icoon: CalendarX, toon: 'info' },
  les_doorgeschoven: { Icoon: ArrowUpCircle, toon: 'ok' },
  les_herinnering: { Icoon: BellRing, toon: 'info' },
  les_geannuleerd: { Icoon: CalendarX, toon: 'let' },
  afspraak_geboekt: { Icoon: CalendarCheck, toon: 'ok' },
  afspraak_verplaatst: { Icoon: CalendarClock, toon: 'let' },
  afspraak_herinnering: { Icoon: BellRing, toon: 'info' },
  afspraak_afgemeld: { Icoon: CalendarX, toon: 'info' },
  afspraak_geannuleerd: { Icoon: CalendarX, toon: 'let' },
  app_uitnodiging: { Icoon: Smartphone, toon: 'info' },
  app_link: { Icoon: Smartphone, toon: 'info' },
}

export function LedenappMeldingen({ meldingen, gelezenUrl, nu }: LedenappMeldingenProps) {
  // Wat nieuw was bij het openen blijft gemarkeerd zolang het scherm open is.
  const [nieuw] = useState(() => new Set(meldingen.filter((m) => !m.gelezen).map((m) => m.id)))
  const moment = nu ? new Date(nu) : new Date()
  const taal = useTaal()
  const t = useTekst(MELDINGEN).lijst

  useEffect(() => {
    if (!gelezenUrl || nieuw.size === 0) return
    fetch(gelezenUrl, { method: 'POST' }).catch(() => undefined)
  }, [gelezenUrl, nieuw])

  if (meldingen.length === 0) {
    return (
      <LegeStaat Icoon={BellOff} titel={t.geen}>
        {t.geenUitleg}
      </LegeStaat>
    )
  }

  return (
    <section className="club-meldingen-lijst" aria-label={t.label}>
      {nieuw.size > 0 && <p className="club-meldingen-teller">{t.nieuw(nieuw.size)}</p>}
      <ol>
        {meldingen.map((m) => {
          const { Icoon, toon } = ICOON[m.soort]
          const isNieuw = nieuw.has(m.id)
          return (
            <li key={m.id} className={`club-meldingen-item is-${toon}${isNieuw ? ' is-nieuw' : ''}`}>
              <span className="club-meldingen-icoon" aria-hidden>
                <Icoon size={18} />
              </span>
              <div className="club-meldingen-tekst">
                <strong>{m.onderwerp}</strong>
                <p>{m.inhoud}</p>
                <time dateTime={m.op}>
                  {isNieuw && <span className="club-meldingen-stip">{t.stip}</span>}
                  {geledenLabel(m.op, moment, taal)}
                </time>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
