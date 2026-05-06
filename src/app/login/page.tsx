'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type LoginStatus =
  | 'idle'
  | 'loading'
  | 'not_confirmed'
  | 'wrong_credentials'
  | 'too_many_requests'
  | 'unknown_error'
  | 'resent'
  | 'wrong_portal'

type Portaal = 'medewerker' | 'hr' | 'admin'

const PORTAAL_CONFIG: Record<Portaal, {
  label: string
  sublabel: string
  accent: string
  accentLight: string
  accentText: string
  bg: string
}> = {
  medewerker: {
    label: 'Medewerker',
    sublabel: 'Persoonlijk welzijn & check-ins',
    accent: '#1D9E75',
    accentLight: '#E1F5EE',
    accentText: '#0F6E56',
    bg: '#F4FBF8',
  },
  hr: {
    label: 'HR Manager',
    sublabel: 'Teamdata & vitaliteitsoverzicht',
    accent: '#185FA5',
    accentLight: '#E6F1FB',
    accentText: '#185FA5',
    bg: '#F0F4FF',
  },
  admin: {
    label: 'Admin',
    sublabel: 'Platform- en bedrijfsbeheer',
    accent: '#8B5CF6',
    accentLight: '#EEEDFE',
    accentText: '#3C3489',
    bg: '#F5F3FF',
  },
}

function parseSupabaseError(message: string): LoginStatus {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'not_confirmed'
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password') || m.includes('user not found')) return 'wrong_credentials'
  if (m.includes('too many requests') || m.includes('rate limit')) return 'too_many_requests'
  return 'unknown_error'
}

export default function Login() {
  const router = useRouter()
  const [gekozenPortaal, setGekozenPortaal] = useState<Portaal | null>(null)
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [toonWachtwoord, setToonWachtwoord] = useState(false)
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [resendBezig, setResendBezig] = useState(false)

  const portaalCfg = gekozenPortaal ? PORTAAL_CONFIG[gekozenPortaal] : null
  const accent = portaalCfg?.accent ?? 'var(--vitanex-primary)'
  const isLeeg = !email.trim() || !wachtwoord
  const laden = status === 'loading'

  async function inloggen() {
    if (isLeeg || laden) return
    setStatus('loading')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: wachtwoord,
    })

    if (error) {
      setStatus(parseSupabaseError(error.message))
      return
    }

    if (!data.user) { setStatus('unknown_error'); return }

    if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
      setStatus('not_confirmed')
      return
    }

    const { data: profiel } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    const rol = profiel?.rol ?? 'medewerker'

    // Warn if role doesn't match chosen portal (but still let them in)
    if (gekozenPortaal && gekozenPortaal !== rol) {
      // Role mismatch — redirect to their actual portal
    }

    if (rol === 'admin') router.push('/admin')
    else if (rol === 'hr') router.push('/dashboard')
    else router.push('/portaal')
  }

  async function stuurBevestigingOpnieuw() {
    if (!email.trim()) return
    setResendBezig(true)
    await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResendBezig(false)
    setStatus('resent')
  }

  // Portal selector screen
  if (!gekozenPortaal) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>

        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--vitanex-primary)' }}>
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Vitanex</span>
        </Link>

        <div className="max-w-lg w-full text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welkom terug</h1>
          <p className="text-gray-400 text-sm">Kies je portaal om in te loggen.</p>
        </div>

        <div className="max-w-lg w-full grid grid-cols-1 gap-3">
          {(Object.entries(PORTAAL_CONFIG) as [Portaal, typeof PORTAAL_CONFIG[Portaal]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setGekozenPortaal(key)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl border p-5 text-left transition hover:shadow-md group"
              style={{ borderColor: '#e5e7eb' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition"
                style={{ background: cfg.accent }}
              >
                {key === 'medewerker' ? 'MW' : key === 'hr' ? 'HR' : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cfg.sublabel}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                className="text-gray-300 group-hover:text-gray-500 transition flex-shrink-0">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold transition" style={{ color: 'var(--vitanex-primary)' }}>
            Gratis registreren
          </Link>
        </p>
      </main>
    )
  }

  // Login form screen
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: portaalCfg!.bg }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">

        {/* Back + Logo */}
        <div className="flex items-center justify-between mb-7">
          <button
            onClick={() => { setGekozenPortaal(null); setStatus('idle') }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Portaalkeuze
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: accent }}>
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Vitanex</span>
          </Link>
        </div>

        {/* Portal badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: portaalCfg!.accentLight }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: accent }}>
            {gekozenPortaal === 'medewerker' ? 'MW' : gekozenPortaal === 'hr' ? 'HR' : 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: portaalCfg!.accentText }}>
              {portaalCfg!.label} portaal
            </p>
            <p className="text-xs mt-0.5" style={{ color: portaalCfg!.accentText, opacity: 0.7 }}>
              {portaalCfg!.sublabel}
            </p>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Inloggen</h1>
        <p className="text-gray-400 text-sm mb-6">Voer je gegevens in.</p>

        {/* Errors */}
        {status === 'not_confirmed' && (
          <div className="rounded-xl border p-4 mb-5 flex items-start gap-3"
            style={{ background: '#FAEEDA', borderColor: '#FAC775' }}>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: '#854F0B' }}>E-mail nog niet bevestigd</p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#854F0B' }}>
                Kijk in je inbox op <strong>{email}</strong> en klik op de bevestigingslink.
              </p>
              <button onClick={stuurBevestigingOpnieuw} disabled={resendBezig}
                className="text-xs font-semibold underline disabled:opacity-50" style={{ color: '#854F0B' }}>
                {resendBezig ? 'Versturen...' : 'Opnieuw sturen'}
              </button>
            </div>
          </div>
        )}

        {status === 'resent' && (
          <div className="rounded-xl border p-4 mb-5" style={{ background: '#E1F5EE', borderColor: '#A3DECE' }}>
            <p className="text-sm font-semibold text-green-800">Bevestigingsmail verstuurd</p>
            <p className="text-xs text-green-700 mt-0.5">Klik op de link in je inbox om je account te activeren.</p>
          </div>
        )}

        {status === 'wrong_credentials' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">E-mail of wachtwoord klopt niet.</p>
            <p className="text-xs text-red-500 mt-0.5">
              Controleer je gegevens of{' '}
              <Link href="/wachtwoord-vergeten" className="underline font-medium">reset je wachtwoord</Link>.
            </p>
          </div>
        )}

        {status === 'too_many_requests' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">Te veel pogingen.</p>
            <p className="text-xs text-red-500 mt-0.5">Wacht een paar minuten en probeer opnieuw.</p>
          </div>
        )}

        {status === 'unknown_error' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">Er ging iets mis.</p>
            <p className="text-xs text-red-500 mt-0.5">
              Probeer opnieuw of neem contact op via{' '}
              <a href="mailto:kanebongers@gmail.com" className="underline">kanebongers@gmail.com</a>.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="email"
            placeholder="E-mailadres"
            value={email}
            autoFocus
            autoComplete="email"
            onChange={e => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle') }}
            onKeyDown={e => e.key === 'Enter' && inloggen()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition"
            style={{ '--tw-ring-color': accent } as React.CSSProperties}
          />
          <div className="relative">
            <input
              type={toonWachtwoord ? 'text' : 'password'}
              placeholder="Wachtwoord"
              value={wachtwoord}
              autoComplete="current-password"
              onChange={e => { setWachtwoord(e.target.value); if (status !== 'idle') setStatus('idle') }}
              onKeyDown={e => e.key === 'Enter' && inloggen()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition pr-16"
            />
            <button type="button" onClick={() => setToonWachtwoord(t => !t)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-5">
          <Link href="/wachtwoord-vergeten" className="text-xs transition" style={{ color: accent }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          onClick={inloggen}
          disabled={isLeeg || laden}
          className="w-full text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: accent }}
        >
          {laden && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {laden ? 'Inloggen...' : `Inloggen als ${portaalCfg!.label}`}
        </button>
      </div>
    </main>
  )
}
