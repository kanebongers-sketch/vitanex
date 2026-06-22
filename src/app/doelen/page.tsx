'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Suspense } from 'react'
import { verwerkGoalLog, LEVEL_KLEUREN, LEVEL_NAMEN, type Achievement } from '@/lib/xp'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  vandaag, laadWeekSelectie, slaWeekSelectieOp, isVandaagGelogd, logVandaag,
  scoreKleur,
} from '@/lib/weekdoelen'
import { CAT } from '@/lib/doelen-config'
import { authFetch } from '@/lib/auth-fetch'

type DoelenAdvies = { domein: string; doel: string; waarom: string }

const DOMEIN_KLEUR: Record<string, string> = {
  slaap: 'var(--mf-purple)', stress: 'var(--mf-red)', energie: 'var(--mf-amber)',
  focus: 'var(--mf-green)', balans: 'var(--mf-purple)', motivatie: 'var(--mf-rose)',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function DoelenInhoud() {
  const router = useRouter()
  const [klaar, setKlaar]         = useState(false)
  const [selectie, setSelectie]   = useState<WeekSelectie | null>(null)

  // Log modal
  const [logModal, setLogModal]   = useState<{ doel: WeekDoel } | null>(null)
  const [logNotitie, setLogNotitie] = useState('')

  // XP toast
  const [xpToast, setXpToast]     = useState<{ xp: number; level?: number; achievements: Achievement[] } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // AI doelen-advies
  const [adviezen, setAdviezen] = useState<DoelenAdvies[] | null>(null)
  const [adviesBezig, setAdviesBezig] = useState(false)

  async function laadAdviezen() {
    if (adviesBezig) return
    setAdviesBezig(true)
    try {
      const res = await authFetch('/api/doelen-advies')
      if (res.ok) {
        const data = await res.json() as { adviezen: DoelenAdvies[] }
        setAdviezen(data.adviezen ?? [])
      }
    } catch { /* stil */ } finally {
      setAdviesBezig(false)
    }
  }

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setSelectie(laadWeekSelectie())
      setKlaar(true)
    }
    check()
  }, [router])

  function toonXPToast(xp: number, level: number | undefined, achievements: Achievement[]) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setXpToast({ xp, level, achievements })
    toastTimer.current = setTimeout(() => setXpToast(null), 4000)
  }

  // ── Log opslaan (boolean) ────────────────────────────────────────────────

  function logGehaald(doel: WeekDoel, gehaald: boolean) {
    if (!selectie) return
    const bijgewerkt: WeekSelectie = {
      ...selectie,
      doelen: selectie.doelen.map(d => {
        if (d.vlak !== doel.vlak) return d
        const nieuweLog = { datum: vandaag(), gehaald, notitie: logNotitie.trim() || undefined }
        const logs = [...d.logs.filter(l => l.datum !== vandaag()), nieuweLog]
        return { ...d, logs }
      }),
    }
    slaWeekSelectieOp(bijgewerkt)
    setSelectie(bijgewerkt)
    setLogModal(null)
    setLogNotitie('')

    if (gehaald) {
      const xpResult = verwerkGoalLog(1)
      if (xpResult.xpGewonnen > 0 || xpResult.nieuweAchievements.length > 0) {
        toonXPToast(xpResult.xpGewonnen, xpResult.levelOmhoog ? xpResult.nieuwLevel : undefined, xpResult.nieuweAchievements)
      }
    }
  }

  function openLog(doel: WeekDoel) {
    setLogNotitie(logVandaag(doel)?.notitie ?? '')
    setLogModal({ doel })
  }

  if (!klaar) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  // ── XP Toast ─────────────────────────────────────────────────────────────

  const XPToastUI = xpToast && (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: 'var(--bg-card)', borderRadius: 16, border: '1.5px solid var(--border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '14px 20px', minWidth: 240,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--mf-green)' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--mf-green)' }}>+{xpToast.xp} XP verdiend!</p>
          {xpToast.level && <p style={{ fontSize: 11, color: LEVEL_KLEUREN[xpToast.level] }}>Level {xpToast.level} — {LEVEL_NAMEN[xpToast.level]}!</p>}
        </div>
      </div>
    </div>
  )

  // ── Geen doelen (nog geen check-in) ──────────────────────────────────────

  if (!selectie || !selectie.doelen.length) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--mf-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--mf-green)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 10 }}>Nog geen doelen</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 28 }}>
            Doe een wekelijkse check-in en de AI kiest automatisch 3 doelen die perfect passen bij jouw situatie.
          </p>
          <a href="/checkin" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--mf-green)', color: 'white', borderRadius: 14,
            padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            Start check-in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </main>
      </div>
    )
  }

  // ── OVERZICHT: 3 actieve doelen ───────────────────────────────────────────

  const maandag = new Date(selectie.weekStart)
  const zondag = new Date(maandag); zondag.setDate(maandag.getDate() + 6)
  const weekLabel = `${maandag.getDate()} – ${zondag.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`

  const weekDagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectie.weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn doelen deze week</h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>{weekLabel} · AI-geselecteerde doelen</p>
          </div>
          <a href="/checkin" style={{
            fontSize: 13, color: 'var(--mf-green)', padding: '8px 16px', borderRadius: 10,
            background: 'var(--mf-green-light)', border: '1px solid #A7F3D0',
            cursor: 'pointer', fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Nieuwe check-in
          </a>
        </div>

        {/* Domein scores */}
        {selectie.vlak_scores && Object.keys(selectie.vlak_scores).length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '18px 22px', border: '1px solid var(--border)', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
              Jouw scores deze week
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {(Object.keys(CAT) as WellbeingCat[]).map(vlak => {
                const c = CAT[vlak]
                const score = selectie.vlak_scores?.[vlak] ?? 0
                return (
                  <div key={vlak} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: score ? c.bg : 'var(--bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: score ? c.kleur : 'var(--text-4)', margin: '0 auto 6px',
                      border: `1.5px solid ${score ? c.kleur + '30' : 'var(--border)'}`,
                    }}>
                      <span style={{ transform: 'scale(0.85)', display: 'flex' }}>{c.icon}</span>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>{c.label}</p>
                    {score > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: scoreKleur(score) }}>{score}/20</span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-4)' }}>—</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* AI Doelen-advies */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--mf-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--mf-purple)' }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>AI Weekdoel-suggesties</p>
            </div>
            {!adviezen && (
              <button
                onClick={laadAdviezen}
                disabled={adviesBezig}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                  background: 'var(--mf-purple)', color: 'white', border: 'none', cursor: 'pointer',
                  opacity: adviesBezig ? 0.6 : 1,
                }}
              >
                {adviesBezig ? 'Laden...' : 'Genereer suggesties'}
              </button>
            )}
            {adviezen && (
              <button onClick={() => setAdviezen(null)} style={{ fontSize: 11, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Verbergen
              </button>
            )}
          </div>

          {!adviezen && !adviesBezig && (
            <p style={{ fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>
              Laat de AI 3 concrete weekdoelen voorstellen op basis van jouw laagste scores en burnout-risico.
            </p>
          )}

          {adviesBezig && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <div className="mf-spinner" style={{ width: 16, height: 16 }} />
              <p style={{ fontSize: 12, color: 'var(--text-4)' }}>AI analyseert jouw data...</p>
            </div>
          )}

          {adviezen && adviezen.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {adviezen.map((a, i) => {
                const kleur = DOMEIN_KLEUR[a.domein] ?? 'var(--mf-purple)'
                return (
                  <div key={i} style={{ borderRadius: 12, padding: '12px 14px', background: `${kleur}0A`, border: `1px solid ${kleur}30` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: kleur }}>
                      {a.domein}
                    </span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 6px', lineHeight: 1.4 }}>{a.doel}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{a.waarom}</p>
                  </div>
                )
              })}
            </div>
          )}

          {adviezen && adviezen.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>Geen suggesties beschikbaar. Doe eerst een check-in.</p>
          )}
        </div>

        {/* 3 doelkaarten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {selectie.doelen.map(doel => {
            const c = CAT[doel.vlak] ?? { label: doel.vlak, kleur: 'var(--text-3)', bg: 'var(--bg-subtle)', licht: 'var(--bg-subtle)', icon: null }
            const gelogd = isVandaagGelogd(doel)
            const logEntry = logVandaag(doel)
            const gehaaldVandaag = logEntry?.gehaald === true

            const aantalGehaald = weekDagen.filter(dag => {
              const log = doel.logs.find(l => l.datum === dag)
              return log?.gehaald === true
            }).length

            return (
              <div key={doel.vlak} style={{
                background: 'var(--bg-card)', borderRadius: 20,
                border: `2px solid ${gelogd ? c.kleur + '40' : 'var(--border)'}`,
                padding: '22px 22px 20px',
                boxShadow: gelogd ? `0 4px 20px ${c.kleur}12` : '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {/* Vlak badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.kleur }}>
                      {c.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.kleur }}>{c.label}</span>
                  </div>
                  {gelogd && (
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: gehaaldVandaag ? c.kleur : 'var(--bg-subtle)',
                      border: `2px solid ${gehaaldVandaag ? c.kleur : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {gehaaldVandaag
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </div>
                  )}
                </div>

                {/* Doel info */}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>{doel.doel_titel}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.5 }}>{doel.doel_beschrijving}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <p style={{ fontSize: 11, color: c.kleur, fontWeight: 600 }}>
                      {doel.target_waarde} {doel.eenheid} · {doel.meetType}
                    </p>
                    {/* Streak indicator */}
                    {(() => {
                      // Calculate streak for this goal
                      const vandaagStr = vandaag()
                      let streak = 0
                      const sortedDagen = [...weekDagen].reverse()
                      for (const dag of sortedDagen) {
                        if (dag > vandaagStr) continue
                        const log = doel.logs.find(l => l.datum === dag)
                        if (log?.gehaald === true) streak++
                        else break
                      }
                      return streak > 0 ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10, fontWeight: 700, color: 'var(--mf-red)',
                          background: 'var(--mf-red-light)', borderRadius: 100, padding: '2px 8px',
                        }}>
                          🔥 {streak} dag{streak !== 1 ? 'en' : ''} op rij
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Week voortgang */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Deze week</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.kleur }}>{aantalGehaald}/7 dagen</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {weekDagen.map((dag, i) => {
                      const log = doel.logs.find(l => l.datum === dag)
                      const gehaald = log?.gehaald === true
                      const isVandaagDag = dag === vandaag()
                      return (
                        <div key={i} style={{
                          flex: 1, height: 20, borderRadius: 4,
                          background: gehaald ? c.kleur : log ? 'var(--bg-subtle)' : 'var(--bg-subtle)',
                          border: isVandaagDag && !gelogd ? `1.5px dashed ${c.kleur}` : 'none',
                        }} />
                      )
                    })}
                  </div>
                </div>

                {/* Log knop */}
                {gelogd ? (
                  <div style={{ borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.licht }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.kleur }}>
                      {gehaaldVandaag ? '✓ Doel gehaald!' : '✗ Niet gehaald'}
                    </span>
                    <button
                      onClick={() => openLog(doel)}
                      style={{ fontSize: 11, color: c.kleur, background: 'transparent', border: `1px solid ${c.kleur}40`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Aanpassen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openLog(doel)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12,
                      background: `linear-gradient(135deg, ${c.kleur}, ${c.kleur}cc)`,
                      color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: `0 4px 12px ${c.kleur}40`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Log vandaag (+15 XP)
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Samenvatting strip */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', gap: 24 }}>
            {selectie.doelen.map(d => {
              const c = CAT[d.vlak]
              const gelogd = isVandaagGelogd(d)
              return (
                <div key={d.vlak} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: gelogd ? c.kleur : 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: gelogd ? 'var(--text-2)' : 'var(--text-4)', fontWeight: gelogd ? 600 : 400 }}>{c.label}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
            {selectie.doelen.filter(d => isVandaagGelogd(d)).length}/3 vandaag gelogd
          </p>
        </div>
      </main>

      {/* Log modal */}
      {logModal && (() => {
        const { doel } = logModal
        const c = CAT[doel.vlak] ?? { label: doel.vlak, kleur: 'var(--text-3)', bg: 'var(--bg-subtle)', licht: 'var(--bg-subtle)', icon: null }
        const logEntry = logVandaag(doel)
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setLogModal(null) }}
          >
            <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: c.kleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{doel.doel_titel}</h3>
                </div>
                <button onClick={() => setLogModal(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.5 }}>{doel.doel_beschrijving}</p>

              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
                Heb je vandaag <strong style={{ color: c.kleur }}>{doel.target_waarde} {doel.eenheid}</strong> gehaald?
              </p>

              {/* Gehaald / Niet gehaald knoppen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <button
                  onClick={() => logGehaald(doel, true)}
                  style={{
                    padding: '14px', borderRadius: 14, border: `2px solid ${logEntry?.gehaald === true ? c.kleur : 'var(--border)'}`,
                    background: logEntry?.gehaald === true ? c.kleur : 'var(--bg-card)',
                    color: logEntry?.gehaald === true ? 'white' : 'var(--text-2)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Ja, gehaald
                </button>
                <button
                  onClick={() => logGehaald(doel, false)}
                  style={{
                    padding: '14px', borderRadius: 14, border: `2px solid ${logEntry?.gehaald === false ? '#DC2626' : 'var(--border)'}`,
                    background: logEntry?.gehaald === false ? 'var(--mf-red)' : 'var(--bg-card)',
                    color: logEntry?.gehaald === false ? 'white' : 'var(--text-2)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Niet gehaald
                </button>
              </div>

              <textarea
                placeholder="Optionele notitie (hoe ging het?)"
                value={logNotitie} onChange={e => setLogNotitie(e.target.value)}
                rows={2}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', background: 'var(--bg-card)', color: 'var(--text-2)' }}
              />
            </div>
          </div>
        )
      })()}

      {XPToastUI}
    </div>
  )
}

export default function DoelenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="mf-spinner" /></div>}>
      <DoelenInhoud />
    </Suspense>
  )
}
