'use client'

import Link from 'next/link'
import { COLORS, FONT, MAXW } from '../theme'

type Item = [string, string]
interface Col { titel: string; items: Item[] }

const COLS: Col[] = [
  { titel: 'Product', items: [['#brein', 'Het brein'], ['#brein', 'De 6 vlakken'], ['#aanpak', 'Aanpak']] },
  { titel: 'Bedrijf', items: [['/contact', 'Contact'], ['/voorwaarden', 'Voorwaarden']] },
  { titel: 'Juridisch', items: [['/voorwaarden', 'Privacy'], ['/voorwaarden', 'AVG'], ['/voorwaarden', 'Voorwaarden']] },
]

export default function Footer() {
  return (
    <footer style={{ fontFamily: FONT.grotesk, borderTop: `1px solid ${COLORS.line}`, background: COLORS.navyDeep }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '64px 28px 32px' }}>
        <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap', marginBottom: 48 }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.cyan, boxShadow: `0 0 12px ${COLORS.cyanGlow}` }} />
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.14em', color: COLORS.ink }}>MENTAFORCE</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.inkFaint, maxWidth: 260 }}>
              Welzijn op de werkplek, anoniem en meetbaar over zes vlakken.
            </p>
            <p style={{ fontSize: 12, color: COLORS.inkFaint, marginTop: 12 }}>AVG-conform · EU-hosting · Gemaakt in Nederland</p>
          </div>

          {COLS.map((col) => (
            <div key={col.titel}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: 16 }}>{col.titel}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map(([href, label]) => (
                  href.startsWith('#')
                    ? <a key={label + href} href={href} style={{ fontSize: 14, color: COLORS.inkDim, textDecoration: 'none' }}>{label}</a>
                    : <Link key={label + href} href={href} style={{ fontSize: 14, color: COLORS.inkDim, textDecoration: 'none' }}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: COLORS.inkFaint, margin: 0 }}>© 2026 MentaForce</p>
          <p style={{ fontSize: 12, color: COLORS.inkFaint, margin: 0 }}>Gemaakt in Nederland</p>
        </div>
      </div>
    </footer>
  )
}
