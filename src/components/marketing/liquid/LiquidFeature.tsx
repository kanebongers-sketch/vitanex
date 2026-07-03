'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { COLORS } from '../theme'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Rustige puls-visual: een cyaan kern waar zachte ringen uit opstijgen.
// De statische ringen blijven staan bij prefers-reduced-motion (de bewegende
// laag valt dan stil-onzichtbaar weg via de globale reduced-motion-regel).
function PulseVisual() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `radial-gradient(ellipse at 50% 42%, ${COLORS.cyanSoft} 0%, transparent 62%), ${COLORS.navyElev}` }}
    >
      {[168, 288, 420].map((maat) => (
        <span
          key={`vast-${maat}`}
          className="absolute rounded-full"
          style={{ width: maat, height: maat, border: `1px solid ${COLORS.cyan}`, opacity: 0.16 }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <span
          key={`puls-${i}`}
          className="absolute h-[420px] w-[420px] rounded-full"
          style={{
            border: `1px solid ${COLORS.cyan}`,
            animation: `lq-ring 5.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 1.8}s infinite`,
            opacity: 0,
          }}
        />
      ))}
      <span
        className="absolute h-3 w-3 rounded-full"
        style={{ background: COLORS.cyan, boxShadow: `0 0 24px ${COLORS.cyanGlow}` }}
      />
    </div>
  )
}

export default function LiquidFeature() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="aanpak" className="overflow-hidden px-6 pt-6 pb-20 md:pt-10 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative aspect-video overflow-hidden rounded-3xl"
        >
          <PulseVisual />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(to top, ${COLORS.navyDeep}99, transparent 55%)` }}
          />

          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-10">
            <div className="liquid-glass max-w-md rounded-2xl p-6 md:p-8">
              <p className="mb-3 text-xs uppercase tracking-widest text-white/60">Onze aanpak</p>
              <p className="text-sm leading-relaxed text-white md:text-base">
                Voorkomen begint met zien. MentaForce meet welzijn anoniem over zes
                pijlers, zodat signalen bespreekbaar worden vóór ze verzuim worden.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <Link href="/contact" className="liquid-glass inline-block rounded-full px-8 py-3 text-sm font-medium text-white">
                Ontdek meer
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
