import Link from 'next/link'
import { Search } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

// Een lid zoeken om een plan voor te maken (gewoon formulier, werkt zonder JavaScript).

interface LidZoekProps {
  vestiging: string
  term: string
  /** null = zoeken mislukt; leeg = niets gevonden. */
  leden: Lid[] | null
  metPlan: ReadonlySet<string>
}

export async function LidZoek({ vestiging, term, leden, metPlan }: LidZoekProps) {
  const t = VOEDING[await getTaal()].zoek
  return (
    <section className="club-kaart club-voeding-blok" aria-labelledby="voeding-zoek-kop">
      <h2 id="voeding-zoek-kop">{t.titel}</h2>
      <form className="club-voeding-zoek" action="/club/voeding" method="get" role="search">
        <input type="hidden" name="v" value={vestiging} />
        <input className="club-invoer" type="search" name="q" defaultValue={term} placeholder={t.plaats} aria-label={t.label} minLength={2} />
        <button type="submit" className="club-knop">
          <Search size={15} aria-hidden /> {t.zoeken}
        </button>
      </form>
      {leden === null && <p className="club-melding club-melding--fout" role="status">{t.fout}</p>}
      {term && leden && leden.length === 0 && <p className="club-voeding-hint">{t.geen(term)}</p>}
      {leden && leden.length > 0 && (
        <ul className="club-voeding-lijst">
          {leden.map((l) => (
            <li key={l.id}>
              <Link href={clubPad(`/voeding/lid/${l.id}`, vestiging)} className="club-voeding-regel">
                <span>
                  <span className="club-voeding-regel-titel">{volledigeNaam(l)}</span>
                  {l.lidnummer && <span className="club-voeding-regel-sub">{t.lidnummer(l.lidnummer)}</span>}
                </span>
                <span className={metPlan.has(l.id) ? 'club-chip club-chip--ok' : 'club-chip club-chip--merk'}>{metPlan.has(l.id) ? t.bewerken : t.maken}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!term && <p className="club-voeding-hint">{t.hint}</p>}
    </section>
  )
}
