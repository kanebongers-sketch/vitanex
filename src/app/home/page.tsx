'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'

type Tegel = {
  href: string
  emoji: string
  titel: string
  sub: string
}

const TOOLS: Tegel[] = [
  { href: '/portaal',     emoji: '📊', titel: 'Mijn portaal',  sub: 'Scores & voortgang' },
  { href: '/doelen',      emoji: '🎯', titel: 'Doelen',        sub: 'Stel doelen en volg ze' },
  { href: '/uitdagingen', emoji: '🏆', titel: 'Uitdagingen',   sub: '7- tot 30-daagse challenges' },
  { href: '/coach',       emoji: '🧠', titel: 'AI Coach',      sub: '24/7 persoonlijk advies' },
  { href: '/journal',     emoji: '📓', titel: 'Journal',       sub: 'Reflecteer en schrijf' },
  { href: '/burnout',     emoji: '🔥', titel: 'Burn-out scan', sub: 'Check je signalen' },
  { href: '/focus',       emoji: '🫁', titel: 'Focus',         sub: 'Ademhaling & mindfulness' },
  { href: '/instellingen',emoji: '⚙️', titel: 'Instellingen',  sub: 'Voorkeuren' },
]

type CheckIn = {
  energie: number
  slaap: number
  mentaal_focus: number
  mentaal_balans: number
  motivatie: number
}

function berekenScore(ci: CheckIn): number {
  const som = (ci.energie ?? 0) + (ci.slaap ?? 0) + (ci.mentaal_focus ?? 0) + (ci.mentaal_balans ?? 0) + (ci.motivatie ?? 0)
  return Math.round((som / 5) * 10) / 10
}

function scoreKleur(score: number): string {
  if (score >= 4) return '#1D9E75'
  if (score >= 2.5) return '#F59E0B'
  return '#EF4444'
}

export default function HomePage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [klaar, setKlaar] = useState(false)
  const [laasteCheckin, setLaasteCheckin] = useState<CheckIn | null>(null)
  const [heeftCheckin, setHeeftCheckin] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Load profile
      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam')
        .eq('id', user.id)
        .single()
      if (profiel?.naam) setNaam(profiel.naam.split(' ')[0])

      // Load latest check-in
      const { data: checkins } = await supabase
        .from('checkins')
        .select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkins && checkins.length > 0) {
        setLaasteCheckin(checkins[0] as CheckIn)
        setHeeftCheckin(true)
      } else {
        setHeeftCheckin(false)
      }

      setKlaar(true)
    }
    check()
  }, [router])

  const uur = new Date().getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'

  const datumTekst = new Date().toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (!klaar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#1D9E75' }} />
    </div>
  )

  const score = laasteCheckin ? berekenScore(laasteCheckin) : null

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-6">

        {/* Greeting */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {groet}{naam ? `, ${naam}` : ''}!
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{datumTekst}</p>
        </div>

        {/* Vitality score row */}
        <div
          className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 mb-4"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Vitaliteitsscore</p>
            {score !== null ? (
              <p className="text-3xl font-bold" style={{ color: scoreKleur(score) }}>
                {score.toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                <span className="text-base font-normal text-gray-300 ml-1">/5</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                {heeftCheckin === false ? 'Doe je eerste check-in' : '—'}
              </p>
            )}
          </div>
          {score !== null && (
            <div className="relative w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#F3F4F6" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke={scoreKleur(score)}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 5)}`}
                  transform="rotate(-90 28 28)"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Big green CTA: check-in */}
        <Link
          href="/checkin"
          className="flex items-center gap-4 rounded-2xl p-5 mb-5 transition active:scale-[0.98]"
          style={{ background: '#1D9E75', boxShadow: '0 4px 20px rgba(29,158,117,0.3)' }}
        >
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

        {/* Jouw tools */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Jouw tools</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {TOOLS.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl p-4 flex flex-col gap-3 bg-white transition active:scale-[0.97]"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <span className="text-3xl leading-none">{t.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.titel}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Crisis button */}
        <CrisisButton />

      </main>
    </div>
  )
}
