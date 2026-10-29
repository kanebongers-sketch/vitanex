'use client'

import { CalendarCheck, Mail, NotebookPen, Phone, Shuffle } from 'lucide-react'
import type { HistorieRegel, HistorieSoort } from '@/lib/club/leads/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'
import { toonMoment } from '@/lib/club/leads/regels'

const ICOON: Record<HistorieSoort, typeof Phone> = {
  gebeld: Phone,
  gemaild: Mail,
  notitie: NotebookPen,
  status: Shuffle,
  proefles: CalendarCheck,
}

// De tijdlijn van een lead, nieuwste bovenaan.
export function PaneelHistorie({ historie }: { historie: HistorieRegel[] }) {
  const taal = useTaal()
  const tekst = useTekst(LEADS)
  return (
    <section className="club-leads-blok" aria-labelledby="paneel-historie">
      <h3 id="paneel-historie">{tekst.historiePaneel.titel}</h3>
      {historie.length === 0 ? (
        <p className="club-hint">{tekst.historiePaneel.leeg}</p>
      ) : (
        <ol className="club-leads-tijdlijn">
          {historie.map((h) => {
            const Icoon = ICOON[h.soort]
            return (
              <li key={h.id} data-soort={h.soort}>
                <span className="club-leads-tijdlijnpunt" aria-hidden>
                  <Icoon size={13} />
                </span>
                <div>
                  <p className="club-leads-tijdlijnkop">
                    <strong>{tekst.historie[h.soort]}</strong>
                    <time dateTime={h.op}>{toonMoment(h.op, taal)}</time>
                    {h.auteur && <span className="club-zacht">{h.auteur}</span>}
                  </p>
                  {h.tekst && <p className="club-leads-tijdlijntekst">{h.tekst}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
