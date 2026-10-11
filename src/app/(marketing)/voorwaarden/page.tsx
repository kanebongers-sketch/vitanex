'use client'

import { Mail } from 'lucide-react'
import Nav from '@/components/marketing/landing/Nav'
import Footer from '@/components/marketing/landing/Footer'
import { COLORS, FONT, EASE, glassPanel } from '@/components/marketing/theme'
import { useVertaling } from '@/lib/i18n/TaalProvider'

// id = anker in de URL (ongewijzigd); sleutel = site.voorwaarden.<sleutel>Titel/Inhoud.
const SECTIONS: { id: string; sleutel: string }[] = [
  { id: 'aanvaarding', sleutel: 'aanvaarding' },
  { id: 'dienst', sleutel: 'dienst' },
  { id: 'accounts', sleutel: 'accounts' },
  { id: 'privacy', sleutel: 'privacy' },
  { id: 'gegevens', sleutel: 'gegevens' },
  { id: 'gebruik', sleutel: 'gebruik' },
  { id: 'intellectueel', sleutel: 'intellectueel' },
  { id: 'abonnement', sleutel: 'abonnement' },
  { id: 'aansprakelijkheid', sleutel: 'aansprakelijkheid' },
  { id: 'beëindiging', sleutel: 'beeindiging' },
  { id: 'toepasselijk', sleutel: 'recht' },
]

export default function Voorwaarden() {
  const { t } = useVertaling()
  return (
    <div style={{ minHeight: '100vh', background: COLORS.navy, color: COLORS.ink, fontFamily: FONT.grotesk }}>
      <Nav />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 80px', borderBottom: `1px solid ${COLORS.line}` }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 80% at 50% 0%, ${COLORS.cyanSoft} 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
          <p style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 16px', margin: '0 0 24px', fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.lineStrong}`, background: COLORS.cyanSoft, color: COLORS.ink }}>
            {t('site.voorwaarden.badge')}
          </p>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.04, letterSpacing: '-0.035em', color: COLORS.ink, margin: '0 0 18px' }}>
            {t('site.voorwaarden.kop')}
          </h1>
          <p style={{ fontSize: 17, color: COLORS.inkDim, margin: 0 }}>
            {t('site.voorwaarden.bijgewerkt')}
          </p>
        </div>
      </section>

      {/* Inhoud */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 28px', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>

        {/* Inhoudsopgave */}
        <aside style={{ flex: '0 1 220px', minWidth: 200 }}>
          <div style={{ position: 'sticky', top: 96 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: 16 }}>
              {t('site.voorwaarden.inhoud')}
            </p>
            <nav aria-label={t('site.voorwaarden.inhoudsopgave')} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{ fontSize: 14, padding: '6px 0', lineHeight: 1.3, color: COLORS.inkDim, textDecoration: 'none', transition: `color .2s ${EASE}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ink }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.inkDim }}
                >
                  {t(`site.voorwaarden.${s.sleutel}Titel`)}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Secties */}
        <main style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0 }}>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 112 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, margin: '0 0 16px' }}>{t(`site.voorwaarden.${s.sleutel}Titel`)}</h2>
              <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-line', color: COLORS.inkDim }}>
                {t(`site.voorwaarden.${s.sleutel}Inhoud`)}
              </div>
              <div aria-hidden style={{ marginTop: 32, borderTop: `1px solid ${COLORS.line}` }} />
            </section>
          ))}

          {/* Contact */}
          <div style={{ ...glassPanel, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, margin: '0 0 8px' }}>{t('site.voorwaarden.vragenKop')}</p>
            <p style={{ fontSize: 14, color: COLORS.inkDim, margin: '0 0 20px' }}>
              {t('site.voorwaarden.vragenTekst')}
            </p>
            <a
              href="mailto:info@mentaforce.nl"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 26px', borderRadius: 12, textDecoration: 'none',
                fontSize: 14, fontWeight: 600, color: COLORS.navyDeep, background: COLORS.cyan,
                boxShadow: `0 6px 24px ${COLORS.cyanSoft}`, transition: `transform .2s ${EASE}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Mail aria-hidden size={16} /> info@mentaforce.nl
            </a>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
