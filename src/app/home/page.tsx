'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Tegel = {
  href: string
  emoji: string
  titel: string
  sub: string
  kleur: string
  tekstKleur?: string
}

const TEGELS: Tegel[] = [
  {
    href: '/checkin',
    emoji: '📋',
    titel: 'Check-in',
    sub: 'Vul je wekelijkse welzijnsmeting in',
    kleur: 'var(--mentaforce-primary)',
    tekstKleur: 'white',
  },
  {
    href: '/portaal',
    emoji: '🏠',
    titel: 'Portaal',
    sub: 'Je persoonlijk overzicht en scores',
    kleur: '#F0FDF9',
  },
  {
    href: '/coach',
    emoji: '🧠',
    titel: 'AI Coach',
    sub: 'Chat met je persoonlijke welzijnscoach',
    kleur: '#EFF6FF',
  },
  {
    href: '/journal',
    emoji: '📓',
    titel: 'Journal',
    sub: 'Schrijf je gedachten en reflecties op',
    kleur: '#FFFBEB',
  },
  {
    href: '/chat',
    emoji: '💬',
    titel: 'Chat',
    sub: 'Berichten met je team en collega\'s',
    kleur: '#F5F3FF',
  },
  {
    href: '/instellingen',
    emoji: '⚙️',
    titel: 'Instellingen',
    sub: 'Profiel, thema en voorkeuren',
    kleur: '#F9FAFB',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [naam, setNaam] = useState<string>('')
  const [klaar, setKlaar] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, rol')
        .eq('id', user.id)
        .single()

      if (profiel?.naam) setNaam(profiel.naam.split(' ')[0])
      setKlaar(true)
    }
    check()
  }, [router])

  const uur = new Date().getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'

  if (!klaar) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      {/* Top bar — minimal, no Navbar component */}
      <header className="px-6 pt-8 pb-2 max-w-3xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {groet}{naam ? `, ${naam}` : ''}! 👋
          </p>
          <p className="text-sm text-gray-400 mt-0.5">Wat wil je vandaag doen?</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: 'var(--mentaforce-primary)' }}
        >
          M
        </div>
      </header>

      {/* Grid */}
      <main className="px-4 py-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TEGELS.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-transform active:scale-95 hover:scale-[1.02]"
              style={{
                background: t.kleur,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                textDecoration: 'none',
              }}
            >
              <span className="text-4xl leading-none">{t.emoji}</span>
              <div>
                <p
                  className="text-base font-semibold leading-snug"
                  style={{ color: t.tekstKleur ?? '#111827' }}
                >
                  {t.titel}
                </p>
                <p
                  className="text-xs mt-0.5 leading-snug"
                  style={{ color: t.tekstKleur ? 'rgba(255,255,255,0.8)' : '#6b7280' }}
                >
                  {t.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom logout link */}
        <div className="mt-10 text-center">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Uitloggen
          </button>
        </div>
      </main>
    </div>
  )
}
