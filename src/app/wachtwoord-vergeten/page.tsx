'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'verstuurd' | 'not_found' | 'error'

export default function WachtwoordVergeten() {
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">

        <Link href="/login" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--mentaforce-primary)' }}>
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-gray-900">MentaForce</span>
        </Link>

        {status === 'verstuurd' ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
              style={{ background: 'var(--mf-green-light)' }}>
              📬
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Mail verstuurd</h1>
            <p className="text-sm text-gray-500 mb-2 leading-relaxed">
              We hebben een resetlink gestuurd naar
            </p>
            <p className="font-semibold text-gray-900 mb-6">{email}</p>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed">
              Klik op de link in de mail om een nieuw wachtwoord in te stellen. Controleer ook je spam-map.
            </p>
            <Link href="/login"
              className="block w-full text-center py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
              style={{ background: 'var(--mentaforce-primary)' }}>
              Terug naar inloggen
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Wachtwoord vergeten</h1>
            <p className="text-gray-400 text-sm mb-8">
              Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen.
            </p>

            {status === 'not_found' && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
                <p className="text-sm text-red-700 font-medium">Geen account gevonden.</p>
                <p className="text-xs text-red-500 mt-0.5">
                  Dit e-mailadres is niet geregistreerd.{' '}
                  <Link href="/register" className="underline font-medium">Registreer je</Link>.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
                <p className="text-sm text-red-700 font-medium">Er ging iets mis.</p>
                <p className="text-xs text-red-500 mt-0.5">Probeer het opnieuw.</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-6">
              <input
                type="email"
                placeholder="E-mailadres"
                value={email}
                autoFocus
                autoComplete="email"
                onChange={e => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle') }}
                onKeyDown={e => e.key === 'Enter' && stuurResetMail()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>

            <button
              onClick={stuurResetMail}
              disabled={!email.trim() || status === 'loading'}
              className="w-full text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'var(--mentaforce-primary)' }}>
              {status === 'loading' && (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {status === 'loading' ? 'Versturen...' : 'Resetlink versturen'}
            </button>

            <p className="text-xs text-center text-gray-400 mt-6">
              <Link href="/login" className="font-medium hover:text-gray-600 transition">
                Terug naar inloggen
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
