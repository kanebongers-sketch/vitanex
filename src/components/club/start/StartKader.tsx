import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, Clock3 } from 'lucide-react'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { AANTAL_STAPPEN, aantalAf, minutenOver, minutenTekst, startPad, type StapStand } from '@/lib/club/start/stappen'
import { StapTitel } from './StapTitel'
import { HulpBijStap } from './HulpBijStap'
import { Proefperiode } from './Proefperiode'
import type { ClubToegang } from '@/lib/club/toegang'

// Het kader om elke stap: grote kop, de teller, en de voortgang als een
// segment per stap dat je ook kunt aanklikken (elke stap is los te openen).

interface StartKaderProps {
  t: ClubToegang
  sportschool: string
  stand: readonly StapStand[]
  huidig: number
  vestiging: string | null
  intro: string
  /** De eigenaar komt terug en gaat verder waar hij was. */
  welkomTerug?: boolean
  children: ReactNode
}

function segmentLabel(s: StapStand, huidig: number): string {
  const status = s.af ? 'af' : 'open'
  return `Stap ${s.nummer}: ${s.titel}, ${status}${s.nummer === huidig ? ', hier ben je' : ''}`
}

export function StartKader({ t, sportschool, stand, huidig, vestiging, intro, welkomTerug = false, children }: StartKaderProps) {
  const stap = stand[huidig - 1]
  const af = aantalAf(stand)
  const over = minutenOver(stand)
  return (
    <div className="club-start">
      <InstelKruimel id="start" vestiging={vestiging} />
      <header className="club-start-kop">
        <div className="club-start-kop-tekst">
          <p className="club-boventitel">
            Startwizard · {sportschool} · stap {huidig} van {AANTAL_STAPPEN}
          </p>
          <StapTitel titel={stap.titel} huidig={huidig} />
          <p className="club-start-intro">{intro}</p>
        </div>
        <div className="club-start-stand">
          <p className="club-start-teller" aria-label={`${af} van ${AANTAL_STAPPEN} stappen af`}>
            <strong className="club-getal">{af}</strong>
            <span>van {AANTAL_STAPPEN} af</span>
          </p>
          <p className="club-start-tijd">
            <Clock3 aria-hidden size={14} />
            <span>
              {minutenTekst(over)}
              {!stap.af && over > stap.minuten && <span className="club-start-tijd-stap"> · deze stap {stap.minuten === 1 ? 'een minuut' : `${stap.minuten} minuten`}</span>}
            </span>
          </p>
          <Proefperiode t={t} />
        </div>
      </header>

      {welkomTerug && (
        <p className="club-start-welkom" role="status">
          <strong>Welkom terug.</strong> Je gaat verder waar je was gebleven. Wat je eerder deed staat er nog.
        </p>
      )}

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
      <HulpBijStap key={huidig} stap={huidig} />
    </div>
  )
}
