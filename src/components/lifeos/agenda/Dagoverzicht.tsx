import { MapPin } from 'lucide-react'
import type { AfspraakJson, VrijBlokJson } from '@/lib/lifeos/agenda/agenda'
import { duurLabel, tijdLabel } from '@/lib/lifeos/datum/datum'
import { AgendaRooster } from './AgendaRooster'
import { PlanBlokKnop } from './PlanBlokKnop'

// Presentationeel: props erin, UI eruit. Geen fetch, geen state, geen klok —
// `loopt` komt van de container, want een component dat zelf `new Date()` leest
// rendert op de server anders dan in de browser.

interface DagoverzichtProps {
  volgende: AfspraakJson | null
  loopt: boolean
  /** Alle afspraken van de getoonde dag (voor het tijdrooster). */
  afspraken: AfspraakJson[]
  /** Dagsleutel (YYYY-MM-DD) van de getoonde dag — voor de "nu"-lijn in het rooster. */
  dag: string
  vrijeBlokken: VrijBlokJson[]
  /**
   * Plant een focusblok in dít blok. Weglaten = de blokken blijven puur
   * informatief (geen knop), bijvoorbeeld als de agenda nog aan het laden is.
   */
  onPlan?: (blok: VrijBlokJson) => Promise<{ ok: true } | { ok: false; fout: string }>
}

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  margin: '0 0 8px',
}

export function Dagoverzicht({
  volgende,
  loopt,
  afspraken,
  dag,
  vrijeBlokken,
  onPlan,
}: DagoverzichtProps) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <VolgendeAfspraak afspraak={volgende} loopt={loopt} />
      <AgendaRooster afspraken={afspraken} dag={dag} />
      <VrijeBlokkenLijst blokken={vrijeBlokken} onPlan={onPlan} />
    </div>
  )
}

function VolgendeAfspraak({ afspraak, loopt }: { afspraak: AfspraakJson | null; loopt: boolean }) {
  if (!afspraak) {
    return (
      <div>
        <p style={LABEL}>Hierna</p>
        <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>
          Niets meer op de agenda vandaag.
        </p>
      </div>
    )
  }

  const start = new Date(afspraak.startOp)
  const eind = afspraak.eindOp ? new Date(afspraak.eindOp) : null

  return (
    <div>
      <p style={LABEL}>{loopt ? 'Nu bezig' : 'Straks'}</p>
      {/* Hiërarchie via schaal: de tijd is het cijfer waar je op mikt, de titel
          leest daarna. Niet allebei even hard. */}
      <p
        className="os-cijfer"
        style={{
          fontSize: 30,
          lineHeight: 1,
          margin: '0 0 8px',
          color: loopt ? 'var(--brand)' : 'var(--text-1)',
        }}
      >
        {tijdLabel(start)}
        {eind ? (
          <span style={{ fontSize: 17, color: 'var(--text-4)' }}>{`–${tijdLabel(eind)}`}</span>
        ) : null}
      </p>
      <p style={{ fontSize: 15, color: 'var(--text-2)', margin: 0, fontWeight: 600 }}>
        {afspraak.titel ?? 'Afspraak zonder titel'}
      </p>
      {afspraak.locatie ? (
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: 'var(--text-4)',
            margin: '5px 0 0',
          }}
        >
          <MapPin size={12} strokeWidth={2.2} aria-hidden="true" />
          {afspraak.locatie}
        </p>
      ) : null}
    </div>
  )
}

function VrijeBlokkenLijst({
  blokken,
  onPlan,
}: {
  blokken: VrijBlokJson[]
  onPlan?: DagoverzichtProps['onPlan']
}) {
  return (
    <div>
      <p style={LABEL}>Vrije blokken</p>
      {blokken.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Geen blok van 45 minuten of meer tussen 08:00 en 20:00.
        </p>
      ) : (
        <ul style={{ display: 'grid', gap: 7, listStyle: 'none', padding: 0, margin: 0 }}>
          {blokken.map((blok) => (
            <li
              key={blok.startOp}
              style={{
                display: 'flex',
                // Wrapt op smal (320px): dan zakt de knop onder de tijd i.p.v.
                // ernaast te worden platgedrukt.
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '7px 8px 7px 11px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--bg-raised)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7 }}>
                <span className="os-cijfer" style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {`${tijdLabel(new Date(blok.startOp))}–${tijdLabel(new Date(blok.eindOp))}`}
                </span>
                <span style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>
                  {duurLabel(blok.minuten)}
                </span>
              </span>
              {onPlan ? <PlanBlokKnop blok={blok} onPlan={onPlan} /> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
