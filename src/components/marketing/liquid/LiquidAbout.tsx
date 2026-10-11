'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { metNadruk } from '../metNadruk'

export default function LiquidAbout() {
  const { t } = useVertaling()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="over"
      ref={ref}
      className="relative overflow-hidden px-6 pt-32 pb-10 md:pt-44 md:pb-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.p
          className="text-sm tracking-widest uppercase text-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('site.over.label')}
        </motion.p>

        <motion.h2
          className="mt-6 text-4xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {metNadruk(t('site.over.kopRegel1'), { className: 'italic text-white/60' })}
          <br className="hidden md:block" />{' '}
          {metNadruk(t('site.over.kopRegel2'), { className: 'italic text-white/60' })}
        </motion.h2>
      </div>
    </section>
  )
}
