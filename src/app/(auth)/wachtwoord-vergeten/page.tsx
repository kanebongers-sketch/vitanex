'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { SITE_VERBORGEN } from '@/lib/site-modus'
import { supabase } from '@/lib/supabase/supabase'
import { MailCheck } from 'lucide-react'
import { LogoFull } from '@/components/layout/Logo'
import { AuthKaart } from '@/components/ui/AuthKaart'
import { useVertaling } from '@/lib/i18n/TaalProvider'

type Status = 'idle' | 'loading' | 'verstuurd' | 'not_found' | 'error'

export default function WachtwoordVergeten() {
  const { t } = useVertaling()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function stuurResetMail() {
    if (!email.trim() || status === 'loading') return
    setStatus('loading')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/wachtwoord-reset`,
    })

    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('user not found') || m.includes('no user')) {
        setStatus('not_found')
      } else {
        setStatus('error')
      }
      return
    }

    setStatus('verstuurd')
  }

  return (
    <AuthKaart className="relative">
        <div className="flex justify-center mb-8">
          <Link href="/login" aria-label={t('account.wachtwoord.terugInloggen')}>
            <LogoFull iconSize={38} />
          </Link>
        </div>

        {status === 'verstuurd' ? (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--mf-green-light)' }}
            >
              <MailCheck size={28} aria-hidden style={{ color: 'var(--mf-green)' }} />
            </div>
            <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{t('account.wachtwoord.mailVerstuurd')}</h1>
            <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {t('account.wachtwoord.gestuurdNaar')}
            </p>
            <p className="font-semibold mb-6" style={{ color: 'var(--text-1)' }}>{email}</p>
            <p className="text-xs mb-8 leading-relaxed" style={{ color: 'var(--text-3)' }}>
              {t('account.wachtwoord.klikLink')}
            </p>
            <Link
              href="/login"
              className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold transition hover:opacity-90"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
            >
              {t('account.wachtwoord.terugInloggen')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t('account.wachtwoord.vergetenKop')}</h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
              {t('account.wachtwoord.vergetenIntro')}
            </p>

            {status === 'not_found' && (
              <div id="reset-fout" role="alert" aria-live="assertive" className="rounded-xl px-4 py-3 mb-5"
                style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--mf-red)' }}>{t('account.wachtwoord.geenAccount')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>
                  {t('account.wachtwoord.nietGeregistreerd')}
                  {!SITE_VERBORGEN && (
                    <>
                      {' '}<Link href="/register" className="underline font-medium">{t('account.wachtwoord.registreer')}</Link>.
                    </>
                  )}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div id="reset-fout" role="alert" aria-live="assertive" className="rounded-xl px-4 py-3 mb-5"
                style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--mf-red)' }}>{t('account.wachtwoord.fout')}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>{t('account.wachtwoord.opnieuw')}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-6">
              <label htmlFor="reset-email" className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('account.login.email')}</label>
              <input
                id="reset-email"
                type="email"
                placeholder={t('account.register.emailPlaceholder')}
                value={email}
                autoFocus
                autoComplete="email"
                aria-describedby={status === 'not_found' || status === 'error' ? 'reset-fout' : undefined}
                onChange={e => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle') }}
                onKeyDown={e => e.key === 'Enter' && stuurResetMail()}
                className="mf-input"
                style={{ borderRadius: 14, padding: '12px 16px' }}
              />
            </div>

            <button
              onClick={stuurResetMail}
              disabled={!email.trim() || status === 'loading'}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
              {status === 'loading' && (
                <span
                  className="mf-spinner"
                  aria-hidden
                  style={{
                    width: 16,
                    height: 16,
                    borderColor: 'color-mix(in srgb, var(--bg-app) 25%, transparent)',
                    borderTopColor: 'var(--bg-app)',
                  }}
                />
              )}
              {status === 'loading' ? t('account.login.versturen') : t('account.wachtwoord.versturen')}
            </button>

            <p className="text-xs text-center mt-6" style={{ color: 'var(--text-3)' }}>
              <Link href="/login" className="font-medium transition hover:opacity-70" style={{ color: 'var(--mf-green)' }}>
                {t('account.wachtwoord.terugInloggen')}
              </Link>
            </p>
          </>
        )}
    </AuthKaart>
  )
}
