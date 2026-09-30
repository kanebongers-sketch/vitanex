'use client'

import { useMemo, type CSSProperties } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { groepeerOpTijd } from '@/lib/lifeos/taken/tijdgroepen'
import type { Taak } from '@/lib/lifeos/taken/taken'
import { useTaken } from './useTaken'
import { SnelInvoer } from './SnelInvoer'

// Je to-do's, overzichtelijk op tijd: Te laat, Vandaag, Morgen, Deze week, Later,
// Ooit. Toevoegen is één regel ("morgen Ruben bellen #werk"); de categorie staat
// als klein label achter de taak. Afvinken met één tik. Hetzelfde snelle veld zit
// ook achter de +-knop op elke LifeOS-pagina (sneltoets n).

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

function vandaagSleutel(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dagLabel(sleutel: string): string {
  const [j, m, d] = sleutel.split('-').map(Number)
  return DAG.format(new Date(j, m - 1, d))
}

export function TakenApple() {
  const { staat, actieFout, opnieuw, vink } = useTaken()
  const groepen = useMemo(() => (staat.fase === 'ok' ? groepeerOpTijd(staat.taken, vandaagSleutel()) : []), [staat])
  const open = groepen.reduce((n, g) => n + g.taken.length, 0)

  return (
    <Kaart titel="To-do’s" vervangt="Apple Notes">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <SnelInvoer />
          {actieFout ? <Foutmelding bericht={actieFout} /> : null}

          {open === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>Geen open taken. Rustig.</p>
          ) : (
            groepen.map((g) => (
              <section key={g.sleutel} aria-label={g.kop} style={{ display: 'grid', gap: 2 }}>
                <p style={{ ...kopStijl, color: g.sleutel === 'te_laat' ? 'var(--brand)' : 'var(--text-4)' }}>
                  {g.kop} <span className="os-cijfer" style={{ fontWeight: 600 }}>· {g.taken.length}</span>
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid' }}>
                  {g.taken.map((t) => (
                    <TaakRegel key={t.id} taak={t} toonDag={g.sleutel === 'te_laat' || g.sleutel === 'deze_week' || g.sleutel === 'later'} onVink={() => vink(t)} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : null}
    </Kaart>
  )
}

function TaakRegel({ taak, toonDag, onVink }: { taak: Taak; toonDag: boolean; onVink: () => void }) {
  return (
    <li>
      <label style={rijStijl}>
        <input
          type="checkbox"
          checked={false}
          onChange={onVink}
          aria-label={`${taak.titel} afvinken`}
          style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0, accentColor: 'var(--brand)' }}
        />
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text-1)', lineHeight: 1.4 }}>{taak.titel}</span>
        {toonDag && taak.datum ? <span style={metaStijl}>{dagLabel(taak.datum)}</span> : null}
        {taak.categorie ? <span style={chipStijl}>{taak.categorie}</span> : null}
      </label>
    </li>
  )
}

const kopStijl: CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const rijStijl: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 9,
  padding: '7px 0',
  cursor: 'pointer',
  borderBottom: '1px solid var(--line)',
}

const metaStijl: CSSProperties = { flexShrink: 0, fontSize: 12, color: 'var(--text-3)', paddingTop: 1 }

const chipStijl: CSSProperties = {
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-2)',
  border: '1px solid var(--line-strong)',
  borderRadius: 999,
  padding: '1px 8px',
}

function Skelet() {
  return (
    <div aria-hidden style={{ display: 'grid', gap: 8 }}>
      <div style={{ height: 40, borderRadius: 10, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '40%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '70%', borderRadius: 4, background: 'var(--bg-raised)' }} />
    </div>
  )
}
