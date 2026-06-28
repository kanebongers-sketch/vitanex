'use client'

import { COLORS, FONT, MAXW, EASE } from '../theme'

interface Step { n: string; titel: string; body: string }

const STEPS: Step[] = [
  { n: '01', titel: 'Anoniem meten', body: 'Korte check-ins over de zes vlakken. Deelnemers blijven volledig anoniem.' },
  { n: '02', titel: 'Geaggregeerd inzicht', body: 'Resultaten worden samengevoegd op teamniveau — nooit herleidbaar naar een individu.' },
  { n: '03', titel: 'Op tijd handelen', body: 'Signalen worden zichtbaar en bespreekbaar, zodat je het gesprek vroeg kunt voeren.' },
]

export default function HowItWorks() {
  return (
    <section id="aanpak" style={{ fontFamily: FONT.grotesk, padding: '110px 0', borderTop: `1px solid ${COLORS.line}` }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 16 }}>
          Aanpak
        </p>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(28px, 4.4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: COLORS.ink, maxWidth: 640, margin: '0 0 56px' }}>
          Van check-in tot gesprek.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, borderTop: `1px solid ${COLORS.line}` }}>
          {STEPS.map((s, i) => (
            <div key={s.n}
              style={{
                padding: '36px 28px',
                borderLeft: i > 0 ? `1px solid ${COLORS.line}` : 'none',
                transition: `background .25s ${EASE}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: COLORS.cyan, opacity: 0.85 }}>{s.n}</span>
              <h3 style={{ fontWeight: 600, fontSize: 21, letterSpacing: '-0.02em', color: COLORS.ink, margin: '18px 0 10px' }}>{s.titel}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
