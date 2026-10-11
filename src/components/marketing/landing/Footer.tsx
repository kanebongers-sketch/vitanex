'use client'

import Link from 'next/link'
import { COLORS, FONT, MAXW } from '../theme'
import Wordmark from '../Wordmark'
import { useVertaling } from '@/lib/i18n/TaalProvider'

// Labels en kolomtitels zijn vertaalsleutels.
type Item = [string, string]
interface Col { titel: string; items: Item[] }

const COLS: Col[] = [
  { titel: 'site.footer.product', items: [['/#brein', 'site.footer.dePijlers'], ['/#aanpak', 'site.footer.aanpak']] },
  { titel: 'site.footer.bedrijf', items: [['/contact', 'site.footer.contact'], ['/voorwaarden', 'site.footer.voorwaarden']] },
  { titel: 'site.footer.juridisch', items: [['/voorwaarden#privacy', 'site.footer.voorwaardenPrivacy']] },
]

export default function Footer() {
  const { t } = useVertaling()
  return (
    <footer style={{ fontFamily: FONT.grotesk, borderTop: `1px solid ${COLORS.line}`, background: COLORS.navyDeep }}>
      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '64px 28px 32px' }}>
        <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap', marginBottom: 48 }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <Wordmark size={16} />
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.inkDim, maxWidth: 260 }}>
              {t('site.footer.tagline')}
            </p>
            <p style={{ fontSize: 12, color: COLORS.inkDim, marginTop: 12 }}>{t('site.footer.kenmerken')}</p>
          </div>

          {COLS.map((col) => (
            <div key={col.titel}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkDim, marginBottom: 16 }}>{t(col.titel)}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.items.map(([href, label]) => (
                  href.startsWith('#')
                    ? <a key={label + href} href={href} style={{ fontSize: 14, color: COLORS.inkDim, textDecoration: 'none' }}>{t(label)}</a>
                    : <Link key={label + href} href={href} style={{ fontSize: 14, color: COLORS.inkDim, textDecoration: 'none' }}>{t(label)}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: COLORS.inkDim, margin: 0 }}>© {new Date().getFullYear()} MentaForce</p>
          <p style={{ fontSize: 12, color: COLORS.inkDim, margin: 0 }}>{t('site.footer.gemaaktIn')}</p>
        </div>
      </div>
    </footer>
  )
}
