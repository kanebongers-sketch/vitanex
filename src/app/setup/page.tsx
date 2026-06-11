'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Stap = 'controleer' | 'token' | 'bezig' | 'klaar' | 'fout'

export default function Setup() {
  const router = useRouter()
  const [stap, setStap] = useState<Stap>('controleer')
  const [mgmtToken, setMgmtToken] = useState('')
  const [resultaat, setResultaat] = useState<Record<string, string> | null>(null)
  const [foutmelding, setFoutmelding] = useState('')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

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

  async function uitvoeren() {
    if (!mgmtToken.trim()) return
    setStap('bezig')

    // Sla token tijdelijk op en roep init-route aan

    // Eerst token instellen via env kan niet client-side, gebruik directe fetch
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

  // Controleer toegang bij laden
  if (isAdmin === null) {
    controleerToegang()
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#F5F3FF' }}>
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#8B5CF6' }} />
      </main>
    )
  }

  if (isAdmin === false) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F3FF' }}>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <p className="text-gray-700 font-medium mb-2">Geen toegang</p>
          <p className="text-gray-400 text-sm mb-4">Alleen admins kunnen de setup uitvoeren.</p>
          <Link href="/admin" className="text-sm text-purple-600 underline">← Terug naar admin</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8" style={{ background: '#F5F3FF' }}>
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-lg w-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ background: '#8B5CF6' }}>⚙️</div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Documenten setup</h1>
            <p className="text-xs text-gray-400">Eenmalig uitvoeren om het dossier-systeem te activeren</p>
          </div>
        </div>

        {stap === 'token' && (
          <>
            <div className="rounded-xl p-4 mb-5" style={{ background: '#EEEDFE', borderLeft: '3px solid #8B5CF6' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#3C3489' }}>Supabase Management Token nodig</p>
              <p className="text-xs leading-relaxed" style={{ color: '#3C3489' }}>
                Dit token geeft eenmalig toestemming om de database-tabel aan te maken.
                Het wordt nergens opgeslagen.
              </p>
            </div>

            <ol className="text-sm text-gray-600 mb-5 space-y-2">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Ga naar <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline font-medium">supabase.com/dashboard/account/tokens</a></span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Klik <strong>Generate new token</strong> → naam bijv. &quot;MentaForce setup&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Kopieer het token en plak het hieronder</span>
              </li>
            </ol>

            <input
              type="password"
              placeholder="sbp_xxxxxxxxxxxxxxxx"
              value={mgmtToken}
              onChange={e => setMgmtToken(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 mb-4"
            />

            <button
              onClick={uitvoeren}
              disabled={!mgmtToken.trim()}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition disabled:opacity-40"
              style={{ background: '#8B5CF6' }}
            >
              Setup uitvoeren
            </button>
          </>
        )}

        {stap === 'bezig' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin mx-auto mb-4" style={{ borderTopColor: '#8B5CF6' }} />
            <p className="text-sm text-gray-500">Tabel en bucket aanmaken...</p>
          </div>
        )}

        {stap === 'klaar' && (
          <>
            <div className="rounded-xl p-4 mb-5" style={{ background: '#E1F5EE', borderLeft: '3px solid #1D9E75' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#0F6E56' }}>✓ Setup voltooid!</p>
              {resultaat && Object.entries(resultaat).filter(([k]) => k !== 'ok').map(([k, v]) => (
                <p key={k} className="text-xs" style={{ color: '#0F6E56' }}>{v}</p>
              ))}
            </div>
            <Link href="/admin"
              className="block w-full py-3 rounded-xl text-white text-sm font-semibold text-center"
              style={{ background: '#8B5CF6' }}>
              Terug naar admin
            </Link>
          </>
        )}

        {stap === 'fout' && (
          <>
            <div className="rounded-xl p-4 mb-5" style={{ background: '#FCEBEB', borderLeft: '3px solid #E24B4A' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#A32D2D' }}>Er ging iets mis</p>
              <p className="text-xs" style={{ color: '#A32D2D' }}>{foutmelding}</p>
            </div>
            <button onClick={() => setStap('token')}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
              Probeer opnieuw
            </button>
          </>
        )}
      </div>
    </main>
  )
}
