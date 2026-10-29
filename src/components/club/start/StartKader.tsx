import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, Clock3 } from 'lucide-react'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { AANTAL_STAPPEN, aantalAf, minutenOver, minutenTekst, startPad, type StapStand } from '@/lib/club/start/stappen'
import { StapTitel } from './StapTitel'
import { HulpBijStap } from './HulpBijStap'
import { Proefperiode } from './Proefperiode'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { tekst as inTaal } from '@/lib/aiyourgym/taal/woordenboek'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Het kader om elke stap: grote kop, de teller, en de voortgang als een
// segment per stap dat je ook kunt aanklikken (elke stap is los te openen).

interface StartKaderProps {
  t: ClubToegang
  sportschool: string
  stand: readonly StapStand[]
  huidig: number
  vestiging: string | null
  intro: string
  /** Het kruimelpad naar Instellingen: alleen als de wizard af is (daarvoor is de rest van Club dicht). */
  kruimel?: boolean
  /** De eigenaar komt terug en gaat verder waar hij was. */
  welkomTerug?: boolean
  children: ReactNode
}

function segmentLabel(s: StapStand, huidig: number, taal: Taal): string {
  const k = inTaal(START, taal).kader
  const status = s.af ? k.af : k.open
  return `${k.segment(s.nummer, s.titel)}, ${status}${s.nummer === huidig ? `, ${k.hier}` : ''}`
}

export async function StartKader({ t, sportschool, stand, huidig, vestiging, intro, kruimel = false, welkomTerug = false, children }: StartKaderProps) {
  const taal = await getTaal()
  const k = (await clubTekst(START)).kader
  const stap = stand[huidig - 1]
  const af = aantalAf(stand)
  const over = minutenOver(stand)
  return (
    <div className="club-start">
      {kruimel && <InstelKruimel id="start" vestiging={vestiging} />}
      <header className="club-start-kop">
        <div className="club-start-kop-tekst">
          <p className="club-boventitel">
            {k.boven(sportschool, huidig, AANTAL_STAPPEN)}
          </p>
          <StapTitel titel={stap.titel} huidig={huidig} />
          <p className="club-start-intro">{intro}</p>
        </div>
        <div className="club-start-stand">
          <p className="club-start-teller" aria-label={k.tellerLabel(af, AANTAL_STAPPEN)}>
            <strong className="club-getal">{af}</strong>
            <span>{k.tellerVan(AANTAL_STAPPEN)}</span>
          </p>
          <p className="club-start-tijd">
            <Clock3 aria-hidden size={14} />
            <span>
              {minutenTekst(over, taal)}
              {!stap.af && over > stap.minuten && <span className="club-start-tijd-stap">{k.dezeStap(stap.minuten)}</span>}
            </span>
          </p>
          <Proefperiode t={t} />
        </div>
      </header>

      {welkomTerug && (
        <p className="club-start-welkom" role="status">
          <strong>{k.welkom}</strong> {k.welkomTekst}
        </p>
      )}

      <nav className="club-start-voortgang" aria-label={k.stappen}>
        <ol>
          {stand.map((s) => (
            <li key={s.sleutel} data-af={s.af || undefined} data-hier={s.nummer === huidig || undefined}>
              <Link href={startPad(s.nummer, vestiging)} aria-label={segmentLabel(s, huidig, taal)} aria-current={s.nummer === huidig ? 'step' : undefined} scroll={false}>
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
