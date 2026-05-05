'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type LoginStatus =
  | 'idle'
  | 'loading'
  | 'not_confirmed'   // account bestaat maar email niet bevestigd
  | 'wrong_credentials'
  | 'too_many_requests'
  | 'unknown_error'
  | 'resent'          // bevestigingsmail opnieuw verstuurd

function parseSupabaseError(message: string): LoginStatus {
  const m = message.toLowerCase()
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) return 'not_confirmed'
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password') || m.includes('user not found')) return 'wrong_credentials'
  if (m.includes('too many requests') || m.includes('rate limit')) return 'too_many_requests'
  return 'unknown_error'
}

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [toonWachtwoord, setToonWachtwoord] = useState(false)
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [resendBezig, setResendBezig] = useState(false)

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

    if (!data.user) {
      setStatus('unknown_error')
      return
    }

    // Check of email bevestigd is (extra zekerheid)
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
    router.push(rol === 'medewerker' ? '/checkin' : '/dashboard')
  }

  async function stuurBevestigingOpnieuw() {
    if (!email.trim()) return
    setResendBezig(true)
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    })
    setResendBezig(false)
    setStatus('resent')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--vitanex-primary)' }}>
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-semibold text-gray-900">Vitanex</span>
        </Link>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Welkom terug</h1>
        <p className="text-gray-400 text-sm mb-8">Log in op je account.</p>

        {/* Email not confirmed banner */}
        {status === 'not_confirmed' && (
          <div className="rounded-xl border p-4 mb-5 flex items-start gap-3"
            style={{ background: '#FAEEDA', borderColor: '#FAC775' }}>
            <span className="text-xl mt-0.5">📬</span>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: '#854F0B' }}>
                Je e-mail is nog niet bevestigd
              </p>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#854F0B' }}>
                Kijk in je inbox op <strong>{email}</strong> en klik op de bevestigingslink. Controleer ook je spam-map.
              </p>
              <button
                onClick={stuurBevestigingOpnieuw}
                disabled={resendBezig}
                className="text-xs font-semibold underline disabled:opacity-50 transition"
                style={{ color: '#854F0B' }}>
                {resendBezig ? 'Versturen...' : 'Bevestigingsmail opnieuw sturen'}
              </button>
            </div>
          </div>
        )}

        {/* Resent confirmation banner */}
        {status === 'resent' && (
          <div className="rounded-xl border p-4 mb-5 flex items-start gap-3"
            style={{ background: '#E1F5EE', borderColor: '#A3DECE' }}>
            <span className="text-xl mt-0.5">✅</span>
            <div>
              <p className="text-sm font-semibold mb-0.5 text-green-800">Bevestigingsmail verstuurd</p>
              <p className="text-xs text-green-700">
                We hebben een nieuwe mail gestuurd naar {email}. Klik op de link om je account te activeren.
              </p>
            </div>
          </div>
        )}

        {/* Wrong credentials error */}
        {status === 'wrong_credentials' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">E-mail of wachtwoord klopt niet.</p>
            <p className="text-xs text-red-500 mt-0.5">
              Controleer je gegevens of{' '}
              <Link href="/wachtwoord-vergeten" className="underline font-medium">reset je wachtwoord</Link>.
            </p>
          </div>
        )}

        {/* Rate limit error */}
        {status === 'too_many_requests' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">Te veel pogingen.</p>
            <p className="text-xs text-red-500 mt-0.5">
              Wacht een paar minuten en probeer opnieuw.
            </p>
          </div>
        )}

        {/* Generic error */}
        {status === 'unknown_error' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">Er ging iets mis.</p>
            <p className="text-xs text-red-500 mt-0.5">
              Probeer het opnieuw of neem contact op via{' '}
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
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition"
          />
          <div className="relative">
            <input
              type={toonWachtwoord ? 'text' : 'password'}
              placeholder="Wachtwoord"
              value={wachtwoord}
              autoComplete="current-password"
              onChange={e => { setWachtwoord(e.target.value); if (status !== 'idle') setStatus('idle') }}
              onKeyDown={e => e.key === 'Enter' && inloggen()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition pr-16"
            />
            <button
              type="button"
              onClick={() => setToonWachtwoord(t => !t)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end mb-5">
          <Link href="/wachtwoord-vergeten"
            className="text-xs transition"
            style={{ color: 'var(--vitanex-primary)' }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          onClick={inloggen}
          disabled={isLeeg || laden}
          className="w-full text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--vitanex-primary)' }}>
          {laden && (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          {laden ? 'Inloggen...' : 'Inloggen'}
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold transition" style={{ color: 'var(--vitanex-primary)' }}>
            Gratis registreren
          </Link>
        </p>
      </div>
    </main>
  )
}
