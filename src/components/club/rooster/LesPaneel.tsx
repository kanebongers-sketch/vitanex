'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { LesDetail } from '@/lib/club/rooster/lesbeheer-opslag'
import { SOORT_LABEL } from '@/lib/club/rooster/typen'
import { Bezetting } from './LesBlok'
import { Afmeldingen, DeelnemerLijst, Wachtlijst } from './Deelnemers'
import { LesBeheer } from './LesBeheer'
import { LidToevoegen } from './LidToevoegen'

// Het zijpaneel van een les: wie komt er, wie wacht, proefleden, iemand
// toevoegen, afvinken en de les zelf aanpassen. Open via ?les=<id> in de URL;
// Escape of klikken naast het paneel sluit het.

interface Optie {
  id: string
  naam: string
}

interface Props {
  detail: LesDetail
  sluitHref: string
  vestiging: string
  /** "Dinsdag 20 oktober · 19:00 tot 19:45" */
  wanneer: string
  isBegonnen: boolean
  kanAfvinken: boolean
  zalen: Optie[]
  instructeurs: Optie[]
}

function Sectie({ titel, aantal, children }: { titel: string; aantal?: number; children: ReactNode }) {
  return (
    <section className="club-rooster-sectie">
      <h3>
        {titel}
        {aantal !== undefined && <span className="club-getal">{aantal}</span>}
      </h3>
      {children}
    </section>
  )
}

export function LesPaneel({ detail, sluitHref, vestiging, wanneer, isBegonnen, kanAfvinken, zalen, instructeurs }: Props) {
  const router = useRouter()
  const sluitKnop = useRef<HTMLAnchorElement>(null)
  const { les, deelnemers, wachtlijst, geannuleerd, proefleden } = detail
  const kanBoeken = !les.geannuleerd && !isBegonnen

  useEffect(() => {
    sluitKnop.current?.focus()
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(sluitHref, { scroll: false })
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [router, sluitHref])

  return (
    <div className="club-paneel-scherm" onClick={(e) => e.target === e.currentTarget && router.push(sluitHref, { scroll: false })}>
      <aside className="club-paneel club-rooster-paneel" role="dialog" aria-modal="true" aria-labelledby="club-rooster-paneel-titel" data-soort={les.lestype?.soort ?? 'overig'}>
        <header className="club-rooster-paneelkop">
          <div>
            <p className="club-boventitel">{les.lestype ? SOORT_LABEL[les.lestype.soort] : 'Les'}</p>
            <h2 id="club-rooster-paneel-titel">{les.lestype?.naam ?? 'Les'}</h2>
            <p className="club-rooster-paneel-wanneer">{wanneer}</p>
            <p className="club-zacht">{[les.instructeur?.naam ?? 'Instructeur nog niet bekend', les.zaal?.naam].filter(Boolean).join(' · ')}</p>
          </div>
          <Link ref={sluitKnop} href={sluitHref} scroll={false} className="club-knop club-knop--stil" aria-label="Paneel sluiten">
            <X aria-hidden size={18} />
          </Link>
        </header>

        {les.geannuleerd ? (
          <p className="club-melding club-melding--fout">Deze les gaat niet door{les.annuleerReden ? `: ${les.annuleerReden}` : '.'}</p>
        ) : (
          <div className="club-rooster-paneel-bezetting">
            <span className="club-rooster-groot club-getal">
              {les.geboekt}
              <span>/{les.capaciteit}</span>
            </span>
            <Bezetting les={les} />
          </div>
        )}

        <Sectie titel="Deelnemers" aantal={deelnemers.length}>
          {kanAfvinken && <p className="club-hint">Vink af wie er is. Nog een keer klikken zet het terug.</p>}
          <DeelnemerLijst deelnemers={deelnemers} kanAfvinken={kanAfvinken && !les.geannuleerd} kanAnnuleren={kanBoeken} />
        </Sectie>

        {proefleden.length > 0 && (
          <Sectie titel="Proefleden" aantal={proefleden.length}>
            <ul className="club-lijst">
              {proefleden.map((p) => (
                <li key={p.id} className="club-rij">
                  <span className="club-rij-hoofd">
                    <span className="club-rij-titel">{p.naam}</span>
                  </span>
                  <span className="club-chip club-chip--info">Proefles</span>
                </li>
              ))}
            </ul>
          </Sectie>
        )}

        <Sectie titel="Wachtlijst" aantal={wachtlijst.length}>
          <Wachtlijst wachtlijst={wachtlijst} kanAnnuleren={kanBoeken} />
        </Sectie>

        {kanBoeken && <LidToevoegen lesId={les.id} vestiging={vestiging} isVol={les.geboekt >= les.capaciteit} />}
        <Afmeldingen geannuleerd={geannuleerd} />
        {kanBoeken && <LesBeheer les={les} zalen={zalen} instructeurs={instructeurs} />}
      </aside>
    </div>
  )
}
