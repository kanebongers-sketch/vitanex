'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { COLORS, FONT, MAXW, EASE } from '../theme'

const BrainCanvas = dynamic(() => import('../BrainCanvas'), { ssr: false })

const TRUST = ['Anoniem', 'AVG-conform', 'EU-hosting', '6 vlakken']

export default function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', fontFamily: FONT.grotesk, paddingTop: 40, paddingBottom: 64 }}>
      {/* cyan-glow achtergrond */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '90%', background: `radial-gradient(ellipse at center, ${COLORS.cyanSoft} 0%, transparent 60%)` }} />
      </div>

      <div style={{ maxWidth: MAXW, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, marginBottom: 28 }}>
          Welzijnsplatform voor teams
        </p>

        <h1 style={{
          textAlign: 'center', fontWeight: 700,
          fontSize: 'clamp(40px, 8vw, 92px)', lineHeight: 0.98, letterSpacing: '-0.04em',
          color: COLORS.ink, margin: '0 auto 26px', maxWidth: 980,
        }}>
          Mentaal welzijn,<br />
          <span style={{ color: COLORS.cyan }}>vroeg in beeld.</span>
        </h1>

        <p style={{ textAlign: 'center', fontSize: 'clamp(15px,1.5vw,19px)', lineHeight: 1.6, color: COLORS.inkDim, maxWidth: 560, margin: '0 auto 36px' }}>
          MentaForce meet welzijn anoniem en geaggregeerd over zes vlakken, zodat teams op tijd het gesprek kunnen voeren.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/contact"
            style={{ fontSize: 15, fontWeight: 600, color: COLORS.navyDeep, background: COLORS.cyan, padding: '15px 30px', borderRadius: 12, textDecoration: 'none', boxShadow: `0 10px 36px ${COLORS.cyanSoft}`, display: 'inline-flex', alignItems: 'center', gap: 8, transition: `transform .2s ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>
            Demo aanvragen <span aria-hidden>→</span>
          </Link>
          <a href="#brein"
            style={{ fontSize: 15, fontWeight: 500, color: COLORS.ink, background: 'transparent', border: `1px solid ${COLORS.lineStrong}`, padding: '15px 30px', borderRadius: 12, textDecoration: 'none', transition: `border-color .2s ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.cyan }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.lineStrong }}>
            Bekijk het brein
          </a>
        </div>

        <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          {TRUST.map((t) => (
            <span key={t} style={{ fontSize: 13, color: COLORS.inkFaint, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: COLORS.cyan }}>✓</span> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Brein centerpiece — het enige meerkleurige element */}
      <div id="brein" style={{ position: 'relative', height: 'clamp(360px, 52vw, 620px)', marginTop: 8 }}>
        <BrainCanvas />
      </div>
    </section>
  )
}
