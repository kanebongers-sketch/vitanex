import Link from 'next/link'
import { Search } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'

// Een lid zoeken om een plan voor te maken (gewoon formulier, werkt zonder JavaScript).

interface LidZoekProps {
  vestiging: string
  term: string
  /** null = zoeken mislukt; leeg = niets gevonden. */
  leden: Lid[] | null
  metPlan: ReadonlySet<string>
}

export function LidZoek({ vestiging, term, leden, metPlan }: LidZoekProps) {
  return (
    <section className="club-kaart club-voeding-blok" aria-labelledby="voeding-zoek-kop">
      <h2 id="voeding-zoek-kop">Plan voor een lid</h2>
      <form className="club-voeding-zoek" action="/clubkane/voeding" method="get" role="search">
        <input type="hidden" name="v" value={vestiging} />
        <input className="club-invoer" type="search" name="q" defaultValue={term} placeholder="Naam, lidnummer of e-mail" aria-label="Lid zoeken" minLength={2} />
        <button type="submit" className="club-knop">
          <Search size={15} aria-hidden /> Zoeken
        </button>
      </form>
      {leden === null && <p className="club-melding club-melding--fout" role="status">Zoeken is niet gelukt. Probeer het opnieuw.</p>}
      {term && leden && leden.length === 0 && <p className="club-voeding-hint">Geen lid gevonden met {term} in deze vestiging.</p>}
      {leden && leden.length > 0 && (
        <ul className="club-voeding-lijst">
          {leden.map((l) => (
            <li key={l.id}>
              <Link href={clubPad(`/voeding/lid/${l.id}`, vestiging)} className="club-voeding-regel">
                <span>
                  <span className="club-voeding-regel-titel">{volledigeNaam(l)}</span>
                  {l.lidnummer && <span className="club-voeding-regel-sub">Lidnummer {l.lidnummer}</span>}
                </span>
                <span className={metPlan.has(l.id) ? 'club-chip club-chip--ok' : 'club-chip club-chip--merk'}>{metPlan.has(l.id) ? 'Bewerken' : 'Plan maken'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!term && <p className="club-voeding-hint">Zoek een lid, of open de ledenkaart en kies daar Voeding.</p>}
    </section>
  )
}
