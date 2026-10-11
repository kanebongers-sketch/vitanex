'use client'

import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'

const VERVOLG_STAPPEN = [
  { icon: '1', sleutel: 'vervolgMail' },
  { icon: '2', sleutel: 'vervolgDoorgestuurd' },
  { icon: '3', sleutel: 'vervolgInloggen' },
]

export interface RegisterStapBevestigProps {
  email: string
  resendBezig: boolean
  resendKlaar: boolean
  onOpnieuwVersturen: () => void
}

export function RegisterStapBevestig({
  email, resendBezig, resendKlaar, onOpnieuwVersturen,
}: RegisterStapBevestigProps) {
  const { t } = useVertaling()
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"
        style={{ background: 'var(--mf-green-light)' }} aria-hidden>
        <MailCheck size={40} strokeWidth={1.75} style={{ color: 'var(--mf-green)' }} />
      </div>
      <h1 className="text-3xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-1)' }}>{t('account.register.bevestigKop')}</h1>
      <p className="mb-2 text-base leading-relaxed" style={{ color: 'var(--text-3)' }}>
        {t('account.register.gestuurdNaar')}
      </p>
      <p className="font-semibold mb-6 text-lg" style={{ color: 'var(--text-1)' }}>{email}</p>
      <p className="text-sm mb-10 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-4)' }}>
        {t('account.register.klikLinkSpam')}
      </p>

      <div className="rounded-2xl p-6 mb-8 text-left"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{t('account.register.watNu')}</p>
        <div className="flex flex-col gap-3">
          {VERVOLG_STAPPEN.map(s => (
            <div key={s.icon} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                {s.icon}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t(`account.register.${s.sleutel}`)}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/login"
        className="inline-flex items-center justify-center w-full py-4 rounded-xl font-bold text-sm transition hover:opacity-90"
        style={{
          background: 'var(--mf-green)', color: 'var(--bg-app)',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
        }}>
        {t('account.register.naarInloggen')}
      </Link>
      {resendKlaar ? (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--mf-green-dark)' }}>
          {t('account.register.opnieuwVerstuurd')}
        </p>
      ) : (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-4)' }}>
          {t('account.register.geenMail')}{' '}
          <button
            disabled={resendBezig}
            onClick={onOpnieuwVersturen}
            className="underline transition hover:opacity-70 disabled:opacity-50"
            style={{ color: 'var(--text-2)' }}
          >
            {resendBezig ? t('account.login.versturen') : t('account.register.opnieuwVersturen')}
          </button>
        </p>
      )}
    </div>
  )
}
