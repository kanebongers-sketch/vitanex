'use client'

import Link from 'next/link'
import { COLORS, FONT, EASE } from '../theme'

export default function Cta() {
  return (
    <section id="contact" style={{ fontFamily: FONT.grotesk, padding: '120px 0', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${COLORS.line}` }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 70% at 50% 40%, ${COLORS.cyanSoft} 0%, transparent 65%)` }} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 22 }}>
          Aan de slag
        </p>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(30px, 5vw, 58px)', lineHeight: 1.06, letterSpacing: '-0.035em', color: COLORS.ink, margin: '0 0 22px' }}>
          Benieuwd hoe het voor jouw team werkt?
        </h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: COLORS.inkDim, marginBottom: 40 }}>
          Vraag een demo aan of neem contact op. We laten je rustig zien hoe MentaForce werkt.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/contact"
            style={{ fontSize: 15, fontWeight: 600, color: COLORS.navyDeep, background: COLORS.cyan, padding: '16px 34px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 10px 36px ${COLORS.cyanSoft}`, display: 'inline-flex', alignItems: 'center', gap: 8, transition: `transform .2s ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
            Demo aanvragen <span aria-hidden>→</span>
          </Link>
          <Link href="/contact"
            style={{ fontSize: 15, fontWeight: 500, color: COLORS.ink, background: 'transparent', border: `1px solid ${COLORS.lineStrong}`, padding: '16px 34px', borderRadius: 12, textDecoration: 'none', transition: `border-color .2s ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.cyan }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.lineStrong }}>
            Neem contact op
          </Link>
        </div>
      </div>
    </section>
  )
}
