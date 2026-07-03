'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { COLORS } from '../theme'

const SVG_CLASS = 'h-full w-full transition-transform duration-700 group-hover:scale-105'

function SignaalVisual() {
  return (
    <svg
      aria-hidden
      className={SVG_CLASS}
      viewBox="0 0 640 360"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="640" height="360" fill={COLORS.navyElev} />
      <path
        d="M0 260 C 90 250, 130 268, 210 252 S 370 230, 450 246 S 590 262, 640 250"
        fill="none"
        stroke={COLORS.cyan}
        strokeOpacity={0.15}
        strokeWidth={2}
      />
      <path
        d="M0 228 C 80 214, 150 238, 230 216 S 390 186, 470 210 S 590 228, 640 212"
        fill="none"
        stroke={COLORS.cyan}
        strokeOpacity={0.3}
        strokeWidth={2}
      />
      <path
        d="M0 190 C 70 160, 120 214, 200 176 S 340 108, 430 168 S 570 208, 640 148"
        fill="none"
        stroke={COLORS.cyan}
        strokeWidth={2}
      />
    </svg>
  )
}

function FocusVisual() {
  return (
    <svg
      aria-hidden
      className={SVG_CLASS}
      viewBox="0 0 640 360"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="640" height="360" fill={COLORS.navyElev} />
      <circle cx="320" cy="180" r="140" fill="none" stroke={COLORS.cyan} strokeOpacity={0.1} strokeWidth={2} />
      <circle cx="320" cy="180" r="102" fill="none" stroke={COLORS.cyan} strokeOpacity={0.18} strokeWidth={2} />
      <circle cx="320" cy="180" r="64" fill="none" stroke={COLORS.cyan} strokeOpacity={0.3} strokeWidth={2} />
      <circle cx="320" cy="180" r="28" fill="none" stroke={COLORS.cyan} strokeOpacity={0.5} strokeWidth={2} />
      <circle cx="320" cy="180" r="6" fill={COLORS.cyan} />
    </svg>
  )
}

interface Kaart {
  tag: string
  titel: string
  beschrijving: string
  Visual: () => ReactElement
}

const KAARTEN: readonly Kaart[] = [
  {
    tag: 'Signaleren',
    titel: 'Anoniem meten & vroeg zien',
    beschrijving:
      'Korte check-ins over zes pijlers geven het team een gedeeld, geaggregeerd beeld — anoniem, AVG-conform en EU-gehost. Zo worden signalen bespreekbaar terwijl er nog ruimte is om iets te veranderen.',
    Visual: SignaalVisual,
  },
  {
    tag: 'Trainen',
    titel: 'Coaching & mentale groei',
    beschrijving:
      'Met Vita, ademhalings- en focussessies en persoonlijke protocollen bouw je stap voor stap aan veerkracht en concentratie. Kleine dagelijkse stappen, geen quick fixes.',
    Visual: FocusVisual,
  },
]

export default function LiquidServices() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="platform" ref={ref} className="relative overflow-hidden px-6 py-28 md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          className="flex items-end justify-between mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-3xl md:text-5xl text-white tracking-tight">Wat MentaForce doet</h2>
          <span className="hidden md:block text-white/40 text-sm">Het platform</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {KAARTEN.map(({ tag, titel, beschrijving, Visual }, index) => (
            <motion.article
              key={tag}
              className="liquid-glass rounded-3xl overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative aspect-video overflow-hidden">
                <Visual />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <span className="uppercase tracking-widest text-white/60 text-xs">{tag}</span>
                  <span className="liquid-glass rounded-full p-2" aria-hidden>
                    <ArrowUpRight size={16} className="text-white" />
                  </span>
                </div>
                <h3 className="text-white text-xl md:text-2xl mb-3 tracking-tight">{titel}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{beschrijving}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
