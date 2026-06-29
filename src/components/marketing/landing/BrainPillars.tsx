'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { COLORS, FONT, MAXW, EASE, BRAIN_COLORS } from '../theme'

const BrainCanvas = dynamic(() => import('../BrainCanvas'), { ssr: false, loading: () => null })

interface Pillar { naam: string; zin: string }

// Volgorde matcht de breindelen: index 0-2 = linker hemisfeer (voor/midden/achter),
// 3-5 = rechter hemisfeer. Zo staan de linker pijlers bij de linker hersendelen.
const PILLARS: Pillar[] = [
  { naam: 'Energie', zin: 'Dagelijkse vitaliteit en herstel inzichtelijk.' },
  { naam: 'Slaap', zin: 'Slaapkwaliteit en herstel, nacht na nacht.' },
  { naam: 'Stress', zin: 'Vroege signalen van overbelasting, bespreekbaar gemaakt.' },
  { naam: 'Stemming', zin: 'Mentaal welzijn en motivatie, zonder ongemakkelijk gesprek.' },
  { naam: 'Beweging', zin: 'Lichamelijke activiteit die energie en focus voedt.' },
  { naam: 'Voeding', zin: 'Voeding en hydratatie als fundament van weerbaarheid.' },
]

function PillarCard({ p, i, active, onActivate }: { p: Pillar; i: number; active: boolean; onActivate: (i: number) => void }) {
  return (
    <button
      type="button"
      onMouseEnter={() => onActivate(i)}
      onFocus={() => onActivate(i)}
      onClick={() => onActivate(i)}
      aria-pressed={active}
      style={{
        textAlign: 'left', cursor: 'pointer', width: '100%',
        background: active ? 'rgba(0,229,255,0.06)' : COLORS.navyElev,
        border: `1px solid ${active ? COLORS.cyan : COLORS.line}`,
        borderRadius: 16, padding: '16px 18px',
        transition: `border-color .25s ${EASE}, transform .25s ${EASE}, background .25s ${EASE}`,
        transform: active ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{
          width: 11, height: 11, borderRadius: '50%', background: BRAIN_COLORS[i], flexShrink: 0,
          boxShadow: active ? `0 0 10px ${BRAIN_COLORS[i]}` : 'none',
          transition: `box-shadow .25s ${EASE}`,
        }} />
        <span style={{ fontFamily: FONT.grotesk, fontWeight: 600, fontSize: 16, color: COLORS.ink }}>{p.naam}</span>
        <span style={{ marginLeft: 'auto', fontFamily: FONT.grotesk, fontSize: 12, fontWeight: 600, color: active ? COLORS.cyan : COLORS.inkFaint }}>0{i + 1}</span>
      </div>
      <p style={{ fontFamily: FONT.grotesk, fontSize: 13, lineHeight: 1.5, color: COLORS.inkDim, margin: 0 }}>{p.zin}</p>
    </button>
  )
}

export default function BrainPillars() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section id="brein" style={{ fontFamily: FONT.grotesk, padding: '100px 0', borderTop: `1px solid ${COLORS.line}` }}>
      <style>{`
        .bp-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: center; }
        .bp-brain { order: -1; min-height: 320px; height: 70vw; max-height: 420px; }
        .bp-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        @media (min-width: 920px) {
          .bp-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr); gap: 28px; }
          .bp-brain { order: 0; height: 520px; }
        }
      `}</style>

      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 16 }}>
          De zes vlakken
        </p>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(28px, 4.4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: COLORS.ink, maxWidth: 680, margin: '0 0 14px' }}>
          Eén brein, zes vlakken.
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: COLORS.inkDim, maxWidth: 520, margin: '0 0 48px' }}>
          Beweeg over een vlak — of over het brein zelf — om te zien wat MentaForce meet.
        </p>

        <div className="bp-grid">
          <div className="bp-col">
            {PILLARS.slice(0, 3).map((p, idx) => (
              <PillarCard key={p.naam} p={p} i={idx} active={active === idx} onActivate={setActive} />
            ))}
          </div>

          <div className="bp-brain">
            <BrainCanvas activeRegion={active} onRegionChange={setActive} />
          </div>

          <div className="bp-col">
            {PILLARS.slice(3, 6).map((p, idx) => (
              <PillarCard key={p.naam} p={p} i={idx + 3} active={active === idx + 3} onActivate={setActive} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
