'use client'

import { Check, Users, Leaf } from 'lucide-react'
import { VOORDELEN_HR, VOORDELEN_WERKNEMER, type GebruikerType } from './register-helpers'
import { useVertaling } from '@/lib/i18n/TaalProvider'

const USP_BADGES = ['uspGratis', 'uspAvg', 'uspCreditcard']

export interface RegisterZijpaneelProps {
  type: GebruikerType | null
}

export function RegisterZijpaneel({ type }: RegisterZijpaneelProps) {
  const { t } = useVertaling()
  const voordelen = type === 'hr' ? VOORDELEN_HR : VOORDELEN_WERKNEMER

  return (
    <div className="hidden lg:flex flex-col justify-center px-14 py-12 lg:w-[440px] xl:w-[500px] relative overflow-hidden"
      style={{ background: 'var(--bg-subtle)', borderLeft: '1px solid var(--border)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 80% 30%, color-mix(in srgb, var(--mf-green) 12%, transparent) 0%, transparent 60%)' }} />

      <div className="relative z-10">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--mf-green)' }}>
            {type === 'hr' ? t('account.register.zijVoorHr') : t('account.register.zijVoorGebruikers')}
          </p>
          <h2 className="text-2xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-1)' }}>
            {type === 'hr'
              ? t('account.register.zijKopHr')
              : t('account.register.zijKopGebruiker')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
            {type === 'hr'
              ? t('account.register.zijTekstHr')
              : t('account.register.zijTekstGebruiker')}
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          {voordelen.map(v => (
            <div key={v.sleutel} className="flex items-center gap-3">
              <span
                aria-hidden
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--mf-green-light)' }}
              >
                <v.icon size={18} style={{ color: 'var(--mf-green)' }} />
              </span>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t(`account.register.voordeel.${v.sleutel}`)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span
              aria-hidden
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--mf-green-light)' }}
            >
              {type === 'hr'
                ? <Users size={18} style={{ color: 'var(--mf-green)' }} />
                : <Leaf size={18} style={{ color: 'var(--mf-green)' }} />}
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--mf-green) 15%, transparent)', color: 'var(--mf-green)' }}>
              {type === 'hr' ? t('account.register.zijHrPlatform') : t('account.register.zijPortaal')}
            </span>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>
            {type === 'hr'
              ? t('account.register.zijKaartHr')
              : t('account.register.zijKaartGebruiker')}
          </p>
          <div className="flex flex-col gap-1.5">
            {voordelen.slice(0, 3).map(v => (
              <div key={v.sleutel} className="flex items-center gap-2">
                <v.icon size={14} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(`account.register.voordeel.${v.sleutel}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          {USP_BADGES.map(usp => (
            <div key={usp} className="flex items-center gap-1.5">
              <Check size={12} strokeWidth={3} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>{t(`account.register.${usp}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
