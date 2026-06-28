'use client'

import { COLORS, FONT, MAXW } from '../theme'

export default function Manifest() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', fontFamily: FONT.grotesk, padding: '120px 0', borderTop: `1px solid ${COLORS.line}` }}>
      {/* Neuraal accent (abstracte synaps-art, navy/cyan) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/neural.svg" alt="" aria-hidden="true" width={620} height={440}
        style={{ position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)', opacity: 0.22, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at center, #000 40%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 40%, transparent 75%)' }} />
      <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: '0 28px' }}>
        <span style={{ display: 'block', width: 48, height: 3, background: COLORS.cyan, borderRadius: 2, marginBottom: 36 }} />
        <p style={{ fontWeight: 600, fontSize: 'clamp(26px, 4vw, 46px)', lineHeight: 1.18, letterSpacing: '-0.03em', color: COLORS.ink, margin: 0 }}>
          We bouwen aan werk waar mensen niet stilletjes opbranden — door welzijn{' '}
          <span style={{ color: COLORS.cyan }}>meetbaar</span> en{' '}
          <span style={{ color: COLORS.cyan }}>bespreekbaar</span> te maken.
        </p>
        <p style={{ marginTop: 28, fontSize: 16, color: COLORS.inkDim, fontWeight: 500, letterSpacing: '0.04em' }}>— MentaForce</p>
      </div>
    </section>
  )
}
