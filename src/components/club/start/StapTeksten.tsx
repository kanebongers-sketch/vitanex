import Link from 'next/link'
import { ArrowRight, Check, Circle, Eye, LifeBuoy } from 'lucide-react'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import { demoInlezen, type DemoUitkomst } from '@/lib/club/start/demo-leden'
import { eersteDagStand, type EersteDagPunt } from '@/lib/club/start/eerste-dag'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Leden inlezen (het echte inlezen staat in de stap zelf, met een voorbeeld
// dat niets opslaat) en "Klaar voor je eerste dag". De introductie per stap
// staat in het woordenboek (START.intro). Niets hier belooft meer dan Club doet.

const UITKOMST_CHIP: Record<DemoUitkomst, string> = {
  nieuw: 'club-chip--ok',
  bijwerken: 'club-chip--info',
  gelijk: 'club-chip--uit',
  dubbel: 'club-chip--info',
  fout: 'club-chip--let-op',
}

async function DemoLeden({ vandaag }: { vandaag: string }) {
  const taal = await getTaal()
  const d = (await clubTekst(START)).demo
  const demo = demoInlezen(vandaag, undefined, taal)
  return (
    <section className="club-start-blok club-start-demo" aria-labelledby="start-demo-kop">
      <h2 id="start-demo-kop">
        <Eye aria-hidden size={18} /> {d.kop}
      </h2>
      <p className="club-hint">
        {d.bestand(demo.rijen.length)} <strong>{d.nietsOpgeslagen}</strong>
      </p>
      <p className="club-start-demo-herkend">
        <span className="club-zacht">{d.herkend}</span> {demo.herkend.join(', ')}
      </p>
      <ul className="club-start-demo-rijen" role="list">
        {demo.rijen.map((r) => (
          <li key={r.regel}>
            <span className="club-start-demo-regel club-getal">{r.regel}</span>
            <span className="club-start-demo-naam">
              <strong>{r.naam}</strong>
              {r.melding && <span className="club-zacht">{r.melding}</span>}
            </span>
            <span className={`club-chip ${UITKOMST_CHIP[r.uitkomst]}`}>{d.uitkomst[r.uitkomst]}</span>
          </li>
        ))}
      </ul>
      <p className="club-start-demo-som">
        {d.somVoor} <strong>{d.somNieuw(demo.telling.nieuw)}</strong>{d.somRest(demo.telling.dubbel, demo.telling.fout)}
      </p>
    </section>
  )
}

interface StapLedenProps {
  vestiging: string
  vestigingLabel: string
  /** De volgende stap, voor de knop na het inlezen. */
  verderPad: string
  vandaag: string
}

export async function StapLedenInlezen({ vestiging, vestigingLabel, verderPad, vandaag }: StapLedenProps) {
  const t = (await clubTekst(START)).inlezen
  return (
    <div className="club-start-twee">
      <div className="club-start-stapel club-start-inlezen">
        <section className="club-start-blok" aria-labelledby="start-inlezen-kop">
          <h2 id="start-inlezen-kop">{t.kop}</h2>
          <ol className="club-start-genummerd">
            <li>{t.stap1}</li>
            <li>{t.stap2}</li>
            <li>{t.stap3}</li>
          </ol>
          <p className="club-hint">{t.zonder}</p>
        </section>
        <LedenImport vestiging={vestiging} vestigingLabel={vestigingLabel} terugNaarStart={verderPad} />
      </div>
      <DemoLeden vandaag={vandaag} />
    </div>
  )
}

interface StapKlaarProps {
  punten: readonly EersteDagPunt[]
}

function PuntStatus({ af }: { af: boolean | null }) {
  if (af === true) return <Check aria-hidden size={14} strokeWidth={3} />
  return <Circle aria-hidden size={10} strokeWidth={2.5} />
}

/** De checklist voor dag 1; wat in de wizard nog open staat, staat al bovenaan bij Live. */
export async function StapKlaar({ punten }: StapKlaarProps) {
  const { af, meetbaar } = eersteDagStand(punten)
  const t = (await clubTekst(START)).eersteDag
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-eerste-kop">
        <div className="club-start-blokkop">
          <h2 id="start-eerste-kop">{t.kop}</h2>
          <span className="club-chip club-chip--merk">
            {t.stand(af, meetbaar)}
          </span>
        </div>
        <ul className="club-start-eerste" role="list">
          {punten.map((p) => (
            <li key={p.id} data-af={p.af === true || undefined}>
              <span className="club-start-bol" aria-hidden>
                <PuntStatus af={p.af} />
              </span>
              <span className="club-start-eerste-tekst">
                <strong>{p.titel}</strong>
                <span className="club-zacht">{p.uitleg}</span>
              </span>
              {p.pad ? (
                <Link href={p.pad} className="club-knop club-knop--klein" aria-label={t.label(p.titel, (p.af === true ? t.aanpassen : t.nuDoen).toLowerCase())}>
                  {p.af === true ? t.aanpassen : t.nuDoen} <ArrowRight aria-hidden size={14} />
                </Link>
              ) : (
                <span className="club-chip club-chip--uit">{t.naAfronden}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
      <div className="club-start-stapel">
        <section className="club-start-blok club-start-hulp" aria-labelledby="start-hulp-kop">
          <LifeBuoy aria-hidden size={28} />
          <h2 id="start-hulp-kop">{t.hulpKop}</h2>
          <p>{t.hulpTekst}</p>
          <Link href="/club/hulp" className="club-knop">
            {t.hulpKnop}
          </Link>
        </section>
      </div>
    </div>
  )
}
