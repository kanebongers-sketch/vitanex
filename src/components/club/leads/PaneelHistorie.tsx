import { CalendarCheck, Mail, NotebookPen, Phone, Shuffle } from 'lucide-react'
import { HISTORIE_LABEL, type HistorieRegel, type HistorieSoort } from '@/lib/club/leads/model'
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
  return (
    <section className="club-leads-blok" aria-labelledby="paneel-historie">
      <h3 id="paneel-historie">Historie</h3>
      {historie.length === 0 ? (
        <p className="club-hint">Nog niets vastgelegd.</p>
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
                    <strong>{HISTORIE_LABEL[h.soort]}</strong>
                    <time dateTime={h.op}>{toonMoment(h.op)}</time>
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
