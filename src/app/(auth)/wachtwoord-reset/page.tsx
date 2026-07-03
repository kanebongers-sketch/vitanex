'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Check, Clock } from 'lucide-react'
import { LogoFull } from '@/components/layout/Logo'

type Status = 'laden' | 'gereed' | 'opslaan' | 'klaar' | 'fout_token' | 'fout_opslaan'

const KAART_STIJL = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  padding: '36px 32px',
} as const

export default function WachtwoordReset() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('laden')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bevestig, setBevestig] = useState('')
  const [toon, setToon] = useState(false)

  useEffect(() => {
    // Supabase stuurt de sessie-tokens via de URL hash na redirect
    // supabase-js v2 pakt dit automatisch op via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('gereed')
      }
    })

    // Timeout — als er na 5s geen PASSWORD_RECOVERY event is, is de link verlopen
    const timer = setTimeout(() => {
      setStatus(s => s === 'laden' ? 'fout_token' : s)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const sterkte = wachtwoord.length < 8 ? 0 : wachtwoord.length < 12 ? 1 : wachtwoord.length < 16 ? 2 : 3

  async function slaOp() {
    if (!wachtwoord || wachtwoord !== bevestig || wachtwoord.length < 8) return
    setStatus('opslaan')

    const { error } = await supabase.auth.updateUser({ password: wachtwoord })

    if (error) {
      setStatus('fout_opslaan')
      return
    }

    setStatus('klaar')
    setTimeout(() => router.push('/home'), 2500)
  }

  if (status === 'laden') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="mf-spinner mx-auto mb-4" aria-hidden style={{ width: 32, height: 32, display: 'block' }} />
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Link controleren...</p>
      </div>
    </main>
  )

  if (status === 'fout_token') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center mf-animate-up" style={KAART_STIJL}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--mf-amber-light)' }}
        >
          <Clock size={28} aria-hidden style={{ color: 'var(--mf-amber)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Link verlopen</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-2)' }}>
          De resetlink is verlopen of al gebruikt. Vraag een nieuwe link aan.
        </p>
        <Link href="/wachtwoord-vergeten"
          className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
          Nieuwe resetlink aanvragen
        </Link>
      </div>
    </main>
  )

  if (status === 'klaar') return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center mf-animate-up" style={KAART_STIJL}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--mf-green-light)' }}
        >
          <Check size={28} strokeWidth={3} aria-hidden style={{ color: 'var(--mf-green)' }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Wachtwoord gewijzigd</h1>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Je wordt doorgestuurd naar het inlogscherm...</p>
      </div>
    </main>
  )

  return (
    <main className="mf-mesh-bg min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm mf-animate-up" style={KAART_STIJL}>

        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="MentaForce home">
            <LogoFull iconSize={38} />
          </Link>
        </div>

        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Nieuw wachtwoord instellen</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>Kies een sterk wachtwoord van minimaal 8 tekens.</p>

        {status === 'fout_opslaan' && (
          <div id="reset-fout" role="alert" aria-live="assertive" className="rounded-xl px-4 py-3 mb-5"
            style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--mf-red)' }}>Opslaan mislukt.</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mf-red)' }}>Probeer opnieuw of vraag een nieuwe link aan.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <label htmlFor="reset-wachtwoord" className="sr-only">Nieuw wachtwoord</label>
            <input
              id="reset-wachtwoord"
              type={toon ? 'text' : 'password'}
              placeholder="Nieuw wachtwoord"
              value={wachtwoord}
              autoFocus
              autoComplete="new-password"
              aria-describedby={status === 'fout_opslaan' ? 'reset-fout' : undefined}
              onChange={e => setWachtwoord(e.target.value)}
              className="mf-input pr-16"
              style={{ width: '100%', borderRadius: 14, padding: '12px 60px 12px 16px' }}
            />
            <button type="button" onClick={() => setToon(t => !t)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium transition hover:opacity-70"
              style={{ color: 'var(--text-3)' }}>
              {toon ? 'Verberg' : 'Toon'}
            </button>
          </div>

          {wachtwoord.length > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: sterkte > i ? ['var(--mf-red)', 'var(--mf-amber)', 'var(--mf-green)'][i] : 'var(--border)' }} />
              ))}
              <span className="text-xs w-10 font-medium" style={{ color: 'var(--text-3)' }}>
                {['Te kort', 'Matig', 'Goed', 'Sterk'][sterkte]}
              </span>
            </div>
          )}

          <label htmlFor="reset-bevestig" className="sr-only">Bevestig nieuw wachtwoord</label>
          <input
            id="reset-bevestig"
            type={toon ? 'text' : 'password'}
            placeholder="Bevestig nieuw wachtwoord"
            value={bevestig}
            autoComplete="new-password"
            aria-describedby={bevestig && wachtwoord !== bevestig ? 'reset-mismatch' : undefined}
            onChange={e => setBevestig(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && slaOp()}
            className="mf-input"
            style={{
              borderRadius: 14,
              padding: '12px 16px',
              borderColor: bevestig && wachtwoord !== bevestig ? 'var(--mf-red)' : undefined,
            }}
          />
          {bevestig && wachtwoord !== bevestig && (
            <p id="reset-mismatch" className="text-xs -mt-1" style={{ color: 'var(--mf-red)' }}>Wachtwoorden komen niet overeen</p>
          )}
        </div>

        <button
          onClick={slaOp}
          disabled={
            status === 'opslaan' ||
            !wachtwoord ||
            !bevestig ||
            wachtwoord !== bevestig ||
            wachtwoord.length < 8
          }
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
          {status === 'opslaan' && (
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
          {status === 'opslaan' ? 'Opslaan...' : 'Wachtwoord opslaan'}
        </button>
      </div>
    </main>
  )
}
