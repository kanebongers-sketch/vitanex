'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { COLORS, FONT, MAXW, EASE, BRAIN_COLORS } from '../theme'

const BrainCanvas = dynamic(() => import('../BrainCanvas'), { ssr: false, loading: () => null })

interface Step { naam: string; zin: string; info: string }

const STEPS: Step[] = [
  { naam: 'Energie', zin: 'Dagelijkse vitaliteit en herstel inzichtelijk.', info: 'We volgen hoe energie zich over de week ontwikkelt, zodat dips opvallen voordat ze doorwerken.' },
  { naam: 'Slaap', zin: 'Slaapkwaliteit en herstel, nacht na nacht.', info: 'Inzicht in slaap en herstel als basis voor focus en humeur overdag.' },
  { naam: 'Stress', zin: 'Vroege signalen van overbelasting.', info: 'Spanning wordt zichtbaar in trends, zodat je er op tijd over kunt praten.' },
  { naam: 'Stemming', zin: 'Mentaal welzijn en motivatie.', info: 'Anoniem peilen hoe het écht met het team gaat, zonder ongemakkelijk gesprek.' },
  { naam: 'Beweging', zin: 'Lichamelijke activiteit die energie voedt.', info: 'Hoe beweging samenhangt met hoe mensen zich voelen en presteren.' },
  { naam: 'Voeding', zin: 'Voeding en hydratatie als fundament.', info: 'De kleine gewoontes die veerkracht dragen, inzichtelijk gemaakt.' },
]

export default function BrainScroll() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)               // continue 0..1 — stuurt de camera elke frame
  const [step, setStep] = useState(0)          // discreet — alleen voor info-kaart + stippen

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return
      const p = Math.max(0, Math.min(1, -rect.top / total))
      progressRef.current = p
      const s = Math.min(STEPS.length - 1, Math.round(p * (STEPS.length - 1)))
      setStep((prev) => (prev === s ? prev : s))
    }
    // capture: vangt ook scroll op een scrollende <body> (html heeft overflow:hidden)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  }, [])

  const cur = STEPS[step]
  const color = BRAIN_COLORS[step]

  return (
    <section id="brein" style={{ fontFamily: FONT.grotesk, borderTop: `1px solid ${COLORS.line}` }}>
      <style>{`
        .bs-wrap { position: relative; height: 600vh; }
        .bs-sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
        .bs-canvas { position: absolute; inset: 0; }
        .bs-info {
          position: absolute; left: 0; right: 0; bottom: 36px; padding: 0 24px;
          display: flex; justify-content: center; pointer-events: none;
        }
        .bs-card {
          width: 100%; max-width: 560px;
          background: rgba(7,18,40,0.72); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${COLORS.line}; border-radius: 20px; padding: 22px 24px;
        }
        .bs-dots { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 900px) {
          .bs-info { left: 0; right: auto; top: 50%; bottom: auto; transform: translateY(-50%); justify-content: flex-start; padding: 0; }
          .bs-card { margin-left: max(28px, calc((100vw - ${MAXW}px) / 2 + 28px)); max-width: 420px; }
        }
        @keyframes bsFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .bs-anim { animation: bsFade .5s ${EASE} both; }
      `}</style>

      <div ref={wrapRef} className="bs-wrap">
        <div className="bs-sticky">
          <div className="bs-canvas">
            <BrainCanvas progressRef={progressRef} />
          </div>

          {/* ambient kleurgloed van het actieve deel */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 50% 50% at 50% 45%, ${color}14 0%, transparent 60%)`, transition: 'background .8s ease' }} />

          {/* info-kaart */}
          <div className="bs-info">
            <div className="bs-card">
              <div key={step} className="bs-anim">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan }}>
                    Vlak 0{step + 1} / 06
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 'clamp(30px, 4vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.ink, margin: '0 0 14px' }}>
                  {cur.naam}
                </h3>
                <p style={{ fontSize: 17, lineHeight: 1.5, color: COLORS.ink, margin: '0 0 10px', fontWeight: 500 }}>{cur.zin}</p>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>{cur.info}</p>
              </div>
            </div>
          </div>

          {/* voortgang */}
          <div className="bs-dots">
            {STEPS.map((s, i) => (
              <span key={s.naam} aria-hidden style={{
                width: i === step ? 10 : 8, height: i === step ? 10 : 8, borderRadius: '50%',
                background: i === step ? BRAIN_COLORS[i] : COLORS.lineStrong,
                boxShadow: i === step ? `0 0 10px ${BRAIN_COLORS[i]}` : 'none',
                transition: `all .3s ${EASE}`,
              }} />
            ))}
          </div>

          {/* sectiekop — onder de nav */}
          <div style={{ position: 'absolute', top: 92, left: 0, right: 0, padding: '0 28px', textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan, margin: 0 }}>
              De zes vlakken — scroll om te ontdekken
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
