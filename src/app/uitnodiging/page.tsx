'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

type Status = 'laden' | 'gereed' | 'ongeldig' | 'registreren' | 'bevestig_nodig' | 'al_geregistreerd' | 'fout'

function UitnodigingForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState<Status>('laden')
  const [wachtwoord, setWachtwoord] = useState('')
  const [naam, setNaam] = useState('')
  const [toonWachtwoord, setToonWachtwoord] = useState(false)
  const [foutMelding, setFoutMelding] = useState('')
  const [tokenData, setTokenData] = useState<{ email: string; bedrijf_id: string } | null>(null)

  useEffect(() => {
    async function checkToken() {
      if (!token) { setStatus('ongeldig'); return }

      const { data } = await supabase
        .from('uitnodiging_tokens')
        .select('email, bedrijf_id, gebruikt')
        .eq('token', token)
        .single()

      if (!data || data.gebruikt) { setStatus('ongeldig'); return }
      setTokenData({ email: data.email, bedrijf_id: data.bedrijf_id })
      setStatus('gereed')
    }
    checkToken()
  }, [token])

  const sterkte = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3

  async function registreren() {
    if (!wachtwoord || !naam.trim() || !tokenData) return
    if (wachtwoord.length < 8) { setFoutMelding('Wachtwoord moet minimaal 8 tekens zijn.'); return }
    setStatus('registreren')
    setFoutMelding('')

    const { data, error } = await supabase.auth.signUp({
      email: tokenData.email,
      password: wachtwoord,
      options: {
        data: { naam: naam.trim() },
      },
    })

    if (error) {
      // Account bestaat al met dit e-mailadres
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already')) {
        setStatus('al_geregistreerd')
        return
      }
      setFoutMelding('Er ging iets mis. Probeer opnieuw.')
      setStatus('gereed')
      return
    }

    if (!data.user) {
      setFoutMelding('Er ging iets mis. Probeer opnieuw.')
      setStatus('gereed')
      return
    }

    // Profiel aanmaken
    await supabase.from('profiles').upsert({
      id: data.user.id,
      naam: naam.trim(),
      bedrijf_id: tokenData.bedrijf_id,
      rol: 'medewerker',
    })

    // Token markeren als gebruikt
    await supabase.from('uitnodiging_tokens').update({ gebruikt: true }).eq('token', token)

    // Welkomstmail sturen (fire-and-forget)
    fetch('/api/welkom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam: naam.trim(), email: tokenData.email }),
    }).catch(() => {})

    // Check of e-mail bevestiging vereist is
    // Als email_confirmed_at null is, is bevestiging nodig
    if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
      setStatus('bevestig_nodig')
    } else {
      // Direct ingelogd (bijv. als Supabase email confirmation uitstaat)
      router.push('/checkin')
    }
  }

  if (status === 'laden') return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
        style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
    </main>
  )

  if (status === 'ongeldig') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Link niet geldig</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Deze uitnodigingslink is ongeldig of al eerder gebruikt. Vraag je HR-manager om een nieuwe uitnodiging te sturen.
        </p>
        <a href="mailto:info@mentaforce.nl"
          className="text-sm font-medium transition" style={{ color: 'var(--mentaforce-primary)' }}>
          Contact opnemen
        </a>
      </div>
    </main>
  )

  if (status === 'al_geregistreerd') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-4">👤</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Account bestaat al</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Er bestaat al een account voor <strong>{tokenData?.email}</strong>. Log gewoon in om verder te gaan.
        </p>
        <a href="/login"
          className="block w-full text-center py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mentaforce-primary)' }}>
          Inloggen
        </a>
      </div>
    </main>
  )

  if (status === 'bevestig_nodig') return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Bevestig je e-mail</h1>
        <p className="text-sm text-gray-500 mb-2 leading-relaxed">
          We hebben een bevestigingsmail gestuurd naar
        </p>
        <p className="font-semibold text-gray-900 mb-6">{tokenData?.email}</p>
        <p className="text-xs text-gray-400 mb-8 leading-relaxed">
          Klik op de link in de mail om je account te activeren. Controleer ook je spam-map als je niets ontvangt.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex flex-col gap-2.5">
            {[
              'Klik op de link in de bevestigingsmail',
              'Je wordt doorgestuurd naar het inlogscherm',
              'Log in en doe je eerste check-in',
            ].map((stap, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--mentaforce-primary)' }}>
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600">{stap}</p>
              </div>
            ))}
          </div>
        </div>

        <a href="/login"
          className="block w-full text-center py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mentaforce-primary)' }}>
          Ga naar inloggen
        </a>
        <button
          onClick={() => supabase.auth.resend({ type: 'signup', email: tokenData?.email ?? '' })}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition underline">
          Bevestigingsmail opnieuw sturen
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8">

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--mentaforce-primary)' }}>
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-gray-900">MentaForce</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Je bent uitgenodigd</h1>
        <p className="text-gray-500 text-sm mb-5 leading-relaxed">
          Maak je account aan om te starten met MentaForce.
        </p>

        {tokenData && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3 mb-6 border border-gray-100">
            <span>📧</span>
            <span>Account voor: <strong>{tokenData.email}</strong></span>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-2">
          <input
            type="text"
            placeholder="Jouw naam"
            value={naam}
            autoFocus
            onChange={e => setNaam(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition"
          />
          <div className="relative">
            <input
              type={toonWachtwoord ? 'text' : 'password'}
              placeholder="Kies een wachtwoord (min. 8 tekens)"
              value={wachtwoord}
              onChange={e => setWachtwoord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registreren()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition pr-16"
            />
            <button type="button" onClick={() => setToonWachtwoord(t => !t)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
          {wachtwoord.length > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: sterkte > i ? ['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)'][i] : 'var(--border)' }} />
              ))}
              <span className="text-xs text-gray-400 w-10">
                {['Te kort', 'Matig', 'Goed', 'Sterk'][sterkte]}
              </span>
            </div>
          )}
        </div>

        {foutMelding && (
          <p className="text-red-500 text-sm mt-3 mb-1">{foutMelding}</p>
        )}

        <button
          onClick={registreren}
          disabled={status === 'registreren' || !wachtwoord || !naam.trim() || wachtwoord.length < 8}
          className="w-full mt-5 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-30 flex items-center justify-center gap-2"
          style={{ background: 'var(--mentaforce-primary)' }}>
          {status === 'registreren' && (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          {status === 'registreren' ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </div>
    </main>
  )
}

export default function Uitnodiging() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin"
          style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
      </main>
    }>
      <UitnodigingForm />
    </Suspense>
  )
}
