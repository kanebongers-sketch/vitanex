'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { COLORS, FONT, MAXW, EASE, BRAIN_COLORS, STEP_REGION } from '../theme'

const BrainCanvas = dynamic(() => import('../BrainCanvas'), { ssr: false, loading: () => null })

interface Step { naam: string; zin: string; info: string; help: string }

// Editoriale plaatsing per stap (index = step, 0 = intro, 1..6 = de zes vlakken).
// `tx`/`ty` zijn de horizontale/verticale anker-zones op desktop; we vertalen de
// kaart via transform naar die zone (NOOIT top/left animeren — project-regel).
//   x: 'left'  → tegen de linker zijmarge   | x: 'right' → tegen de rechter zijmarge
//   y: 'top'   → onder de sectiekop (~110px) | 'mid' → verticaal gecentreerd
//   y: 'bottom'→ onderaan, ruim boven de rand
interface CardPos { x: 'left' | 'right'; y: 'top' | 'mid' | 'bottom' }
const CARD_POS: readonly CardPos[] = [
  { x: 'left', y: 'mid' },     // 0 intro     — links-midden
  { x: 'left', y: 'top' },     // 1 Energie   — links-boven
  { x: 'right', y: 'mid' },    // 2 Slaap     — rechts-midden
  { x: 'left', y: 'bottom' },  // 3 Stress    — links-onder
  { x: 'right', y: 'top' },    // 4 Stemming  — rechts-boven
  { x: 'left', y: 'mid' },     // 5 Beweging  — links-midden
  { x: 'right', y: 'bottom' }, // 6 Voeding   — rechts-onder
]

const STEPS: Step[] = [
  { naam: 'Energie', zin: 'Dagelijkse vitaliteit en herstel inzichtelijk.', info: 'We volgen hoe energie zich over de week ontwikkelt, zodat dips opvallen voordat ze doorwerken.', help: 'Dagelijkse check-ins tonen je energietrend; de app geeft kleine, haalbare hersteltips wanneer je structureel onder je niveau zit.' },
  { naam: 'Slaap', zin: 'Slaapkwaliteit en herstel, nacht na nacht.', info: 'Inzicht in slaap en herstel als basis voor focus en humeur overdag.', help: 'Houd je slaap bij en krijg routines aangereikt die je nachtrust stap voor stap verbeteren.' },
  { naam: 'Stress', zin: 'Vroege signalen van overbelasting.', info: 'Spanning wordt zichtbaar in trends, zodat je er op tijd over kunt praten.', help: 'De app reikt adem- en ontspanoefeningen aan precies wanneer de spanning oploopt.' },
  { naam: 'Stemming', zin: 'Mentaal welzijn en motivatie.', info: 'Anoniem peilen hoe het écht met het team gaat, zonder ongemakkelijk gesprek.', help: 'Anonieme stemmingsmeting met een teamoverzicht en korte reflecties maken het makkelijker om te praten over hoe het gaat.' },
  { naam: 'Beweging', zin: 'Lichamelijke activiteit die energie voedt.', info: 'Hoe beweging samenhangt met hoe mensen zich voelen en presteren.', help: 'Koppel je activiteit en zet haalbare beweegdoelen die in je werkdag passen.' },
  { naam: 'Voeding', zin: 'Voeding en hydratatie als fundament.', info: 'De kleine gewoontes die veerkracht dragen, inzichtelijk gemaakt.', help: 'Voedings- en hydratatie-check-ins met simpele, volhoudbare gewoontes die je veerkracht versterken.' },
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
      // 7 waypoints: 0 = intro-overzicht, 1..6 = de zes vlakken
      const s = Math.min(STEPS.length, Math.round(p * STEPS.length))
      setStep((prev) => (prev === s ? prev : s))
    }
    // capture: vangt ook scroll op een scrollende <body> (html heeft overflow:hidden)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions)
  }, [])

  // Perf: frameloop pauzeren zodra de sectie ver buiten beeld is.
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // prefers-reduced-motion: bij reduce geen positie-transitie (direct op plek)
  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const isIntro = step === 0
  const cur = isIntro ? null : STEPS[step - 1]
  const color = isIntro ? COLORS.cyan : BRAIN_COLORS[STEP_REGION[step - 1]]

  // Desktop-transform per stap: verschuif de (links-boven verankerde) kaart naar
  // de doelzone. Alleen transform — geen layout-animatie. Mobiel negeert dit.
  // tx/ty = anker-positie; sy = zelf-relatieve uitlijning (%, op eigen hoogte),
  // zodat we de kaarthoogte niet hoeven te meten.
  const pos = CARD_POS[step] ?? CARD_POS[0]
  const PAD = 28          // zijmarge / boven- + onder-marge
  const TOP = 110         // ruimte vrij vanaf bovenkant (nav + sectiekop)
  const SIDE = `max(${PAD}px, calc((100vw - ${MAXW}px) / 2 + ${PAD}px))`
  const tx = pos.x === 'left' ? SIDE : `calc(100vw - var(--bs-card-w) - ${SIDE})`
  const ty =
    pos.y === 'top' ? `${TOP}px` : pos.y === 'bottom' ? `calc(100vh - ${PAD}px)` : '50vh'
  const sy = pos.y === 'top' ? '0%' : pos.y === 'bottom' ? '-100%' : '-50%'
  const cardTransform = `translate(${tx}, ${ty}) translateY(${sy})`

  return (
    <section id="brein" style={{ fontFamily: FONT.grotesk, borderTop: `1px solid ${COLORS.line}` }}>
      <style>{`
        .bs-wrap { position: relative; height: 700vh; }
        .bs-sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
        .bs-canvas { position: absolute; inset: 0; }
        /* Mobiel: kaart onderaan gecentreerd (transform-plaatsing uit). */
        .bs-info {
          position: absolute; left: 0; right: 0; bottom: 36px; padding: 0 24px;
          display: flex; justify-content: center; pointer-events: none;
        }
        .bs-pos { width: 100%; display: flex; justify-content: center; }
        .bs-card {
          width: 100%; max-width: 560px;
          background: rgba(7,18,40,0.72); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid ${COLORS.line}; border-radius: 20px; padding: 22px 24px;
        }
        .bs-dots { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 900px) {
          /* Desktop: anker-laag op volledig beeld; de kaart wordt per stap via
             transform naar de doelzone geschoven (alleen transform animeert). */
          .bs-info { inset: 0; bottom: 0; padding: 0; display: block; }
          .bs-pos {
            --bs-card-w: 400px;
            position: absolute; top: 0; left: 0; width: var(--bs-card-w);
            transform: var(--bs-tf);
            transition: transform .6s ${EASE};
            will-change: transform;
          }
          .bs-pos[data-reduce='true'] { transition: none; }
          .bs-card { max-width: var(--bs-card-w); }
        }
        @keyframes bsFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .bs-anim { animation: bsFade .5s ${EASE} both; }
      `}</style>

      <div ref={wrapRef} className="bs-wrap">
        <div className="bs-sticky">
          <div className="bs-canvas">
            <BrainCanvas progressRef={progressRef} paused={paused} />
          </div>

          {/* ambient kleurgloed van het actieve deel */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 50% 50% at 50% 45%, ${color}14 0%, transparent 60%)`, transition: 'background .8s ease' }} />

          {/* info-kaart — desktop: per stap via transform naar een andere zone */}
          <div className="bs-info">
            <div
              className="bs-pos"
              data-reduce={reduceMotion ? 'true' : 'false'}
              style={{ '--bs-tf': cardTransform } as React.CSSProperties}
            >
              <div className="bs-card">
              {isIntro || !cur ? (
                <div key="intro" className="bs-anim">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS.cyan, boxShadow: `0 0 12px ${COLORS.cyan}` }} />
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan }}>
                      De zes vlakken
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 'clamp(30px, 4vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.ink, margin: '0 0 14px' }}>
                    Eén brein,<br />zes vlakken.
                  </h3>
                  <p style={{ fontSize: 16, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>
                    Welzijn, anoniem gemeten over zes vlakken. Scroll om elk vlak te ontdekken.
                  </p>
                </div>
              ) : (
                <div key={step} className="bs-anim">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: COLORS.cyan }}>
                      Vlak 0{step} / 06
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 'clamp(30px, 4vw, 46px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: COLORS.ink, margin: '0 0 14px' }}>
                    {cur.naam}
                  </h3>
                  <p style={{ fontSize: 17, lineHeight: 1.5, color: COLORS.ink, margin: '0 0 10px', fontWeight: 500 }}>{cur.zin}</p>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: COLORS.inkDim, margin: '0 0 16px' }}>{cur.info}</p>
                  <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.cyan, margin: '0 0 6px' }}>
                      Hoe MentaForce helpt
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.inkDim, margin: 0 }}>{cur.help}</p>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* voortgang — intro-overzicht + zes vlakken */}
          <div className="bs-dots">
            {Array.from({ length: STEPS.length + 1 }).map((_, i) => {
              const dotColor = i === 0 ? COLORS.cyan : BRAIN_COLORS[STEP_REGION[i - 1]]
              const active = i === step
              return (
                <span key={i} aria-hidden style={{
                  width: active ? 10 : 8, height: active ? 10 : 8, borderRadius: '50%',
                  background: active ? dotColor : COLORS.lineStrong,
                  boxShadow: active ? `0 0 10px ${dotColor}` : 'none',
                  transition: `all .3s ${EASE}`,
                }} />
              )
            })}
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
