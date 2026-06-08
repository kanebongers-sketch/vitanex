'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LogoFull } from '@/components/Logo'

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
    <main
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{
        background: 'linear-gradient(160deg, #E8F8F2 0%, #EBF4FB 50%, #F0EEFF 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,158,117,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,132,221,0.10) 0%, transparent 70%)',
        }} />
      </div>

      <div
        className="w-full max-w-sm relative mf-animate-up"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
          padding: '36px 32px',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="MentaForce home">
            <LogoFull iconSize={38} />
          </Link>
        </div>

        <h1 className="text-[22px] font-bold text-center mb-1" style={{ color: '#0D1117', letterSpacing: '-0.03em' }}>
          Welkom terug
        </h1>
        <p className="text-sm text-center mb-7" style={{ color: '#6B7280' }}>
          Log in met je e-mailadres en wachtwoord.
        </p>

        {/* Status messages */}
        {status === 'not_confirmed' && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-2xl p-4 mb-5"
            style={{ background: '#FAEEDA', border: '1px solid #FAC775' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: '#854F0B' }}>E-mail nog niet bevestigd</p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#854F0B' }}>
              Kijk in je inbox op <strong>{email}</strong> en klik op de bevestigingslink.
            </p>
            <button
              onClick={stuurBevestigingOpnieuw}
              disabled={resendBezig}
              className="text-xs font-semibold underline disabled:opacity-50"
              style={{ color: '#854F0B' }}
            >
              {resendBezig ? 'Versturen...' : 'Opnieuw sturen'}
            </button>
          </div>
        )}

        {status === 'resent' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: '#E1F5EE', border: '1px solid #A3DECE' }}>
            <p className="text-sm font-semibold" style={{ color: '#0F6E56' }}>✓ Bevestigingsmail verstuurd</p>
            <p className="text-xs mt-0.5" style={{ color: '#15785A' }}>Klik op de link in je inbox om je account te activeren.</p>
          </div>
        )}

        {status === 'wrong_credentials' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: '#FCEBEB', border: '1px solid #FBBFBF' }}>
            <p className="text-sm font-semibold" style={{ color: '#A32D2D' }}>E-mail of wachtwoord klopt niet</p>
            <p className="text-xs mt-0.5" style={{ color: '#C45252' }}>
              Controleer je gegevens of{' '}
              <Link href="/wachtwoord-vergeten" className="underline font-medium">reset je wachtwoord</Link>.
            </p>
          </div>
        )}

        {status === 'too_many_requests' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: '#FCEBEB', border: '1px solid #FBBFBF' }}>
            <p className="text-sm font-semibold" style={{ color: '#A32D2D' }}>Te veel pogingen</p>
            <p className="text-xs mt-0.5" style={{ color: '#C45252' }}>Wacht een paar minuten en probeer opnieuw.</p>
          </div>
        )}

        {status === 'unknown_error' && (
          <div role="alert" aria-live="assertive" className="rounded-2xl p-4 mb-5" style={{ background: '#FCEBEB', border: '1px solid #FBBFBF' }}>
            <p className="text-sm font-semibold" style={{ color: '#A32D2D' }}>Er ging iets mis</p>
            <p className="text-xs mt-0.5" style={{ color: '#C45252' }}>
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
              fontSize: 15,
              border: '1.5px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.8)',
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
                fontSize: 15,
                border: '1.5px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.8)',
              }}
            />
            <button
              type="button"
              onClick={() => setToonWacht(t => !t)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition"
              style={{ color: '#9CA3AF' }}
            >
              {toonWacht ? 'Verberg' : 'Toon'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-5">
          <Link href="/wachtwoord-vergeten" className="text-xs font-medium transition hover:opacity-70" style={{ color: '#1D9E75' }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          onClick={inloggen}
          disabled={isLeeg || laden}
          className="w-full text-white rounded-2xl py-3.5 text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            background: isLeeg ? '#9CA3AF' : 'linear-gradient(135deg, #1D9E75 0%, #15785A 100%)',
            boxShadow: isLeeg ? 'none' : '0 4px 16px rgba(29,158,117,0.4)',
            fontSize: 15,
          }}
        >
          {laden && <div className="mf-spinner-white" />}
          {laden ? 'Inloggen...' : 'Inloggen'}
        </button>

        <p className="text-xs text-center mt-6" style={{ color: '#9CA3AF' }}>
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: '#1D9E75' }}>
            Gratis registreren
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-[11px] mt-6 text-center" style={{ color: 'rgba(0,0,0,0.35)' }}>
        AVG-conform · Anoniem · Veilig versleuteld
      </p>
    </main>
  )
}
