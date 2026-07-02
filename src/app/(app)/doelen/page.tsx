'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Plus, Check, X, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { verwerkGoalLog, verwerkGoalVoltooid, LEVEL_NAMEN, type Achievement } from '@/lib/xp'
import { syncXPNaarServer } from '@/lib/xp-sync'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie,
  vandaag, laadWeekSelectie, slaWeekSelectieOp, isVandaagGelogd, logVandaag,
  scoreKleur, berekenStreak,
} from '@/lib/weekdoelen'
import { CAT } from '@/lib/doelen-config'
import { authFetch } from '@/lib/auth-fetch'
import { vitaEvent } from '@/lib/vita/events'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'
import VitaDoelenBegroeting from '@/components/vita/VitaDoelenBegroeting'
import VitaBubbel from '@/components/vita/VitaBubbel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/Dialog'


type DoelenAdvies = { domein: string; doel: string; waarom: string }

const DOMEIN_KLEUR: Record<string, string> = {
  slaap: 'var(--mf-purple)', stress: 'var(--mf-red)', energie: 'var(--mf-amber)',
  focus: 'var(--mf-green)', balans: 'var(--mf-purple)', motivatie: 'var(--mf-red)',
}

/** De 7 dagen (YYYY-MM-DD) van de actieve doelenweek. */
function maakWeekDagen(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function DoelenInhoud() {
  const router = useRouter()
  const { toast } = useToast()
  const [klaar, setKlaar]         = useState(false)
  const [selectie, setSelectie]   = useState<WeekSelectie | null>(null)
  // Cross-device eerlijkheid: staat er op de server al een check-in van deze week,
  // ook al zijn de doelen op dít apparaat niet lokaal bekend?
  const [heeftCheckinDezeWeek, setHeeftCheckinDezeWeek] = useState(false)

  // Log modal
  const [logModal, setLogModal]   = useState<{ doel: WeekDoel } | null>(null)
  const [logNotitie, setLogNotitie] = useState('')

  // AI doelen-advies
  const [adviezen, setAdviezen] = useState<DoelenAdvies[] | null>(null)
  const [adviesBezig, setAdviesBezig] = useState(false)

  // Vita's korte, oprechte erkenning ná het afvinken. Verdwijnt vanzelf zodat
  // ze niet blijft "hangen" (geen spam) — de begroeting bovenaan blijft altijd.
  const [vitaReactie, setVitaReactie] = useState<{ tekst: string; vieren: boolean } | null>(null)

  // Reduced-motion: zet de ademhaling op Vita's gezicht uit bij voorkeur.
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!vitaReactie) return
    const t = window.setTimeout(() => setVitaReactie(null), 6000)
    return () => window.clearTimeout(t)
  }, [vitaReactie])

  async function laadAdviezen() {
    if (adviesBezig) return
    setAdviesBezig(true)
    try {
      const res = await authFetch('/api/doelen-advies')
      if (res.ok) {
        const data = await res.json() as { adviezen: DoelenAdvies[] }
        setAdviezen(data.adviezen ?? [])
      } else {
        toast({ title: 'Suggesties laden mislukt', description: 'Probeer het later opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Suggesties laden mislukt', description: 'Controleer je verbinding en probeer opnieuw.', variant: 'error' })
    } finally {
      setAdviesBezig(false)
    }
  }

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const sel = laadWeekSelectie()
      setSelectie(sel)
      if (!sel || !sel.doelen.length) {
        // Zelfde venster als checkin/page.tsx: bestaat er al een sessie deze week?
        const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: sessie } = await supabase
          .from('checkin_sessies')
          .select('id')
          .eq('user_id', user.id)
          .gte('aangemaakt_op', zevenDagenGeleden)
          .order('aangemaakt_op', { ascending: false })
          .limit(1)
          .maybeSingle()
        setHeeftCheckinDezeWeek(Boolean(sessie))
      }
      setKlaar(true)
    }
    check()
  }, [router])

  function toonXPToast(xp: number, level: number | undefined, achievements: Achievement[]) {
    const titel = level ? `Level ${level} — ${LEVEL_NAMEN[level]}!` : `+${xp} XP verdiend!`
    const beschrijving = achievements.length > 0
      ? `Nieuwe badge: ${achievements.map(a => a.naam).join(', ')}`
      : level ? `+${xp} XP verdiend` : undefined
    toast({ title: titel, description: beschrijving, variant: 'success' })
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

    // Vita's korte, oprechte erkenning — meebewegend met wat er nét gebeurde.
    if (gehaald) {
      const allesVandaagGehaald = bijgewerkt.doelen.every(
        d => d.logs.find(l => l.datum === vandaag())?.gehaald === true,
      )
      setVitaReactie(
        allesVandaagGehaald && bijgewerkt.doelen.length > 1
          ? { tekst: 'Alle doelen van vandaag afgevinkt — dat is een sterke dag. Trots op je.', vieren: true }
          : { tekst: 'Fijn, afgevinkt. Kleine stappen, echte vooruitgang.', vieren: false },
      )
    } else {
      setVitaReactie({ tekst: 'Geen zorgen — morgen een nieuwe kans. Ik hou het bij, jij hoeft alleen te verschijnen.', vieren: false })
    }

    if (gehaald) {
      vitaEvent('habit_completed', { kind: 'doel' })

      const weekDagen = maakWeekDagen(bijgewerkt.weekStart)
      const bijgewerktDoel = bijgewerkt.doelen.find(d => d.vlak === doel.vlak)

      // Volledig doel behaald wanneer alle 7 dagen gehaald zijn voor dit doel.
      // De beloning triggert één keer per doel: precies op het moment dat de
      // teller van 6 naar 7 gaat (heropslaan van een al gehaalde dag telt niet).
      const aantalGehaaldVoorheen = doel.logs.filter(l => l.gehaald === true).length
      const aantalGehaald = bijgewerktDoel?.logs.filter(l => l.gehaald === true).length ?? 0
      if (aantalGehaald >= 7) {
        vitaEvent('goal_achieved')
      }
      if (aantalGehaald === 7 && aantalGehaaldVoorheen < 7) {
        const doelResult = verwerkGoalVoltooid()
        if (doelResult.xpGewonnen > 0 || doelResult.nieuweAchievements.length > 0) {
          toonXPToast(doelResult.xpGewonnen, doelResult.levelOmhoog ? doelResult.nieuwLevel : undefined, doelResult.nieuweAchievements)
        }
        // Geen aparte sync hier: de sync na verwerkGoalLog hieronder bevat deze
        // XP al (localStorage is cumulatief) — zo voorkomen we een race tussen
        // twee gelijktijdige POSTs.
      }

      // Echte streak i.p.v. hardcoded 1 — zo zijn de streak-bonussen echt haalbaar.
      const streak = bijgewerktDoel ? berekenStreak(bijgewerktDoel, weekDagen) : 1
      const xpResult = verwerkGoalLog(streak)
      if (xpResult.xpGewonnen > 0 || xpResult.nieuweAchievements.length > 0) {
        toonXPToast(xpResult.xpGewonnen, xpResult.levelOmhoog ? xpResult.nieuwLevel : undefined, xpResult.nieuweAchievements)
      }
      // Schrijf de verdiende XP direct door naar de server (duurzame bron van waarheid).
      syncXPNaarServer(xpResult.xpData).catch(() => { /* stil falen — lokaal blijft intact */ })
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

  // ── Geen doelen (nog geen check-in) ──────────────────────────────────────

  if (!selectie || !selectie.doelen.length) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
          {heeftCheckinDezeWeek ? (
            <VitaLeegScherm
              titel="Je check-in staat er al"
              boodschap="Je hebt deze week al een check-in gedaan — waarschijnlijk op een ander apparaat. Je doelen van die keuze staan alleen op dat apparaat, maar je rapport kun je hier gewoon bekijken."
              actieLabel="Bekijk je rapport"
              actieHref="/rapport"
              emotion="supportive"
            />
          ) : (
            <VitaLeegScherm
              titel="Nog geen doelen deze week"
              boodschap="Doe een korte wekelijkse check-in, dan stel ik samen met jou een paar haalbare doelen op die passen bij hoe het nú met je gaat. Ik verzin niks — ik werk met wat je me vertelt."
              actieLabel="Start check-in"
              actieHref="/checkin"
              emotion="supportive"
            />
          )}
        </main>
      </div>
    )
  }

  // ── OVERZICHT: 3 actieve doelen ───────────────────────────────────────────

  const maandag = new Date(selectie.weekStart)
  const zondag = new Date(maandag); zondag.setDate(maandag.getDate() + 6)
  const weekLabel = `${maandag.getDate()} – ${zondag.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`

  const weekDagen = maakWeekDagen(selectie.weekStart)

  // Échte voortgang van vandaag — voedt Vita's begroeting (geen verzonnen data).
  const aantalGelogdVandaag = selectie.doelen.filter(d => isVandaagGelogd(d)).length
  const aantalGehaaldVandaag = selectie.doelen.filter(d => logVandaag(d)?.gehaald === true).length
  const vlakLabels = selectie.doelen.map(d => CAT[d.vlak]?.label ?? d.vlak)

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Mijn doelen deze week</h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>{weekLabel} · AI-geselecteerde doelen</p>
          </div>
          <Link href="/checkin" style={{
            fontSize: 13, color: 'var(--mentaforce-primary)', padding: '8px 16px', borderRadius: 'var(--radius-btn)',
            background: 'var(--mentaforce-primary-light)', border: '1px solid var(--mentaforce-primary)',
            cursor: 'pointer', fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Nieuwe check-in
          </Link>
        </div>

        {/* Vita — begroet je weekdoelen en beweegt mee met je voortgang */}
        <div style={{ marginBottom: 20 }}>
          <VitaDoelenBegroeting
            aantalDoelen={selectie.doelen.length}
            aantalGelogd={aantalGelogdVandaag}
            aantalGehaald={aantalGehaaldVandaag}
            vlakLabels={vlakLabels}
          />
        </div>

        {/* Vita's korte erkenning ná het afvinken (verdwijnt vanzelf) */}
        {vitaReactie && (
          <div
            className="mf-fade-in"
            role="status"
            aria-live="polite"
            style={{ marginBottom: 20, position: 'relative' }}
          >
            {vitaReactie.vieren && (
              <div
                aria-hidden
                style={{
                  position: 'absolute', inset: -6, borderRadius: 20, zIndex: 0,
                  background: 'radial-gradient(circle at 24px 50%, color-mix(in srgb, var(--mentaforce-primary) 14%, transparent) 0%, transparent 62%)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <VitaBubbel emotion={vitaReactie.vieren ? 'proud' : 'motivated'} animate={!reduceMotion}>
                {vitaReactie.tekst}
              </VitaBubbel>
            </div>
          </div>
        )}

        {/* Domein scores */}
        {selectie.vlak_scores && Object.keys(selectie.vlak_scores).length > 0 && (
          <Card style={{ padding: '18px 22px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 12 }}>
              Jouw scores deze week
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 10 }}>
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
                      border: `1.5px solid ${score ? 'color-mix(in srgb, ' + c.kleur + ' 30%, transparent)' : 'var(--border)'}`,
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
          </Card>
        )}

        {/* AI Doelen-advies */}
        <Card style={{ padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--mentaforce-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mentaforce-primary)' }}>
                <Sparkles size={14} aria-hidden />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>AI Weekdoel-suggesties</p>
            </div>
            {!adviezen && (
              <Button size="sm" onClick={laadAdviezen} loading={adviesBezig} disabled={adviesBezig}>
                {adviesBezig ? 'Laden...' : 'Genereer suggesties'}
              </Button>
            )}
            {adviezen && (
              <Button size="sm" variant="ghost" onClick={() => setAdviezen(null)}>
                Verbergen
              </Button>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {adviezen.map((a, i) => {
                const kleur = DOMEIN_KLEUR[a.domein] ?? 'var(--mentaforce-primary)'
                return (
                  <div key={i} style={{ borderRadius: 'var(--radius-md)', padding: '12px 14px', background: `color-mix(in srgb, ${kleur} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${kleur} 30%, transparent)` }}>
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
        </Card>

        {/* 3 doelkaarten */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
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
              <Card key={doel.vlak} style={{
                borderRadius: 20,
                border: `2px solid ${gelogd ? 'color-mix(in srgb, ' + c.kleur + ' 40%, transparent)' : 'var(--border)'}`,
                padding: '22px 22px 20px',
                boxShadow: gelogd ? `0 4px 20px color-mix(in srgb, ${c.kleur} 12%, transparent)` : 'var(--shadow-card)',
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
                      color: gehaaldVandaag ? 'var(--bg-app)' : 'var(--text-3)',
                    }}>
                      {gehaaldVandaag
                        ? <Check size={12} strokeWidth={3} aria-hidden />
                        : <X size={12} strokeWidth={3} aria-hidden />
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
                      const streak = berekenStreak(doel, weekDagen)
                      return streak > 0 ? (
                        <Badge variant="success">
                          <Flame size={11} aria-hidden /> {streak} dag{streak !== 1 ? 'en' : ''} op rij
                        </Badge>
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
                  <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={`${aantalGehaald} van 7 dagen gehaald deze week`}>
                    {weekDagen.map((dag, i) => {
                      const log = doel.logs.find(l => l.datum === dag)
                      const gehaald = log?.gehaald === true
                      const isVandaagDag = dag === vandaag()
                      return (
                        <div key={i} style={{
                          flex: 1, height: 20, borderRadius: 4,
                          background: gehaald ? c.kleur : 'var(--bg-subtle)',
                          border: isVandaagDag && !gelogd ? `1.5px dashed ${c.kleur}` : 'none',
                        }} />
                      )
                    })}
                  </div>
                </div>

                {/* Log knop */}
                {gelogd ? (
                  <div style={{ borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.licht }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: c.kleur }}>
                      {gehaaldVandaag
                        ? <><Check size={14} strokeWidth={3} aria-hidden /> Doel gehaald!</>
                        : <><X size={14} strokeWidth={3} aria-hidden /> Niet gehaald</>}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openLog(doel)}
                      style={{ color: c.kleur, border: `1px solid color-mix(in srgb, ${c.kleur} 40%, transparent)` }}
                    >
                      Aanpassen
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => openLog(doel)}
                    leftIcon={<Plus size={14} strokeWidth={2.5} aria-hidden />}
                    style={{
                      width: '100%',
                      background: c.kleur,
                      color: 'var(--bg-app)',
                      boxShadow: `0 4px 12px color-mix(in srgb, ${c.kleur} 40%, transparent)`,
                    }}
                  >
                    Log vandaag
                  </Button>
                )}
              </Card>
            )
          })}
        </div>

        {/* Samenvatting strip */}
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {selectie.doelen.map(d => {
              const c = CAT[d.vlak]
              const gelogd = isVandaagGelogd(d)
              return (
                <div key={d.vlak} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: gelogd ? c.kleur : 'var(--border-strong)' }} />
                  <span style={{ fontSize: 12, color: gelogd ? 'var(--text-2)' : 'var(--text-4)', fontWeight: gelogd ? 600 : 400 }}>{c.label}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
            {selectie.doelen.filter(d => isVandaagGelogd(d)).length}/3 vandaag gelogd
          </p>
        </Card>
      </main>

      {/* Log modal */}
      <DialogRoot open={!!logModal} onOpenChange={(open) => { if (!open) setLogModal(null) }}>
        {logModal && (() => {
          const { doel } = logModal
          const c = CAT[doel.vlak] ?? { label: doel.vlak, kleur: 'var(--text-3)', bg: 'var(--bg-subtle)', licht: 'var(--bg-subtle)', icon: null }
          const logEntry = logVandaag(doel)
          return (
            <DialogContent>
              <p style={{ fontSize: 11, color: c.kleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{c.label}</p>
              <DialogTitle style={{ fontSize: 16, marginTop: 2 }}>{doel.doel_titel}</DialogTitle>

              <DialogDescription>{doel.doel_beschrijving}</DialogDescription>

              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '16px 0 12px' }}>
                Heb je vandaag <strong style={{ color: c.kleur }}>{doel.target_waarde} {doel.eenheid}</strong> gehaald?
              </p>

              {/* Gehaald / Niet gehaald knoppen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <Button
                  onClick={() => logGehaald(doel, true)}
                  leftIcon={<Check size={16} strokeWidth={3} aria-hidden />}
                  style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${logEntry?.gehaald === true ? c.kleur : 'var(--border-strong)'}`,
                    background: logEntry?.gehaald === true ? c.kleur : 'var(--bg-subtle)',
                    color: logEntry?.gehaald === true ? 'var(--bg-app)' : 'var(--text-2)',
                  }}
                >
                  Ja, gehaald
                </Button>
                <Button
                  onClick={() => logGehaald(doel, false)}
                  leftIcon={<X size={16} strokeWidth={3} aria-hidden />}
                  style={{
                    padding: '14px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${logEntry?.gehaald === false ? 'var(--mf-red)' : 'var(--border-strong)'}`,
                    background: logEntry?.gehaald === false ? 'var(--mf-red)' : 'var(--bg-subtle)',
                    color: logEntry?.gehaald === false ? 'var(--bg-app)' : 'var(--text-2)',
                  }}
                >
                  Niet gehaald
                </Button>
              </div>

              <Field label="Notitie (optioneel)">
                <Textarea
                  placeholder="Hoe ging het vandaag?"
                  value={logNotitie}
                  onChange={e => setLogNotitie(e.target.value)}
                  rows={2}
                />
              </Field>
            </DialogContent>
          )
        })()}
      </DialogRoot>
    </div>
  )
}

export default function DoelenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}><div className="mf-spinner" /></div>}>
      <DoelenInhoud />
    </Suspense>
  )
}
