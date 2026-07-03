'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'
import { Link2Off, Mail, MailCheck, UserRound } from 'lucide-react'
import { LogoFull } from '@/components/layout/Logo'

type Status = 'laden' | 'gereed' | 'ongeldig' | 'registreren' | 'bevestig_nodig' | 'al_geregistreerd' | 'fout'

const KAART_STIJL = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  padding: '36px 32px',
} as const

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
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center">
      <span className="mf-spinner" aria-hidden style={{ width: 32, height: 32 }} />
    </main>
  )

  if (status === 'ongeldig') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center mf-animate-up" style={KAART_STIJL}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--mf-red-light)' }}
        >
          <Link2Off size={28} aria-hidden style={{ color: 'var(--mf-red)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Link niet geldig</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Deze uitnodigingslink is ongeldig of al eerder gebruikt. Vraag je HR-manager om een nieuwe uitnodiging te sturen.
        </p>
        <a href="mailto:info@mentaforce.nl"
          className="text-sm font-medium transition hover:opacity-70" style={{ color: 'var(--mf-green)' }}>
          Contact opnemen
        </a>
      </div>
    </main>
  )

  if (status === 'al_geregistreerd') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center mf-animate-up" style={KAART_STIJL}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--mf-green-light)' }}
        >
          <UserRound size={28} aria-hidden style={{ color: 'var(--mf-green)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Account bestaat al</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Er bestaat al een account voor <strong style={{ color: 'var(--text-1)' }}>{tokenData?.email}</strong>. Log gewoon in om verder te gaan.
        </p>
        <a href="/login"
          className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
          Inloggen
        </a>
      </div>
    </main>
  )

  if (status === 'bevestig_nodig') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center mf-animate-up" style={KAART_STIJL}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--mf-green-light)' }}
        >
          <MailCheck size={28} aria-hidden style={{ color: 'var(--mf-green)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Bevestig je e-mail</h1>
        <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          We hebben een bevestigingsmail gestuurd naar
        </p>
        <p className="font-semibold mb-6" style={{ color: 'var(--text-1)' }}>{tokenData?.email}</p>
        <p className="text-xs mb-8 leading-relaxed" style={{ color: 'var(--text-3)' }}>
          Klik op de link in de mail om je account te activeren. Controleer ook je spam-map als je niets ontvangt.
        </p>

        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-2.5">
            {[
              'Klik op de link in de bevestigingsmail',
              'Je wordt doorgestuurd naar het inlogscherm',
              'Log in en doe je eerste check-in',
            ].map((stap, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
                  {i + 1}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>{stap}</p>
              </div>
            ))}
          </div>
        </div>

        <a href="/login"
          className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
          Ga naar inloggen
        </a>
        <button
          onClick={() => supabase.auth.resend({ type: 'signup', email: tokenData?.email ?? '' })}
          className="mt-3 text-xs transition hover:opacity-70 underline"
          style={{ color: 'var(--text-3)' }}>
          Bevestigingsmail opnieuw sturen
        </button>
      </div>
    </main>
  )

  return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm mf-animate-up" style={KAART_STIJL}>

        <div className="flex justify-center mb-8">
          <LogoFull iconSize={38} />
        </div>

        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Je bent uitgenodigd</h1>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Maak je account aan om te starten met MentaForce.
        </p>

        {tokenData && (
          <div className="flex items-center gap-2 text-xs rounded-xl px-4 py-3 mb-6"
            style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <Mail size={14} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0 }} />
            <span>Account voor: <strong style={{ color: 'var(--text-1)' }}>{tokenData.email}</strong></span>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-2">
          <label htmlFor="uitn-naam" className="sr-only">Jouw naam</label>
          <input
            id="uitn-naam"
            type="text"
            placeholder="Jouw naam"
            value={naam}
            autoFocus
            autoComplete="name"
            onChange={e => setNaam(e.target.value)}
            className="mf-input"
            style={{ borderRadius: 14, padding: '12px 16px' }}
          />
          <div className="relative">
            <label htmlFor="uitn-wachtwoord" className="sr-only">Wachtwoord</label>
            <input
              id="uitn-wachtwoord"
              type={toonWachtwoord ? 'text' : 'password'}
              placeholder="Kies een wachtwoord (min. 8 tekens)"
              value={wachtwoord}
              autoComplete="new-password"
              aria-describedby={foutMelding ? 'uitn-fout' : undefined}
              onChange={e => setWachtwoord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && registreren()}
              className="mf-input pr-16"
              style={{ width: '100%', borderRadius: 14, padding: '12px 60px 12px 16px' }}
            />
            <button type="button" onClick={() => setToonWachtwoord(t => !t)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition hover:opacity-70"
              style={{ color: 'var(--text-3)' }}>
              {toonWachtwoord ? 'Verberg' : 'Toon'}
            </button>
          </div>
          {wachtwoord.length > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: sterkte > i ? ['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)'][i] : 'var(--border)' }} />
              ))}
              <span className="text-xs w-10" style={{ color: 'var(--text-3)' }}>
                {['Te kort', 'Matig', 'Goed', 'Sterk'][sterkte]}
              </span>
            </div>
          )}
        </div>

        {foutMelding && (
          <p id="uitn-fout" role="alert" aria-live="assertive" className="text-sm mt-3 mb-1" style={{ color: 'var(--mf-red)' }}>{foutMelding}</p>
        )}

        <button
          onClick={registreren}
          disabled={status === 'registreren' || !wachtwoord || !naam.trim() || wachtwoord.length < 8}
          className="w-full mt-5 rounded-2xl py-3.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
          {status === 'registreren' && (
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
          {status === 'registreren' ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </div>
    </main>
  )
}

export default function Uitnodiging() {
  return (
    <Suspense fallback={
      <main className="mf-mesh-bg min-h-screen flex items-center justify-center">
        <span className="mf-spinner" aria-hidden style={{ width: 32, height: 32 }} />
      </main>
    }>
      <UitnodigingForm />
    </Suspense>
  )
}
