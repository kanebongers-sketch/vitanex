'use client'

import { COLORS, FONT, MAXW, EASE } from '../theme'

interface Pillar { naam: string; zin: string }

const PILLARS: Pillar[] = [
  { naam: 'Energie', zin: 'Dagelijkse vitaliteit en herstel inzichtelijk.' },
  { naam: 'Slaap', zin: 'Slaapkwaliteit en herstel, nacht na nacht.' },
  { naam: 'Stress', zin: 'Vroege signalen van overbelasting, bespreekbaar gemaakt.' },
  { naam: 'Stemming', zin: 'Mentaal welzijn en motivatie, zonder ongemakkelijk gesprek.' },
  { naam: 'Beweging', zin: 'Lichamelijke activiteit die energie en focus voedt.' },
  { naam: 'Voeding', zin: 'Voeding en hydratatie als fundament van weerbaarheid.' },
]

export default function Pillars() {
  return (
    <section id="pijlers" style={{ fontFamily: FONT.grotesk, padding: '110px 0', borderTop: `1px solid ${COLORS.line}` }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 16 }}>
          De zes vlakken
        </p>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(28px, 4.4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: COLORS.ink, maxWidth: 640, margin: '0 0 56px' }}>
          Welzijn, opgebouwd uit zes vlakken.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PILLARS.map((p, i) => (
            <article key={p.naam}
              style={{
                background: COLORS.navyElev, border: `1px solid ${COLORS.line}`, borderRadius: 18,
                padding: '28px 26px', transition: `transform .25s ${EASE}, border-color .25s ${EASE}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = COLORS.cyan }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = COLORS.line }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: COLORS.cyan }}>0{i + 1}</span>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.cyan, opacity: 0.5 }} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: COLORS.ink, margin: '0 0 10px' }}>{p.naam}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>{p.zin}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
