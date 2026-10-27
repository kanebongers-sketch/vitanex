import Link from 'next/link'
import { Cake } from 'lucide-react'
import type { Jarige, VandaagLid } from '@/lib/club/cijfers/vandaag'
import { aantal } from '@/lib/club/cijfers/opmaak'
import { dagKort } from '@/lib/club/cijfers/tijd'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { initialen } from '@/lib/club/kern/lid'

// Mensen om vandaag even aan te spreken: wie net begonnen is en wie jarig is.

export function NieuwDezeWeek({ leden, vestiging }: { leden: VandaagLid[]; vestiging: Vestiging }) {
  const proef = leden.filter((l) => l.status === 'proef').length
  return (
    <section className="club-kaart club-kaart--vlak club-vandaag-kaart" aria-labelledby="vandaag-nieuw">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-nieuw">Nieuw deze week</h2>
        <span>
          {aantal(leden.length - proef, 'nieuw lid', 'nieuwe leden')} · {aantal(proef, 'proeflid', 'proefleden')}
        </span>
      </header>
      {leden.length === 0 ? (
        <p className="club-leeg">Deze week nog geen nieuwe leden of proefleden.</p>
      ) : (
        <ul className="club-vandaag-gezichten">
          {leden.map((l) => (
            <li key={l.id}>
              <Link href={lidKaartPad(l.id, vestiging)} className="club-vandaag-gezicht">
                <span className="club-avatar" aria-hidden>
                  {initialen(l)}
                </span>
                <span className="club-rij-hoofd club-vandaag-gezicht-tekst">
                  <span className="club-rij-titel">
                    {l.voornaam} {l.achternaam}
                  </span>
                  <span className="club-rij-sub">{l.status === 'proef' ? 'Proeflid' : (l.abonnement ?? 'Lid')}</span>
                  <span className="club-rij-sub">Sinds {l.lidSinds ? dagKort(l.lidSinds) : 'onbekend'}</span>
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
    <section className="club-kaart club-kaart--vlak club-vandaag-kaart" aria-labelledby="vandaag-jarig">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-jarig">Jarig vandaag</h2>
        <Cake aria-hidden size={18} className="club-vandaag-taart" />
      </header>
      {jarigen.length === 0 ? (
        <p className="club-leeg">Vandaag is er niemand jarig.</p>
      ) : (
        <ul className="club-lijst club-vandaag-lijst">
          {jarigen.map(({ lid, leeftijd }) => (
            <li key={lid.id}>
              <Link href={lidKaartPad(lid.id, vestiging)} className="club-rij club-vandaag-rijlink">
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
