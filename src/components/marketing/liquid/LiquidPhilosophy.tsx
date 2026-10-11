'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Footprints, HeartPulse, Moon, Smile, Utensils, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { COLORS } from '../theme'
import { metNadruk } from '../metNadruk'
import { useVertaling } from '@/lib/i18n/TaalProvider'

interface Pijler {
  /** Vertaalsleutel van het label. */
  label: string
  icon: LucideIcon
}

const PIJLERS: readonly Pijler[] = [
  { label: 'site.pijlers.energie', icon: Zap },
  { label: 'site.pijlers.slaap', icon: Moon },
  { label: 'site.pijlers.stress', icon: HeartPulse },
  { label: 'site.pijlers.stemming', icon: Smile },
  { label: 'site.pijlers.beweging', icon: Footprints },
  { label: 'site.pijlers.voeding', icon: Utensils },
]

// Vertaalsleutels van label en tekst per blok.
interface TekstBlok {
  label: string
  body: string
}

const BLOKKEN: readonly TekstBlok[] = [
  { label: 'site.filosofie.blok1Label', body: 'site.filosofie.blok1Tekst' },
  { label: 'site.filosofie.blok2Label', body: 'site.filosofie.blok2Tekst' },
]

export default function LiquidPhilosophy() {
  const { t } = useVertaling()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pijlers" ref={ref} className="relative overflow-hidden px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-16 md:mb-24"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {metNadruk(t('site.filosofie.kop'), { className: 'italic text-white/40' })}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            className="rounded-3xl overflow-hidden aspect-[4/3]"
            style={{
              background: `radial-gradient(ellipse at center, ${COLORS.cyanSoft} 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-2 gap-3 p-6 h-full">
              {PIJLERS.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="liquid-glass rounded-2xl flex flex-col items-center justify-center gap-2"
                >
                  <Icon size={22} style={{ color: COLORS.cyan }} aria-hidden />
                  <span className="text-white/80 text-xs md:text-sm font-medium">{t(label)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {BLOKKEN.map((blok, index) => (
              <div key={blok.label}>
                {index > 0 && <div className="w-full h-px bg-white/10 my-8 md:my-10" />}
                <p className="text-white/60 text-xs tracking-widest uppercase mb-4">{t(blok.label)}</p>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">{t(blok.body)}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
