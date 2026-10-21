'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Link from 'next/link'
import { Check, Settings } from 'lucide-react'
import { AuthKaart } from '@/components/ui/AuthKaart'

type Stap = 'controleer' | 'token' | 'bezig' | 'klaar' | 'fout'

export default function Setup() {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>('controleer')
  const [mgmtToken, setMgmtToken] = useState('')
  const [resultaat, setResultaat] = useState<Record<string, string> | null>(null)
  const [foutmelding, setFoutmelding] = useState('')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Controleer toegang bij laden
  useEffect(() => {
    async function controleerToegang() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (profiel?.rol !== 'admin') {
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
        setStap('token')
      }
    }
    controleerToegang()
  }, [router])

  async function uitvoeren() {
    if (!mgmtToken.trim()) return
    setStap('bezig')

    // Init-route aanroepen met het Bearer-token van de ingelogde admin
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/init-documenten-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ mgmtToken }),
    })

    const data = await res.json()
    if (res.ok) {
      setResultaat(data)
      setStap('klaar')
    } else {
      setFoutmelding(data.error ?? 'Er ging iets mis')
      setStap('fout')
    }
  }

  if (isAdmin === null) {
    return (
      <main className="mf-mesh-bg min-h-screen flex items-center justify-center">
        <span className="mf-spinner" aria-hidden style={{ width: 24, height: 24 }} />
      </main>
    )
  }

  if (isAdmin === false) {
    return (
      <AuthKaart className="text-center">
        <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Geen toegang</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>Alleen admins kunnen de setup uitvoeren.</p>
        <Link href="/admin" className="text-sm underline transition hover:opacity-70" style={{ color: 'var(--mf-green)' }}>
          ← Terug naar admin
        </Link>
      </AuthKaart>
    )
  }

  return (
    <AuthKaart maxWidth="lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--mf-green-light)' }}>
            <Settings size={20} aria-hidden style={{ color: 'var(--mf-green)' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>Documenten setup</h1>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Eenmalig uitvoeren om het dossier-systeem te activeren</p>
          </div>
        </div>

        {stap === 'token' && (
          <>
            <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--mf-green-light)', borderLeft: '3px solid var(--mf-green)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Supabase Management Token nodig</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Dit token geeft eenmalig toestemming om de database-tabel aan te maken.
                Het wordt nergens opgeslagen.
              </p>
            </div>

            <ol className="text-sm mb-5 space-y-2" style={{ color: 'var(--text-2)' }}>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>1</span>
                <span>Ga naar <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="underline font-medium transition hover:opacity-70" style={{ color: 'var(--mf-green)' }}>supabase.com/dashboard/account/tokens</a></span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>2</span>
                <span>Klik <strong>Generate new token</strong> → naam bijv. &quot;MentaForce setup&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>3</span>
                <span>Kopieer het token en plak het hieronder</span>
              </li>
            </ol>

            <label htmlFor="setup-token" className="sr-only">Supabase Management Token</label>
            <input
              id="setup-token"
              type="password"
              placeholder="sbp_xxxxxxxxxxxxxxxx"
              value={mgmtToken}
              autoComplete="off"
              onChange={e => setMgmtToken(e.target.value)}
              className="mf-input mb-4"
              style={{ width: '100%', borderRadius: 14, padding: '12px 16px' }}
            />

            <button
              onClick={uitvoeren}
              disabled={!mgmtToken.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold transition disabled:opacity-40"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}
            >
              Setup uitvoeren
            </button>
          </>
        )}

        {stap === 'bezig' && (
          <div className="text-center py-8">
            <span className="mf-spinner mx-auto mb-4" aria-hidden style={{ width: 32, height: 32, display: 'block' }} />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Tabel en bucket aanmaken...</p>
          </div>
        )}

        {stap === 'klaar' && (
          <>
            <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--mf-green-light)', borderLeft: '3px solid var(--mf-green)' }}>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--mf-green)' }}>
                <Check size={14} strokeWidth={3} aria-hidden /> Setup voltooid!
              </p>
              {resultaat && Object.entries(resultaat).filter(([k]) => k !== 'ok').map(([k, v]) => (
                <p key={k} className="text-xs" style={{ color: 'var(--text-2)' }}>{v}</p>
              ))}
            </div>
            <Link href="/admin"
              className="block w-full py-3.5 rounded-2xl text-sm font-semibold text-center transition hover:opacity-90"
              style={{ background: 'var(--mf-green)', color: 'var(--bg-app)' }}>
              Terug naar admin
            </Link>
          </>
        )}

        {stap === 'fout' && (
          <>
            <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-5" style={{ background: 'var(--mf-red-light)', borderLeft: '3px solid var(--mf-red)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--mf-red)' }}>Er ging iets mis</p>
              <p className="text-xs" style={{ color: 'var(--mf-red)' }}>{foutmelding}</p>
            </div>
            <button onClick={() => setStap('token')}
              className="w-full py-3.5 rounded-2xl text-sm font-medium transition hover:opacity-70"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-2)', background: 'transparent' }}>
              Probeer opnieuw
            </button>
          </>
        )}
    </AuthKaart>
  )
}
