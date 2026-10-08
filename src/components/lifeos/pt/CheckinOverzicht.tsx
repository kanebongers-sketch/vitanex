import type { PinStatus } from '@/lib/lifeos/leads/leads'
import { CHECKIN_VRAGEN, ENERGIE_LABEL, momentLabel, weekLabel, type Checkin } from '@/lib/lifeos/pt-dashboard/checkin'

// "Voorbereiding van <naam>" bovenaan het coachgesprek: de weekcheck-in die de
// PT'er deze week op zijn dashboard (/<naam>/coach) invulde. Puur weergave.
// Zonder dashboard (geen link) tonen we niets: dan kon hij het ook niet invullen.

interface Props {
  naam: string
  checkin: Checkin | null
  /** De pincode-stand van zijn dashboard-link; null = geen dashboard. */
  pinStatus: PinStatus | null
}

const kaart: React.CSSProperties = {
  display: 'grid', gap: 8, padding: '10px 12px', borderRadius: 10,
  border: '1px solid color-mix(in srgb, var(--brand) 35%, var(--line))', background: 'var(--bg-raised)',
}
const kop: React.CSSProperties = { margin: 0, fontSize: 11.5, fontWeight: 600, color: 'var(--text-4)' }
const tekst: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }

export function CheckinOverzicht({ naam, checkin, pinStatus }: Props) {
  if (pinStatus === null) return null
  const voornaam = naam.split(' ')[0]
  const titel = `Voorbereiding van ${voornaam}`

  if (!checkin) {
    return (
      <section aria-label={titel} style={kaart}>
        <p style={kop}>{titel}</p>
        <p style={{ ...tekst, color: 'var(--text-3)' }}>
          {pinStatus === 'actief'
            ? `${voornaam} heeft deze week nog geen voorbereiding ingevuld.`
            : pinStatus === 'wacht'
              ? `${voornaam} kan de voorbereiding invullen zodra je de pincode hebt goedgekeurd.`
              : `${voornaam} gebruikt het PT-dashboard nog niet (nog geen pincode gekozen), dus er is geen voorbereiding.`}
        </p>
      </section>
    )
  }

  const antwoorden = CHECKIN_VRAGEN.filter((v) => checkin[v.veld] !== null)
  return (
    <section aria-label={titel} style={kaart}>
      <p style={kop}>
        {titel} · {weekLabel(checkin.week)} · ingevuld {momentLabel(checkin.bijgewerktOp)}
      </p>
      {checkin.energie ? (
        <p style={tekst}>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Energie:</span> {checkin.energie}/5 · {ENERGIE_LABEL[checkin.energie]}
        </p>
      ) : null}
      {antwoorden.length > 0 ? (
        <dl style={{ display: 'grid', gap: 6, margin: 0 }}>
          {antwoorden.map((v) => (
            <div key={v.veld} style={{ display: 'grid', gap: 1 }}>
              <dt style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{v.kort}</dt>
              <dd style={{ ...tekst, margin: 0 }}>{checkin[v.veld]}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
