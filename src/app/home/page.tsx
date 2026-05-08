'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'

type CheckIn = {
  energie: number
  slaap: number
  mentaal_focus: number
  mentaal_balans: number
  motivatie: number
}

const WERKDAG_TOOLS = [
  { href: '/verlof',      emoji: '🌴', titel: 'Verlof',         sub: 'Aanvragen & saldo' },
  { href: '/uren',        emoji: '⏱️', titel: 'Uren',           sub: 'Urenregistratie' },
  { href: '/declaraties', emoji: '💰', titel: 'Declaraties',    sub: 'Onkosten indienen' },
  { href: '/loonstroken', emoji: '💶', titel: 'Loonstroken',    sub: 'Salarisoverzicht' },
  { href: '/nieuws',      emoji: '📰', titel: 'Bedrijfsnieuws', sub: 'Updates & aankondigingen' },
  { href: '/directory',   emoji: '👥', titel: "Collega's",      sub: 'Medewerkersgids' },
]

const VITAAL_TOOLS = [
  { href: '/portaal',     emoji: '📊', titel: 'Mijn portaal',  sub: 'Scores & voortgang' },
  { href: '/doelen',      emoji: '🎯', titel: 'Doelen',        sub: 'Stel doelen en volg ze' },
  { href: '/uitdagingen', emoji: '🏆', titel: 'Uitdagingen',   sub: '7- tot 30-daagse challenges' },
  { href: '/coach',       emoji: '🧠', titel: 'AI Coach',      sub: '24/7 persoonlijk advies' },
  { href: '/journal',     emoji: '📓', titel: 'Journal',       sub: 'Reflecteer en schrijf' },
  { href: '/burnout',     emoji: '🔥', titel: 'Burn-out scan', sub: 'Check je signalen' },
  { href: '/focus',       emoji: '🫁', titel: 'Focus',         sub: 'Ademhaling & mindfulness' },
  { href: '/koppelingen', emoji: '🔗', titel: 'Koppelingen',   sub: 'Fitbit & Google Agenda' },
]

function berekenScore(ci: CheckIn): number {
  const som = (ci.energie ?? 0) + (ci.slaap ?? 0) + (ci.mentaal_focus ?? 0) + (ci.mentaal_balans ?? 0) + (ci.motivatie ?? 0)
  return Math.round((som / 5) * 10) / 10
}

function scoreKleur(score: number): string {
  if (score >= 4) return '#1D9E75'
  if (score >= 2.5) return '#BA7517'
  return '#E24B4A'
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const fill = circ * (score / 5)
  const kleur = scoreKleur(score)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4.5" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - fill}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [naam,          setNaam]          = useState('')
  const [klaar,         setKlaar]         = useState(false)
  const [laasteCheckin, setLaasteCheckin] = useState<CheckIn | null>(null)
  const [heeftCheckin,  setHeeftCheckin]  = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam').eq('id', user.id).single()
      if (profiel?.naam) setNaam(profiel.naam.split(' ')[0])

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

  const uur   = new Date().getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'

  const datumTekst = new Date().toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  if (!klaar) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="mf-spinner" />
    </div>
  )

  const score = laasteCheckin ? berekenScore(laasteCheckin) : null
  const scoreKl = score !== null ? scoreKleur(score) : '#9CA3AF'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-5 mf-safe-bottom">

        {/* ── Greeting ──────────────────────────────────────── */}
        <div className="mb-5 mf-animate-up">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {groet}{naam ? `, ${naam}` : ''}! 👋
          </h2>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--text-3)' }}>{datumTekst}</p>
        </div>

        {/* ── Score + Check-in CTA ───────────────────────────── */}
        <div className="mb-4 mf-animate-up mf-delay-1">

          {/* Score card */}
          <div
            className="rounded-2xl p-4 mb-3 flex items-center gap-4"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="relative flex-shrink-0">
              {score !== null ? (
                <>
                  <ScoreRing score={score} size={60} />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                    style={{ color: scoreKl }}
                  >
                    {score.toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </>
              ) : (
                <div
                  className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-subtle)', border: '4.5px solid rgba(0,0,0,0.06)' }}
                >
                  <span className="text-lg">—</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-4)' }}>
                Vitaliteitsscore
              </p>
              {score !== null ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: scoreKl, letterSpacing: '-0.03em' }}>
                    {score.toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-4)' }}>/5</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {score >= 4 ? '🌟 Uitstekend!' : score >= 2.5 ? '⚡ Matig — je kunt het beter!' : '⚠️ Let op je welzijn'}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {heeftCheckin === false ? 'Doe je eerste check-in' : 'Laden...'}
                </p>
              )}
            </div>

            <Link
              href="/portaal"
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}
            >
              Details →
            </Link>
          </div>

          {/* Check-in CTA */}
          <Link
            href="/checkin"
            className="flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1D9E75 0%, #15785A 100%)',
              boxShadow: '0 4px 20px rgba(29,158,117,0.35)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <span className="text-2xl">📋</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Weeklijkse check-in</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Hoe gaat het met je deze week?</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* ── Werkdag tools ──────────────────────────────────── */}
        <section className="mb-5 mf-animate-up mf-delay-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
              Werkdag
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {WERKDAG_TOOLS.map((t, i) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-2xl p-3.5 flex flex-col gap-2.5 transition active:scale-[0.96]"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-xs)',
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <span className="text-2xl leading-none">{t.emoji}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>{t.titel}</p>
                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-4)' }}>{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Vitaliteit tools ───────────────────────────────── */}
        <section className="mb-5 mf-animate-up mf-delay-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
              Vitaliteit
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {VITAAL_TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-2xl p-4 flex flex-col gap-3 transition active:scale-[0.97]"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <span className="text-3xl leading-none">{t.emoji}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t.titel}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Crisis button ──────────────────────────────────── */}
        <div className="mf-animate-up mf-delay-4">
          <CrisisButton />
        </div>

      </main>
    </div>
  )
}
