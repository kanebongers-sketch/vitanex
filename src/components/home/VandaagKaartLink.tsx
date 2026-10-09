'use client'

// Ingang naar de Vandaag-kaart, bovenaan de homepagina: "wat telt er vandaag?"
// in één tik. De kaart zelf staat op /vandaag.

import Link from 'next/link'
import { ArrowRight, Sunrise } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export function VandaagKaartLink() {
  const { t } = useVertaling()
  return (
    <Link
      href="/vandaag"
      className="mf-pressable mf-vandaag-knop"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '18px 20px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        textDecoration: 'none',
        color: 'var(--text-1)',
      }}
    >
      <span aria-hidden style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-soft)', color: 'var(--brand)', flex: 'none' }}>
        <Sunrise size={20} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 700 }}>{t('home.vandaagKaart')}</span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{t('home.vandaagKaartUitleg')}</span>
      </span>
      <ArrowRight size={18} aria-hidden style={{ color: 'var(--brand)', flex: 'none' }} />
    </Link>
  )
}
