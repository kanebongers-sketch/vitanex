'use client'

export const dynamic = 'force-dynamic'

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>

      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">

        {/* Logo */}
        <div className="flex justify-center mb-7">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#1D9E75' }}>
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">MentaForce</span>
          </Link>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">Welkom terug</h1>
        <p className="text-gray-400 text-sm mb-7 text-center">Log in met je e-mailadres en wachtwoord.</p>

        {/* Foutmeldingen */}
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
              <a href="mailto:info@mentaforce.nl" className="underline">info@mentaforce.nl</a>.
            </p>
          </div>
        )}

        {/* Formulier */}
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
            <button type="button" onClick={() => setToonWachtwoord(t => !t)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-5">
          <Link href="/wachtwoord-vergeten" className="text-xs transition" style={{ color: '#1D9E75' }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          onClick={inloggen}
          disabled={isLeeg || laden}
          className="w-full text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#1D9E75' }}
        >
          {laden && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {laden ? 'Inloggen...' : 'Inloggen'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-5">
          Nog geen account?{' '}
          <Link href="/register" className="font-semibold transition" style={{ color: '#1D9E75' }}>
            Gratis registreren
          </Link>
        </p>
      </div>
    </main>
  )
}
