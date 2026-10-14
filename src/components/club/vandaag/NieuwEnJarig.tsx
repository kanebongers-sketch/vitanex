import Link from 'next/link'
import { Cake } from 'lucide-react'
import type { Jarige, VandaagLid } from '@/lib/club/cijfers/vandaag'
import { dagKort } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/gedeeld/vestiging'
import { initialen } from '@/lib/club/gedeeld/lid'

// Mensen om vandaag even aan te spreken: wie net begonnen is en wie jarig is.

export function NieuwDezeWeek({ leden, vestiging }: { leden: VandaagLid[]; vestiging: Vestiging }) {
  const proef = leden.filter((l) => l.status === 'proef').length
  return (
    <section className="club-kaart club-kaart--vlak" aria-labelledby="vandaag-nieuw">
      <header className="club-sectiekop">
        <h2 id="vandaag-nieuw">Nieuw deze week</h2>
        <span>
          {leden.length - proef} leden · {proef} proefleden
        </span>
      </header>
      {leden.length === 0 ? (
        <p className="club-leeg">Deze week nog geen nieuwe leden of proefleden.</p>
      ) : (
        <ul className="club-vandaag-gezichten">
          {leden.map((l) => (
            <li key={l.id}>
              <Link href={clubPad(`/leden/${l.id}`, vestiging)} className="club-vandaag-gezicht">
                <span className="club-avatar" aria-hidden>
                  {initialen(l)}
                </span>
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">
                    {l.voornaam} {l.achternaam}
                  </span>
                  <span className="club-rij-sub">
                    {l.status === 'proef' ? 'Proeflid' : (l.abonnement ?? 'Lid')} · sinds {l.lidSinds ? dagKort(l.lidSinds) : 'onbekend'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function JarigVandaag({ jarigen, vestiging }: { jarigen: Jarige[]; vestiging: Vestiging }) {
  return (
    <section className="club-kaart club-kaart--vlak" aria-labelledby="vandaag-jarig">
      <header className="club-sectiekop">
        <h2 id="vandaag-jarig">Jarig vandaag</h2>
        <Cake aria-hidden size={18} className="club-vandaag-taart" />
      </header>
      {jarigen.length === 0 ? (
        <p className="club-leeg">Vandaag is er niemand jarig.</p>
      ) : (
        <ul className="club-lijst">
          {jarigen.map(({ lid, leeftijd }) => (
            <li key={lid.id}>
              <Link href={clubPad(`/leden/${lid.id}`, vestiging)} className="club-rij club-vandaag-rijlink">
                <span className="club-avatar" aria-hidden>
                  {initialen(lid)}
                </span>
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">
                    {lid.voornaam} {lid.achternaam}
                  </span>
                </span>
                {leeftijd !== null && <span className="club-chip club-chip--merk">{leeftijd} jaar</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
