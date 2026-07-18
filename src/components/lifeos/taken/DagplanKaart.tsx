'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CalendarClock, CircleHelp } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { luisterOpWijziging } from '@/lib/lifeos/events'
import { duurLabel, tijdLabel } from '@/lib/lifeos/datum/datum'
import {
  leesDagplanAntwoord,
  type DagplanJson,
  type InplanningJson,
  type NietGeplaatstJson,
} from '@/lib/lifeos/taken/dagplan'

// Je taken op je agenda: welke taak in welk gat.
//
// Gemount bovenaan de "Mijn dag"-zone in de cockpit — het advies staat boven het
// gereedschap (de takenlijst eronder).
//
// ─── DE KAART TOONT WAT ER NIET IN PAST ─────────────────────────────────────
//
//   Een plan dat alleen laat zien wat past, verzwijgt precies de taken waar je
//   iets aan moet doen: die zonder tijdsinschatting. Daarom staat "past niet"
//   hier even groot als "past wel", met de reden erbij.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; plan: DagplanJson }

export function DagplanKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  // Zelfde generatieteller als in `useTaken`: een vlucht die bij unmount nog
  // loopt mag niets meer zetten.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/lifeos/taken/dagplan', leesDagplanAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok ? { fase: 'ok', plan: uitkomst.waarde } : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zie `useTaken`. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  // Herlaad zodra een taak elders wijzigt (toevoegen/afvinken/wijzigen/verwijderen):
  // het dagplan rekent met dezelfde taken en zou anders achterlopen — een taak
  // zonder tijdsinschatting past ineens wél zodra je die invult. Deze kaart schrijft
  // zelf geen taken, dus de melding kan geen herlaad-lus met zichzelf vormen.
  // `luisterOpWijziging` geeft de opzeg-functie terug; die is meteen de cleanup.
  useEffect(() => luisterOpWijziging('taken', () => void laad()), [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <Kaart titel="Je dag" vervangt="Motion · Sunsama">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? <Plan plan={staat.plan} /> : null}
    </Kaart>
  )
}

function Plan({ plan }: { plan: DagplanJson }) {
  // Niet gekoppeld is geen leeg plan: zonder agenda weten we niet welke tijd je
  // vrij hebt, en dan is "geen ruimte" net zo goed een leugen als "de hele dag
  // vrij".
  if (!plan.gekoppeld) {
    return (
      <NogNiets
        wat="Geen agenda gekoppeld"
        waarom="Zonder je agenda weet ik niet welke tijd je vrij hebt — en dan is elk plan een gok."
      />
    )
  }

  const nietsGepland = plan.inplanningen.length === 0
  const nietsTeMelden = plan.nietGeplaatst.length === 0

  if (nietsGepland && nietsTeMelden) {
    return (
      <NogNiets
        wat="Niets te plannen"
        waarom="Je hebt geen open taken die vandaag aan de beurt zijn."
      />
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {nietsGepland ? (
        <p style={LEEG}>Geen enkele taak paste in je dag. Hieronder staat waarom.</p>
      ) : (
        <section>
          <h3 style={KOP}>
            Ingepland
            <span className="os-cijfer" style={TELLER}>
              {plan.inplanningen.length}
            </span>
          </h3>
          <ul style={LIJST}>
            {plan.inplanningen.map((i) => (
              <PlanRij key={i.taak.id} inplanning={i} />
            ))}
          </ul>
          <p style={NOOT}>
            {plan.restMinuten > 0
              ? `${duurLabel(plan.restMinuten)} vrije ruimte over.`
              : 'Je vrije ruimte is vol.'}
          </p>
        </section>
      )}

      {nietsTeMelden ? null : (
        <section>
          <h3 style={KOP}>
            Past niet
            <span className="os-cijfer" style={TELLER}>
              {plan.nietGeplaatst.length}
            </span>
          </h3>
          <ul style={LIJST}>
            {plan.nietGeplaatst.map((n) => (
              <RestRij key={n.taak.id} niet={n} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function PlanRij({ inplanning }: { inplanning: InplanningJson }) {
  const start = new Date(inplanning.startOp)
  const eind = new Date(inplanning.eindOp)

  return (
    <li style={RIJ}>
      <span className="os-cijfer" style={TIJD}>
        {tijdLabel(start)}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 2 }}>
        <span style={{ ...TITEL, color: 'var(--text-1)' }}>
          {inplanning.isTop3 ? (
            <span style={{ color: 'var(--brand)', marginRight: 6 }}>Top 3</span>
          ) : null}
          {inplanning.taak.titel}
        </span>
        <span style={META}>
          {tijdLabel(start)}–{tijdLabel(eind)} · {inplanning.redenen.slice(0, 2).join(' · ')}
        </span>
      </span>
    </li>
  )
}

function RestRij({ niet }: { niet: NietGeplaatstJson }) {
  // Eén icoon, geen kleurcodering per reden: "je hebt geen tijd" en "ik weet de
  // duur niet" zijn allebei gewoon informatie, geen alarm.
  return (
    <li style={RIJ}>
      {niet.reden === 'geen-inspanning' ? (
        <CircleHelp size={14} strokeWidth={2} aria-hidden="true" style={ICON} />
      ) : (
        <CalendarClock size={14} strokeWidth={2} aria-hidden="true" style={ICON} />
      )}
      <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 2 }}>
        <span style={{ ...TITEL, color: 'var(--text-2)' }}>{niet.taak.titel}</span>
        <span style={META}>{niet.uitleg}</span>
      </span>
    </li>
  )
}

const KOP: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  margin: '0 0 4px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}

const TELLER: CSSProperties = { color: 'var(--text-4)', fontWeight: 600 }

const LIJST: CSSProperties = { listStyle: 'none', padding: 0, margin: 0 }

const RIJ: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '9px 0',
  borderTop: '1px solid var(--line)',
}

const TIJD: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--brand)',
  width: 40,
  marginTop: 2,
  flexShrink: 0,
}

const ICON: CSSProperties = { color: 'var(--text-4)', marginTop: 3, flexShrink: 0 }

const TITEL: CSSProperties = { fontSize: 14, lineHeight: 1.4, overflowWrap: 'anywhere' }

const META: CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.4,
  color: 'var(--text-3)',
  overflowWrap: 'anywhere',
}

const NOOT: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

const LEEG: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[62, 48, 70].map((breedte) => (
        <div
          key={breedte}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
