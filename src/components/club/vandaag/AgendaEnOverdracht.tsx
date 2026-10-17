import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { SOORT_LABEL, tijdLabel, type AgendaItem } from '@/lib/club/agenda/model'
import { voorproef, type KladNotitie } from '@/lib/club/kladblok/model'

// Op Vandaag: de afspraken van vandaag (uit de Agenda) en wat de vorige dienst
// heeft overgedragen (Notities, map Overdracht). Alleen lezen; tikken opent het onderdeel.

export function AgendaVandaag({ items, vestiging }: { items: AgendaItem[] | null; vestiging: Vestiging }) {
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-agenda">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-agenda">Agenda vandaag</h2>
        <Link href={clubPad('/agenda', vestiging)} className="club-vandaag-meer">
          Agenda <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {items === null ? (
        <p className="club-melding club-melding--fout" role="status">De agenda kon niet worden geladen.</p>
      ) : items.length === 0 ? (
        <p className="club-leeg">Vandaag staan er geen afspraken in de agenda.</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {items.map((a) => (
            <li key={a.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{a.titel}</span>
                <span className="club-rij-sub">{tijdLabel(a)} · {SOORT_LABEL[a.soort]}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function OverdrachtVandaag({ notities, vestiging }: { notities: KladNotitie[] | null; vestiging: Vestiging }) {
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-overdracht">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-overdracht">Overdracht</h2>
        <Link href={clubPad('/notities', vestiging)} className="club-vandaag-meer">
          Notities <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {notities === null ? (
        <p className="club-melding club-melding--fout" role="status">De notities konden niet worden geladen.</p>
      ) : notities.length === 0 ? (
        <p className="club-leeg">Geen overdracht van de afgelopen dagen. Zet iets in Notities, map Overdracht.</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {notities.map((n) => (
            <li key={n.id} className="club-rij">
              <Link className="club-rij-hoofd" href={clubPad('/notities', vestiging, { n: n.id })}>
                <span className="club-rij-titel">{n.vastgepind ? 'Vast: ' : ''}{n.titel}</span>
                <span className="club-rij-sub">{voorproef(n.inhoud, 90) || 'Lege notitie'}{n.auteur ? ` · ${n.auteur}` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
