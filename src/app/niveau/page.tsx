'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import {
  laadXPData, pasDecayToe, slaXPOp, berekenLevel, xpVoortgang,
  LEVEL_NAMEN, LEVEL_DREMPELS, LEVEL_KLEUREN, LEVEL_BG,
  ALLE_ACHIEVEMENTS, type XPData, type Achievement,
} from '@/lib/xp'

// ─── Achievement SVG icons ────────────────────────────────────────────────────

const ACH_ICON: Record<string, React.ReactNode> = {
  eerste_checkin: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  drie_checkins: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  ),
  tien_checkins: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  eerste_doel: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  drie_doelen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
    </svg>
  ),
  vijf_doelen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="4.22" y1="6.22" x2="7.05" y2="9.05"/>
    </svg>
  ),
  streek_7: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  streek_30: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
    </svg>
  ),
  hoge_score: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  level_5: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z"/>
      <path d="M9.879 16.121A3 3 0 1 0 12.99 12L11 14"/>
    </svg>
  ),
  level_8: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  level_10: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>
    </svg>
  ),
}

// ─── Level Ring ───────────────────────────────────────────────────────────────

function LevelRing({ level, pct, kleur }: { level: number; pct: number; kleur: string }) {
  const size = 180
  const r = 76
  const circ = 2 * Math.PI * r
  const bg = LEVEL_BG[level] ?? '#F3F4F6'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill={bg} stroke="#E5E7EB" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={kleur} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - pct / 100)}`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: kleur, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          NIVEAU
        </span>
        <span style={{ fontSize: 52, fontWeight: 900, color: kleur, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {level}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: kleur, opacity: 0.75 }}>
          {LEVEL_NAMEN[level]}
        </span>
      </div>
    </div>
  )
}

// ─── Achievement badge ────────────────────────────────────────────────────────

function AchievementBadge({ ach, unlocked }: { ach: Achievement; unlocked: boolean }) {
  return (
    <div style={{
      background: unlocked ? ach.kleur + '15' : '#F9FAFB',
      border: `1.5px solid ${unlocked ? ach.kleur + '40' : '#E5E7EB'}`,
      borderRadius: 14, padding: '14px 10px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: unlocked ? 1 : 0.5,
      position: 'relative', transition: 'all 0.2s',
    }}>
      {unlocked && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 14, height: 14, borderRadius: '50%',
          background: ach.kleur, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
      <div style={{ color: unlocked ? ach.kleur : '#9CA3AF' }}>
        {ACH_ICON[ach.id] ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        )}
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: unlocked ? '#111827' : '#9CA3AF', textAlign: 'center', lineHeight: 1.3 }}>
        {ach.naam}
      </p>
      {unlocked && (
        <p style={{ fontSize: 9, color: ach.kleur, fontWeight: 700 }}>+{ach.xpBonus} XP</p>
      )}
      {!unlocked && (
        <p style={{ fontSize: 9, color: '#9CA3AF' }}>{ach.xpBonus} XP</p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NiveauPage() {
  const [xpData, setXpData] = useState<XPData | null>(null)

  useEffect(() => {
    let data = laadXPData()
    data = pasDecayToe(data)
    slaXPOp(data)
    setXpData(data)
  }, [])

  if (!xpData) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  const level    = berekenLevel(xpData.xp)
  const kleur    = LEVEL_KLEUREN[level]
  const bg       = LEVEL_BG[level]
  const voortgang = xpVoortgang(xpData.xp, level)
  const geldig   = xpData.achievements ?? []

  const behaald = ALLE_ACHIEVEMENTS.filter(a => geldig.includes(a.id)).length
  const totaal  = ALLE_ACHIEVEMENTS.length

  // Decay warning
  const dagenZonderCheckin = xpData.lastCheckinDatum
    ? Math.floor((Date.now() - new Date(xpData.lastCheckinDatum).getTime()) / 86400000)
    : 999
  const decayWaarschuwing = dagenZonderCheckin >= 10

  const typeKleur: Record<string, string> = {
    checkin: '#1D9E75', goal: '#185FA5', streak: '#E24B4A',
    achievement: '#BA7517', decay: '#9CA3AF',
  }
  const typeLabel: Record<string, string> = {
    checkin: 'Check-in', goal: 'Doel', streak: 'Streak',
    achievement: 'Achievement', decay: 'Inactiviteit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* ── Page title ── */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Mijn Fit Level
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
            Doe check-ins, haal doelen en klim naar Level 10 — Legende.
          </p>
        </div>

        {/* ── Decay warning ── */}
        {decayWaarschuwing && (
          <div style={{
            background: '#FAEEDA', borderLeft: '4px solid #BA7517',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#854F0B' }}>
                {dagenZonderCheckin >= 14
                  ? `XP decay actief — al ${dagenZonderCheckin} dagen geen check-in`
                  : `Nog ${14 - dagenZonderCheckin} dagen voor XP decay begint`}
              </p>
              <p style={{ fontSize: 11, color: '#854F0B', marginTop: 1 }}>
                Doe een wekelijkse check-in om je XP te behouden.
              </p>
            </div>
            <Link href="/checkin" style={{
              flexShrink: 0, background: '#BA7517', color: 'white',
              borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Check-in doen
            </Link>
          </div>
        )}

        {/* ── Hero: level ring + stats ── */}
        <div style={{
          background: 'white', borderRadius: 20, border: '1px solid #E5E7EB',
          padding: '28px 24px', marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <LevelRing level={level} pct={level >= 10 ? 100 : voortgang.pct} kleur={kleur} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 2, letterSpacing: '-0.02em' }}>
                {LEVEL_NAMEN[level]}
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                {xpData.xp.toLocaleString('nl-NL')} XP totaal
              </p>

              {/* XP bar binnen dit level */}
              {level < 10 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Niveau {level}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: kleur }}>
                      {voortgang.inLevel} / {voortgang.levelBreedte} XP
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      Niveau {level + 1}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: kleur,
                      width: `${voortgang.pct}%`, transition: 'width 1s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>
                    Nog <strong style={{ color: kleur }}>{voortgang.nodig} XP</strong> tot niveau {level + 1} — {LEVEL_NAMEN[level + 1]}
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ height: 8, borderRadius: 4, background: kleur, flex: 1 }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: kleur }}>Maximum bereikt!</p>
                </div>
              )}

              {/* Mini stats */}
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                {[
                  { label: 'Check-ins', val: xpData.checkinCount },
                  { label: 'Doelen', val: xpData.goalsCompleted },
                  { label: 'Langste streak', val: `${xpData.streakRecord ?? 0}d` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: kleur }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Level progression track ── */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: '20px 20px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
            Niveau-ladder
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(l => {
              const isHuidige = l === level
              const isPast    = l < level
              const lKleur    = LEVEL_KLEUREN[l]
              const lBg       = LEVEL_BG[l]
              return (
                <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', height: isHuidige ? 38 : 30,
                    borderRadius: 8,
                    background: isPast || isHuidige ? lBg : '#F9FAFB',
                    border: `${isHuidige ? 2.5 : 1.5}px solid ${isPast || isHuidige ? lKleur + (isHuidige ? 'ff' : '60') : '#E5E7EB'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isHuidige ? `0 0 0 3px ${lKleur}25` : 'none',
                    transition: 'all 0.3s',
                  }}>
                    <span style={{
                      fontSize: isHuidige ? 14 : 12, fontWeight: 800,
                      color: isPast || isHuidige ? lKleur : '#D1D5DB',
                    }}>{l}</span>
                  </div>
                  {isHuidige && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: lKleur }} />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>Starter</span>
            <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700 }}>Legende</span>
          </div>
        </div>

        {/* ── Achievements grid ── */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: '20px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Achievements
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: kleur + '20', color: kleur,
            }}>
              {behaald} / {totaal}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {ALLE_ACHIEVEMENTS.map(ach => (
              <AchievementBadge key={ach.id} ach={ach} unlocked={geldig.includes(ach.id)} />
            ))}
          </div>
          {/* Achievement descriptions for unlocked ones */}
          {geldig.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>BEHAALD</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ALLE_ACHIEVEMENTS.filter(a => geldig.includes(a.id)).map(ach => (
                  <div key={ach.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: ach.kleur + '20', color: ach.kleur,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ transform: 'scale(0.65)' }}>{ACH_ICON[ach.id]}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{ach.naam}</p>
                      <p style={{ fontSize: 11, color: '#6B7280' }}>{ach.beschrijving}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ach.kleur, flexShrink: 0 }}>+{ach.xpBonus} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── XP History ── */}
        {xpData.history.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
            padding: '20px', marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
              Recente XP-activiteit
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {xpData.history.slice(0, 12).map((evt, i) => {
                const isPos = evt.xp > 0
                const kleurEvt = isPos ? (typeKleur[evt.type] ?? '#1D9E75') : '#9CA3AF'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: kleurEvt + '15', color: kleurEvt,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                    }}>
                      {isPos ? '+' : '−'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{evt.reden}</p>
                      <p style={{ fontSize: 10, color: '#9CA3AF' }}>
                        {typeLabel[evt.type] ?? evt.type} · {evt.datum}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: kleurEvt, flexShrink: 0 }}>
                      {isPos ? '+' : '−'}{Math.abs(evt.xp)} XP
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── XP uitleg ── */}
        <div style={{
          background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB',
          padding: '20px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 14 }}>
            Hoe verdien je XP?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Wekelijkse check-in',       xp: 75,  kleur: '#1D9E75' },
              { label: 'Uitstekende score (≥ 4.5)', xp: 25,  kleur: '#1D9E75' },
              { label: 'Dagelijkse doelregistratie', xp: 15,  kleur: '#185FA5' },
              { label: '7-daagse streak',            xp: 75,  kleur: '#E24B4A' },
              { label: '30-daagse streak',           xp: 250, kleur: '#E24B4A' },
              { label: 'Doel succesvol bereikt',     xp: 150, kleur: '#7C3AED' },
              { label: 'Achievements',               xp: '50–500', kleur: '#BA7517' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#374151' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.kleur }}>
                  +{item.xp} XP
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Inactiviteit (14+ dagen)</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>−25–40 XP/week</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Link href="/checkin" style={{
            flex: 1, textAlign: 'center', background: '#1D9E75', color: 'white',
            borderRadius: 12, padding: '14px 20px', fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Check-in doen (+75 XP)
          </Link>
          <Link href="/doelen" style={{
            flex: 1, textAlign: 'center', background: '#185FA5', color: 'white',
            borderRadius: 12, padding: '14px 20px', fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
          }}>
            Doel loggen (+15 XP)
          </Link>
        </div>

      </main>
    </div>
  )
}
