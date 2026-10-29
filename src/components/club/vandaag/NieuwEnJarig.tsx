import Link from 'next/link'
import { Cake } from 'lucide-react'
import type { Jarige, VandaagLid } from '@/lib/club/cijfers/vandaag'
import { dagKort } from '@/lib/club/cijfers/tijd'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import { initialen } from '@/lib/club/kern/lid'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

// Mensen om vandaag even aan te spreken: wie net begonnen is en wie jarig is.

export async function NieuwDezeWeek({ leden, vestiging }: { leden: VandaagLid[]; vestiging: Vestiging }) {
  const taal = await getTaal()
  const t = VANDAAG[taal].nieuw
  const proef = leden.filter((l) => l.status === 'proef').length
  return (
    <section className="club-kaart club-kaart--vlak club-vandaag-kaart" aria-labelledby="vandaag-nieuw">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-nieuw">{t.titel}</h2>
        <span>
          {t.telling(leden.length - proef, proef)}
        </span>
      </header>
      {leden.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
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
                  <span className="club-rij-sub">{l.status === 'proef' ? t.proeflid : (l.abonnement ?? t.lid)}</span>
                  <span className="club-rij-sub">{t.sinds(l.lidSinds ? dagKort(l.lidSinds, taal) : t.onbekend)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function JarigVandaag({ jarigen, vestiging }: { jarigen: Jarige[]; vestiging: Vestiging }) {
  const t = VANDAAG[await getTaal()].jarig
  return (
    <section className="club-kaart club-kaart--vlak club-vandaag-kaart" aria-labelledby="vandaag-jarig">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-jarig">{t.titel}</h2>
        <Cake aria-hidden size={18} className="club-vandaag-taart" />
      </header>
      {jarigen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
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
                {leeftijd !== null && <span className="club-chip club-chip--merk">{t.jaar(leeftijd)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
