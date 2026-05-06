'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { LogoIcon } from '@/components/Logo'

type Tegel = {
  href: string
  emoji: string
  titel: string
  sub: string
  accent?: string
  full?: boolean
}

const HOOFD_TEGELS: Tegel[] = [
  {
    href: '/portaal',
    emoji: '📊',
    titel: 'Mijn portaal',
    sub: 'Scores, voortgang en rapport',
    accent: '#1D9E75',
  },
  {
    href: '/instellingen',
    emoji: '⚙️',
    titel: 'Instellingen',
    sub: 'Profiel en voorkeuren',
  },
]

const EXTRA_TEGELS: Tegel[] = [
  { href: '/journal',  emoji: '📓', titel: 'Journal',       sub: 'Schrijf gedachten op' },
  { href: '/burnout',  emoji: '🔥', titel: 'Burn-out scan', sub: 'Check je signalen' },
  { href: '/surveys',  emoji: '📋', titel: 'Surveys',       sub: 'Vul enquêtes in' },
  { href: '/focus',    emoji: '🫁', titel: 'Focus',         sub: 'Herstel en ademhaling' },
]

export default function HomePage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [klaar, setKlaar] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('naam, rol').eq('id', user.id).single()
      if (data?.naam) setNaam(data.naam.split(' ')[0])
      setKlaar(true)
    }
    check()
  }, [router])

  const uur = new Date().getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'

  if (!klaar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{groet}{naam ? `, ${naam}` : ''}!</h2>
          <p className="text-sm text-gray-400 mt-0.5">Wat wil je vandaag doen?</p>
        </div>

        {/* Quick action: check-in CTA */}
        <Link href="/checkin"
          className="flex items-center gap-4 rounded-2xl p-5 mb-4 transition active:scale-[0.98]"
          style={{ background: '#1D9E75', boxShadow: '0 4px 20px rgba(29,158,117,0.3)' }}>
          <span className="text-4xl">📋</span>
          <div className="flex-1">
            <p className="text-white font-semibold text-base">Weeklijkse check-in</p>
            <p className="text-white/70 text-sm mt-0.5">Hoe gaat het met je deze week?</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {HOOFD_TEGELS.map(t => (
            <Link key={t.href} href={t.href}
              className="rounded-2xl p-4 flex flex-col gap-3 bg-white transition active:scale-[0.97]"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="text-3xl leading-none">{t.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.titel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Extra tools */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Meer tools</p>
        <div className="grid grid-cols-2 gap-3">
          {EXTRA_TEGELS.map(t => (
            <Link key={t.href} href={t.href}
              className="rounded-2xl p-4 flex items-center gap-3 bg-white transition active:scale-[0.97]"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="text-2xl leading-none">{t.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.titel}</p>
                <p className="text-xs text-gray-400 truncate">{t.sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
