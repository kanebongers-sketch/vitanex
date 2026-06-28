'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { STRUCTURES } from '@/data/brainStructures'
import AtlasInfoPanel from '@/components/atlas/AtlasInfoPanel'
import AtlasNav from '@/components/atlas/AtlasNav'

const AtlasBrain = dynamic(() => import('@/components/atlas/AtlasBrain'), { ssr: false })

const SCROLL_PAGES = 11

export default function BreinPage() {
  const scrollRef    = useRef(0)
  const activeIdxRef = useRef(0)
  const lenisRef     = useRef<unknown>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    let animId: number

    const updateActive = (progress: number) => {
      scrollRef.current = progress
      const idx = STRUCTURES.findIndex(
        s => progress >= s.scrollStart && progress < s.scrollEnd
      )
      const next = idx < 0 ? STRUCTURES.length - 1 : idx
      if (next !== activeIdxRef.current) {
        activeIdxRef.current = next
        setActiveIdx(next)
      }
    }

    const init = async () => {
      const { default: Lenis } = await import('lenis')
      const lenis = new Lenis({ duration: 1.25, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
      lenisRef.current = lenis

      lenis.on('scroll', ({ progress }: { progress: number }) => {
        updateActive(progress)
      })

      const raf = (time: number) => {
        lenis.raf(time)
        animId = requestAnimationFrame(raf)
      }
      animId = requestAnimationFrame(raf)
    }
    init()

    return () => {
      cancelAnimationFrame(animId)
      if (lenisRef.current) (lenisRef.current as { destroy: () => void }).destroy()
    }
  }, [])

  const scrollToIdx = useCallback((idx: number) => {
    const s = STRUCTURES[idx]
    const mid = (s.scrollStart + s.scrollEnd) / 2
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: mid * totalHeight, behavior: 'smooth' })
  }, [])

  return (
    <main style={{ background: '#05070D', minHeight: '100vh' }}>
      {/* Back link */}
      <a
        href="/"
        style={{
          position: 'fixed', top: 22, left: 28, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(5,8,18,0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '7px 14px',
          fontFamily: 'var(--font-body, system-ui)',
          fontSize: 13, color: 'rgba(180,200,230,0.75)',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
      >
        ← Terug
      </a>

      {/* Title */}
      <div style={{
        position: 'fixed', top: 22, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <p style={{
          fontFamily: 'var(--font-display, system-ui)',
          fontWeight: 300, fontSize: 13,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(140,170,215,0.55)',
          margin: 0,
        }}>
          MentaForce — 3D Breinatlas
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 2, zIndex: 20, background: 'rgba(255,255,255,0.04)',
      }}>
        <div
          style={{
            height: '100%',
            background: STRUCTURES[activeIdx].color,
            width: `${((activeIdx + 0.5) / STRUCTURES.length) * 100}%`,
            transition: 'width 0.6s ease, background 0.5s ease',
            boxShadow: `0 0 8px ${STRUCTURES[activeIdx].color}`,
          }}
        />
      </div>

      {/* Structure counter (bottom right) */}
      <div style={{
        position: 'fixed', bottom: 20, right: 28, zIndex: 20,
        fontFamily: 'var(--font-display, system-ui)',
        fontWeight: 300, fontSize: 12,
        letterSpacing: '0.08em',
        color: 'rgba(140,170,215,0.45)',
        pointerEvents: 'none',
      }}>
        Scroll om te verkennen · {activeIdx + 1}/{STRUCTURES.length}
      </div>

      {/* Fixed 3D canvas */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <AtlasBrain scrollRef={scrollRef} activeIdx={activeIdx} />
      </div>

      {/* UI overlays */}
      <AtlasNav activeIdx={activeIdx} onSelect={scrollToIdx} />
      <AtlasInfoPanel activeIdx={activeIdx} />

      {/* Ambient colour wash matching active structure */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${STRUCTURES[activeIdx].color}09 0%, transparent 70%)`,
          transition: 'background 0.9s ease',
        }}
      />

      {/* Scroll spacer */}
      <div style={{ height: `${SCROLL_PAGES * 100}vh`, pointerEvents: 'none' }} />
    </main>
  )
}
