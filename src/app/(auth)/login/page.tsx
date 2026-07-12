'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { LogoFull } from '@/components/layout/Logo'
import { AuthKaart } from '@/components/ui/AuthKaart'

type LoginStatus =
  | 'idle'
  | 'loading'
  | 'not_confirmed'
  | 'wrong_credentials'
  | 'too_many_requests'
  | 'unknown_error'
  | 'resent'

function parseSupabaseError(message: string): LoginStatus {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'not_confirmed'
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password') || m.includes('user not found')) return 'wrong_credentials'
  if (m.includes('too many requests') || m.includes('rate limit')) return 'too_many_requests'
  return 'unknown_error'
}

export default function Login() {
  const router = useRouter()
  const [email,        setEmail]        = useState('')
  const [wachtwoord,   setWachtwoord]   = useState('')
  const [toonWacht,    setToonWacht]    = useState(false)
  const [status,       setStatus]       = useState<LoginStatus>('idle')
  const [resendBezig,  setResendBezig]  = useState(false)

  const isLeeg = !email.trim() || !wachtwoord
  const laden  = status === 'loading'

  async function inloggen() {
    if (isLeeg || laden) return
    setStatus('loading')

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password: wachtwoord,
    })

    if (error) { setStatus(parseSupabaseError(error.message)); return }
    if (!data.user) { setStatus('unknown_error'); return }

    if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
      setStatus('not_confirmed'); return
    }

    const { data: profiel } = await supabase
      .from('profiles').select('rol, onboarding_voltooid').eq('id', data.user.id).single()

    // Onboarding nog niet gedaan → wizard eerst
    if (!profiel?.onboarding_voltooid) {
      router.push('/onboarding')
      return
    }

    const rol = profiel?.rol ?? 'medewerker'
    if (rol === 'admin') router.push('/admin')
    else if (rol === 'hr') router.push('/dashboard')
    else router.push('/home')
  }

  async function stuurBevestigingOpnieuw() {
    if (!email.trim()) return
    setResendBezig(true)
    await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResendBezig(false)
    setStatus('resent')
  }

  return (
    <AuthKaart
      className="relative"
      achtergrond={
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--mf-green-light) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-5%',
            width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--mf-green) 8%, transparent) 0%, transparent 70%)',
          }} />
        </div>
      }
      naKaart={
        <p className="text-[11px] mt-6 text-center" style={{ color: 'var(--text-4)' }}>
          AVG-conform · Anoniem · Veilig versleuteld
        </p>
      }
    >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="MentaForce home">
            <LogoFull iconSize={38} />
          </Link>
        </div>

        <h1 className="text-[22px] font-bold text-center mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
          Welkom terug
        </h1>
        <p className="text-sm text-center mb-7" style={{ color: 'var(--text-2)' }}>
          Log in met je e-mailadres en wachtwoord.
        </p>

        {/* Status messages */}
        {status === 'not_confirmed' && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-2xl p-4 mb-5"
            style={{ background: 'var(--mf-amber-light)', border: '1px solid var(--mf-amber)' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--mf-amber-dark)' }}>E-mail nog niet bevestigd</p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--mf-amber-dark)' }}>
              Kijk in je inbox op <strong>{email}</strong> en klik op de bevestigingslink.
            </p>
            <button
              onClick={stuurBevestigingOpnieuw}
              disabled={resendBezig}
              className="text-xs font-semibold underline disabled:opacity-50"
              style={{ color: 'var(--mf-amber-dark)' }}
            >
              {resendBezig ? 'Versturen...' : 'Opnieuw sturen'}
            </button>
          </div>
        )}

        {status === 'resent' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mf-green)' }}>
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--mf-green-dark)' }}>
              <Check size={14} strokeWidth={3} aria-hidden /> Bevestigingsmail verstuurd
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mf-green-mid)' }}>Klik op de link in je inbox om je account te activeren.</p>
          </div>
        )}

        {status === 'wrong_credentials' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--mf-red)' }}>E-mail of wachtwoord klopt niet</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>
              Controleer je gegevens of{' '}
              <Link href="/wachtwoord-vergeten" className="underline font-medium">reset je wachtwoord</Link>.
            </p>
          </div>
        )}

        {status === 'too_many_requests' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--mf-red)' }}>Te veel pogingen</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>Wacht een paar minuten en probeer opnieuw.</p>
          </div>
        )}

        {status === 'unknown_error' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--mf-red)' }}>Er ging iets mis</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>
              Probeer opnieuw of neem contact op via{' '}
              <a href="mailto:info@mentaforce.nl" className="underline">info@mentaforce.nl</a>.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <label htmlFor="login-email" className="sr-only">E-mailadres</label>
          <input
            id="login-email"
            type="email"
            placeholder="E-mailadres"
            value={email}
            autoFocus
            autoComplete="email"
            onChange={e => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle') }}
            onKeyDown={e => e.key === 'Enter' && inloggen()}
            className="mf-input"
            style={{
              borderRadius: 14,
              padding: '12px 16px',
            }}
          />
          <div className="relative">
            <label htmlFor="login-wachtwoord" className="sr-only">Wachtwoord</label>
            <input
              id="login-wachtwoord"
              type={toonWacht ? 'text' : 'password'}
              placeholder="Wachtwoord"
              value={wachtwoord}
              autoComplete="current-password"
              onChange={e => { setWachtwoord(e.target.value); if (status !== 'idle') setStatus('idle') }}
              onKeyDown={e => e.key === 'Enter' && inloggen()}
              className="mf-input pr-16"
              style={{
                width: '100%',
                borderRadius: 14,
                padding: '12px 60px 12px 16px',
              }}
            />
            <button
              type="button"
              onClick={() => setToonWacht(t => !t)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition"
              style={{ color: 'var(--text-3)' }}
            >
              {toonWacht ? 'Verberg' : 'Toon'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-5">
          <Link href="/wachtwoord-vergeten" className="text-xs font-medium transition hover:opacity-70" style={{ color: 'var(--mf-green)' }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          onClick={inloggen}
          disabled={isLeeg || laden}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            background: isLeeg ? 'var(--border-strong)' : 'var(--mf-green)',
            color: isLeeg ? 'var(--text-3)' : 'var(--bg-app)',
            boxShadow: isLeeg ? 'none' : '0 4px 16px color-mix(in srgb, var(--mf-green) 30%, transparent)',
            fontSize: 15,
          }}
        >
          {laden && (
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
          {laden ? 'Bezig...' : 'Inloggen'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>of</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google SSO */}
        <button
          onClick={async () => {
            await import('@/lib/supabase/supabase').then(({ supabase }) =>
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/onboarding' },
              })
            )
          }}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 text-sm font-semibold transition mf-pressable"
          style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-strong)',
            color: 'var(--text-2)',
            fontSize: 15,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Inloggen met Google
        </button>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-3)' }}>
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--mf-green)' }}>
            Gratis registreren
          </Link>
        </p>
    </AuthKaart>
  )
}
