'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Status = 'laden' | 'gereed' | 'opslaan' | 'klaar' | 'fout_token' | 'fout_opslaan'

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
    setTimeout(() => router.push('/login'), 2500)
  }

  if (status === 'laden') return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin mx-auto mb-4"
          style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
        <p className="text-sm text-gray-400">Link controleren...</p>
      </div>
    </main>
  )

  if (status === 'fout_token') return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="text-4xl mb-4">⏱️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Link verlopen</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          De resetlink is verlopen of al gebruikt. Vraag een nieuwe link aan.
        </p>
        <Link href="/wachtwoord-vergeten"
          className="block w-full text-center py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--mentaforce-primary)' }}>
          Nieuwe resetlink aanvragen
        </Link>
      </div>
    </main>
  )

  if (status === 'klaar') return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ background: '#E1F5EE' }}>
          ✅
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Wachtwoord gewijzigd</h1>
        <p className="text-sm text-gray-400">Je wordt doorgestuurd naar het inlogscherm...</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #E6F1FB 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">

        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--mentaforce-primary)' }}>
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-gray-900">MentaForce</span>
        </Link>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Nieuw wachtwoord instellen</h1>
        <p className="text-gray-400 text-sm mb-8">Kies een sterk wachtwoord van minimaal 8 tekens.</p>

        {status === 'fout_opslaan' && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5">
            <p className="text-sm text-red-700 font-medium">Opslaan mislukt.</p>
            <p className="text-xs text-red-500 mt-0.5">Probeer opnieuw of vraag een nieuwe link aan.</p>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <input
              type={toon ? 'text' : 'password'}
              placeholder="Nieuw wachtwoord"
              value={wachtwoord}
              autoFocus
              onChange={e => setWachtwoord(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition pr-16"
            />
            <button type="button" onClick={() => setToon(t => !t)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition px-1">
              {toon ? 'Verberg' : 'Toon'}
            </button>
          </div>

          {wachtwoord.length > 0 && (
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: sterkte > i ? ['#E24B4A', '#BA7517', '#1D9E75'][i] : '#e5e7eb' }} />
              ))}
              <span className="text-xs text-gray-400 w-10 font-medium">
                {['Te kort', 'Matig', 'Goed', 'Sterk'][sterkte]}
              </span>
            </div>
          )}

          <input
            type={toon ? 'text' : 'password'}
            placeholder="Bevestig nieuw wachtwoord"
            value={bevestig}
            onChange={e => setBevestig(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && slaOp()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition"
            style={{ borderColor: bevestig && wachtwoord !== bevestig ? '#E24B4A' : '' }}
          />
          {bevestig && wachtwoord !== bevestig && (
            <p className="text-xs text-red-500 -mt-1">Wachtwoorden komen niet overeen</p>
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
          className="w-full text-white rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--mentaforce-primary)' }}>
          {status === 'opslaan' && (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          {status === 'opslaan' ? 'Opslaan...' : 'Wachtwoord opslaan'}
        </button>
      </div>
    </main>
  )
}
