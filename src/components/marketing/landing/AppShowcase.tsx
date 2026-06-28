'use client'

import { COLORS, FONT, MAXW } from '../theme'

const POINTS = [
  'Volledig anoniem en AVG-conform',
  'Zes vlakken van welzijn in één overzicht',
  'Gehost in de EU',
]

export default function AppShowcase() {
  return (
    <section style={{ fontFamily: FONT.grotesk, padding: '110px 0', borderTop: `1px solid ${COLORS.line}` }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'center' }}>
        {/* Tekst */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 16 }}>
            In de app
          </p>
          <h2 style={{ fontWeight: 700, fontSize: 'clamp(28px, 4.4vw, 48px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: COLORS.ink, margin: '0 0 20px' }}>
            Inzicht in één oogopslag.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: COLORS.inkDim, maxWidth: 460, marginBottom: 28 }}>
            Deelnemers checken in een paar tikken in. Teams zien geaggregeerde trends — rustig, helder en zonder ruis.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {POINTS.map((p) => (
              <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: COLORS.ink }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.cyanSoft, border: `1px solid ${COLORS.cyan}`, color: COLORS.cyan, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Mockup */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div aria-hidden style={{ position: 'absolute', inset: '8%', background: `radial-gradient(ellipse at center, ${COLORS.cyanSoft} 0%, transparent 65%)` }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/app-mockup.svg" alt="Voorbeeld van de MentaForce-app met dagelijkse check-in en weerbaarheidstrend" width={340} height={520} style={{ position: 'relative', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))' }} />
        </div>
      </div>
    </section>
  )
}
