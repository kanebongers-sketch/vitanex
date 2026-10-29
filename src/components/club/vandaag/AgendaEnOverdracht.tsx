import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { formWaarden, type AgendaItem } from '@/lib/club/agenda/model'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'
import { voorproef, type KladNotitie } from '@/lib/club/kladblok/model'

// Op Vandaag: de afspraken van vandaag (uit de Agenda) en wat de vorige dienst
// heeft overgedragen (Notities, map Overdracht). Alleen lezen; tikken opent het onderdeel.

export async function AgendaVandaag({ items, vestiging }: { items: AgendaItem[] | null; vestiging: Vestiging }) {
  const t = (await clubTekst(VANDAAG)).agenda
  const tijd = (a: AgendaItem) => {
    if (a.heleDag) return t.heleDag
    const { begin, eind } = formWaarden(a)
    return t.tijd(begin, eind)
  }
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-agenda">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-agenda">{t.titel}</h2>
        <Link href={clubPad('/agenda', vestiging)} className="club-vandaag-meer">
          {t.link} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {items === null ? (
        <p className="club-melding club-melding--fout" role="status">{t.fout}</p>
      ) : items.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {items.map((a) => (
            <li key={a.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{a.titel}</span>
                <span className="club-rij-sub">{tijd(a)} · {t.soort[a.soort]}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function OverdrachtVandaag({ notities, vestiging }: { notities: KladNotitie[] | null; vestiging: Vestiging }) {
  const t = (await clubTekst(VANDAAG)).overdracht
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-overdracht">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-overdracht">{t.titel}</h2>
        <Link href={clubPad('/notities', vestiging)} className="club-vandaag-meer">
          {t.link} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {notities === null ? (
        <p className="club-melding club-melding--fout" role="status">{t.fout}</p>
      ) : notities.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {notities.map((n) => (
            <li key={n.id} className="club-rij">
              <Link className="club-rij-hoofd" href={clubPad('/notities', vestiging, { n: n.id })}>
                <span className="club-rij-titel">{n.vastgepind ? t.vast : ''}{n.titel}</span>
                <span className="club-rij-sub">{voorproef(n.inhoud, 90) || t.legeNotitie}{n.auteur ? ` · ${n.auteur}` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
