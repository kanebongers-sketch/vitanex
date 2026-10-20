import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { AANTAL_STAPPEN, aantalAf, startPad, type StapStand } from '@/lib/club/start/stappen'

// Het kader om elke stap: grote kop, de teller, en de voortgang als een
// segment per stap dat je ook kunt aanklikken (elke stap is los te openen).

interface StartKaderProps {
  sportschool: string
  stand: readonly StapStand[]
  huidig: number
  vestiging: string | null
  intro: string
  children: ReactNode
}

function segmentLabel(s: StapStand, huidig: number): string {
  const status = s.af ? 'af' : 'open'
  return `Stap ${s.nummer}: ${s.titel}, ${status}${s.nummer === huidig ? ', hier ben je' : ''}`
}

export function StartKader({ sportschool, stand, huidig, vestiging, intro, children }: StartKaderProps) {
  const stap = stand[huidig - 1]
  const af = aantalAf(stand)
  return (
    <div className="club-start">
      <InstelKruimel id="start" vestiging={vestiging} />
      <header className="club-start-kop">
        <div className="club-start-kop-tekst">
          <p className="club-boventitel">
            Startwizard · {sportschool} · stap {huidig} van {AANTAL_STAPPEN}
          </p>
          <h1>{stap.titel}</h1>
          <p className="club-start-intro">{intro}</p>
        </div>
        <p className="club-start-teller" aria-label={`${af} van ${AANTAL_STAPPEN} stappen af`}>
          <strong className="club-getal">{af}</strong>
          <span>van {AANTAL_STAPPEN} af</span>
        </p>
      </header>

      <nav className="club-start-voortgang" aria-label="Stappen van de startwizard">
        <ol>
          {stand.map((s) => (
            <li key={s.sleutel} data-af={s.af || undefined} data-hier={s.nummer === huidig || undefined}>
              <Link href={startPad(s.nummer, vestiging)} aria-label={segmentLabel(s, huidig)} aria-current={s.nummer === huidig ? 'step' : undefined} scroll={false}>
                <span className="club-start-balk" aria-hidden />
                <span className="club-start-stapnaam" aria-hidden>
                  <span className="club-start-bol">{s.af ? <Check size={12} strokeWidth={3} /> : s.nummer}</span>
                  <span className="club-start-staptitel">{s.titel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="club-start-vlak">{children}</div>
    </div>
  )
}
