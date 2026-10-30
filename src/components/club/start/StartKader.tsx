import type { ReactNode } from 'react'
import Link from 'next/link'
import { Check, Clock3 } from 'lucide-react'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { aantalAf, minutenOver, minutenTekst, nodigeStappen, startPad, type StapStand } from '@/lib/club/start/stappen'
import { StapTitel } from './StapTitel'
import { HulpBijStap } from './HulpBijStap'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { tekst as inTaal } from '@/lib/aiyourgym/taal/woordenboek'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Het kader om elke stap: grote kop, de teller, en de voortgang als een
// segment per stap dat je ook kunt aanklikken (elke stap is los te openen).

interface StartKaderProps {
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

function segmentLabel(s: StapStand, nr: number, huidig: number, taal: Taal): string {
  const k = inTaal(START, taal).kader
  const status = s.af ? k.af : k.open
  return `${k.segment(nr, s.titel)}, ${status}${s.nummer === huidig ? `, ${k.hier}` : ''}`
}

export async function StartKader({ sportschool, stand, huidig, vestiging, intro, kruimel = false, welkomTerug = false, children }: StartKaderProps) {
  const taal = await getTaal()
  const k = (await clubTekst(START)).kader
  const stap = stand[huidig - 1]
  // Alleen de stappen van de afgenomen pakketten (en de kern), opnieuw genummerd.
  const lijst = nodigeStappen(stand)
  const totaal = lijst.length
  const hierNr = Math.max(1, lijst.findIndex((s) => s.nummer === huidig) + 1)
  const af = aantalAf(lijst)
  const over = minutenOver(lijst)
  return (
    <div className="club-start">
      {kruimel && <InstelKruimel id="start" vestiging={vestiging} />}
      <header className="club-start-kop">
        <div className="club-start-kop-tekst">
          <p className="club-boventitel">
            {k.boven(sportschool, hierNr, totaal)}
          </p>
          <StapTitel titel={stap.titel} huidig={hierNr} />
          <p className="club-start-intro">{intro}</p>
        </div>
        <div className="club-start-stand">
          <p className="club-start-teller" aria-label={k.tellerLabel(af, totaal)}>
            <strong className="club-getal">{af}</strong>
            <span>{k.tellerVan(totaal)}</span>
          </p>
          <p className="club-start-tijd">
            <Clock3 aria-hidden size={14} />
            <span>
              {minutenTekst(over, taal)}
              {!stap.af && over > stap.minuten && <span className="club-start-tijd-stap">{k.dezeStap(stap.minuten)}</span>}
            </span>
          </p>
        </div>
      </header>

      {welkomTerug && (
        <p className="club-start-welkom" role="status">
          <strong>{k.welkom}</strong> {k.welkomTekst}
        </p>
      )}

      <nav className="club-start-voortgang" aria-label={k.stappen}>
        <ol>
          {lijst.map((s, i) => (
            <li key={s.sleutel} data-af={s.af || undefined} data-hier={s.nummer === huidig || undefined}>
              <Link href={startPad(s.nummer, vestiging)} aria-label={segmentLabel(s, i + 1, huidig, taal)} aria-current={s.nummer === huidig ? 'step' : undefined} scroll={false}>
                <span className="club-start-balk" aria-hidden />
                <span className="club-start-stapnaam" aria-hidden>
                  <span className="club-start-bol">{s.af ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
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
