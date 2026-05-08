'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CrisisButton from '@/components/CrisisButton'
import { ALLE_TILES, DEFAULT_TILES, getTileDef, type TileId } from '@/lib/tiles'

type CheckIn = {
  energie: number
  slaap: number
  mentaal_focus: number
  mentaal_balans: number
  motivatie: number
}

// Extra vitaliteit tools die altijd in de Vitaliteit sectie staan
const VITAAL_TOOLS = [
  { href: '/doelen',      emoji: '🎯', titel: 'Doelen',        sub: 'Stel doelen en volg ze' },
  { href: '/uitdagingen', emoji: '🏆', titel: 'Uitdagingen',   sub: '7- tot 30-daagse challenges' },
  { href: '/journal',     emoji: '📓', titel: 'Journal',       sub: 'Reflecteer en schrijf' },
  { href: '/burnout',     emoji: '🔥', titel: 'Burn-out scan', sub: 'Check je signalen' },
  { href: '/focus',       emoji: '🫁', titel: 'Focus',         sub: 'Ademhaling & mindfulness' },
]

function berekenScore(ci: CheckIn): number {
  const waarden = [ci.energie, ci.slaap, ci.mentaal_focus, ci.mentaal_balans, ci.motivatie]
  const som = waarden.reduce((a, b) => a + b, 0)
  return Math.round((som / waarden.length) * 20)
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const omtrek = 2 * Math.PI * radius
  const vulling = (score / 100) * omtrek
  const kleur = score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
      <circle cx="48" cy="48" r={radius} fill="none" stroke={kleur} strokeWidth="8"
        strokeDasharray={`${vulling} ${omtrek}`} strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 1s var(--ease)' }} />
      <text x="48" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill={kleur}>{score}</text>
      <text x="48" y="58" textAnchor="middle" fontSize="10" fill="var(--text-4)">/100</text>
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [isHr, setIsHr] = useState(false)
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null)
  const [activeTiles, setActiveTiles] = useState<TileId[]>(DEFAULT_TILES)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, rol, bedrijf_id, laatste_checkin')
        .eq('id', user.id)
        .single()

      const hr = profiel?.rol === 'hr' || profiel?.rol === 'admin'
      setIsHr(hr)
      setNaam(profiel?.naam ?? '')

      // Laad portaal configuratie
      if (profiel?.bedrijf_id) {
        const { data: config } = await supabase
          .from('portaal_config')
          .select('tiles')
          .eq('bedrijf_id', profiel.bedrijf_id)
          .single()

        if (config?.tiles && Array.isArray(config.tiles)) {
          setActiveTiles(config.tiles as TileId[])
        }
      }

      // Laad laatste check-in
      const { data: ci } = await supabase
        .from('checkins')
        .select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (ci) setCheckIn(ci as CheckIn)
      setLaden(false)
    }
    laad()
  }, [router])

  if (laden) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex justify-center mt-20">
        <div className="mf-spinner" />
      </main>
    </div>
  )

  const score = checkIn ? berekenScore(checkIn) : null
  const scoreKleur = !score ? '#9CA3AF' : score >= 70 ? '#1D9E75' : score >= 45 ? '#F59E0B' : '#EF4444'
  const scoreLabel = !score ? null : score >= 70 ? 'Goed op weg!' : score >= 45 ? 'Aandacht nodig' : 'Zorg voor jezelf'

  const voornaam = naam.split(' ')[0] || 'je'

  // Bepaal welke tiles zichtbaar zijn — respecteer de volgorde uit config
  const portaalTiles = activeTiles
    .map(id => getTileDef(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)

  // Scheid 'werkdag' en 'vitaliteit' tiles
  const werkdagIds: TileId[] = ['verlof', 'uren', 'declaraties', 'loonstroken', 'nieuws', 'directory', 'protocollen', 'team', 'surveys']
  const vitaalIds: TileId[] = ['checkin', 'coach', 'rapport']

  const werkdagTiles = portaalTiles.filter(t => werkdagIds.includes(t.id))
  const vitaalTiles = portaalTiles.filter(t => vitaalIds.includes(t.id))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-5 mf-safe-bottom">

        {/* Welkom header */}
        <div className="flex items-center justify-between mb-5 mf-animate-up">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              {new Date().toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5"
              style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
              Hoi {voornaam} 👋
            </h1>
          </div>
          {isHr && (
            <Link href="/hr"
              className="mf-btn text-xs flex items-center gap-1.5"
              style={{ padding: '7px 14px', background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              HR beheer
            </Link>
          )}
        </div>

        {/* Score kaart */}
        <div className="rounded-2xl p-5 mb-5 mf-animate-up mf-delay-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          {score ? (
            <div className="flex items-center gap-5">
              <ScoreRing score={score} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-4)' }}>
                  Vitaliteitsscore
                </p>
                <p className="text-xl font-bold" style={{ color: scoreKleur }}>{scoreLabel}</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  Gebaseerd op je laatste check-in.
                  {score < 50 && ' Overweeg de AI Coach te raadplegen.'}
                </p>
                <Link href="/rapport"
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                  style={{ color: 'var(--mf-green)' }}>
                  Bekijk rapport
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: 'var(--bg-subtle)' }}>✅</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  Nog geen check-in
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  Doe je eerste check-in en ontdek hoe je ervoor staat.
                </p>
                <Link href="/checkin"
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                  style={{ color: 'var(--mf-green)' }}>
                  Start check-in
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Vitaliteit tiles (uit config) */}
        {vitaalTiles.length > 0 && (
          <div className="mb-5 mf-animate-up mf-delay-2">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
              style={{ color: 'var(--text-4)' }}>Vitaliteit</p>
            <div className="grid grid-cols-3 gap-2.5">
              {vitaalTiles.map(tile => (
                <Link key={tile.id} href={tile.path}
                  className="rounded-2xl p-4 flex flex-col items-center text-center gap-2 transition active:scale-[0.97]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: tile.bg }}>
                    {tile.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>{tile.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Werkdag tiles (uit config) */}
        {werkdagTiles.length > 0 && (
          <div className="mb-5 mf-animate-up mf-delay-3">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
              style={{ color: 'var(--text-4)' }}>Werkdag</p>
            <div className="grid grid-cols-2 gap-2.5">
              {werkdagTiles.map(tile => (
                <Link key={tile.id} href={tile.path}
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3 transition active:scale-[0.98]"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: tile.bg }}>
                    {tile.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{tile.label}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-4)' }}>{tile.sublabel}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Extra vitaliteit tools (altijd zichtbaar) */}
        <div className="mb-5 mf-animate-up mf-delay-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
            style={{ color: 'var(--text-4)' }}>Meer tools</p>
          <div className="grid grid-cols-2 gap-2.5">
            {VITAAL_TOOLS.map(t => (
              <Link key={t.href} href={t.href}
                className="rounded-2xl px-4 py-3.5 flex items-center gap-3 transition active:scale-[0.98]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <span className="text-xl flex-shrink-0">{t.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{t.titel}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-4)' }}>{t.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Crisis knop */}
        <div className="mb-2 mf-animate-up mf-delay-4">
          <CrisisButton />
        </div>
      </main>
    </div>
  )
}
