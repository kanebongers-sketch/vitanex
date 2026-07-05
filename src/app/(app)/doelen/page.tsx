'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { verwerkGoalLog, verwerkGoalVoltooid, LEVEL_NAMEN, type Achievement } from '@/lib/xp'
import { syncXPNaarServer } from '@/lib/xp-sync'
import {
  type WellbeingCat, type WeekDoel, type WeekSelectie, type WeekHistorieEntry,
  vandaag, laadWeekSelectie, slaWeekSelectieOp, isVandaagGelogd, logVandaag,
  scoreKleur, berekenStreak, laadWeekHistorie,
} from '@/lib/weekdoelen'
import { CAT } from '@/lib/doelen-config'
import { authFetch } from '@/lib/auth-fetch'
import { vitaEvent } from '@/lib/vita/events'
import VitaLeegScherm from '@/components/vita/VitaLeegScherm'
import VitaDoelenBegroeting from '@/components/vita/VitaDoelenBegroeting'
import VitaBubbel from '@/components/vita/VitaBubbel'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import DoelKaart, { type CatInfo } from './DoelKaart'
import LogDialog from './LogDialog'


type DoelenAdvies = { domein: string; doel: string; waarom: string }

const DOMEIN_KLEUR: Record<string, string> = {
  slaap: 'var(--mf-purple)', stress: 'var(--mf-red)', energie: 'var(--mf-amber)',
  focus: 'var(--mf-green)', balans: 'var(--mf-purple)', motivatie: 'var(--mf-red)',
}

const FALLBACK_CAT: CatInfo = {
  label: '', kleur: 'var(--text-3)', bg: 'var(--bg-subtle)', licht: 'var(--bg-subtle)', icon: null,
}

/** De 7 dagen (YYYY-MM-DD) van de actieve doelenweek. */
function maakWeekDagen(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/**
 * De historie-entry van exact de week vóór de actieve week, of null.
 * Alleen de direct voorafgaande week telt als "vorige week" — een oudere
 * entry (gat in de historie) levert géén vergelijking op. Lege historie
 * (vóór de eerste week-rollover) geeft vanzelf null: dan tonen we niets.
 */
function vindVorigeWeek(weekStart: string, historie: WeekHistorieEntry[]): WeekHistorieEntry | null {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  const vorigeStart = d.toISOString().slice(0, 10)
  return historie.find(h => h.weekStart === vorigeStart) ?? null
}

/**
 * Hoe vaak hetzelfde doel (vlak + titel) vorige week gehaald is, of undefined
 * als het doel toen niet bestond (of de opgeslagen teller corrupt is) —
 * dan is er eerlijkheidshalve geen vergelijking te maken.
 */
function vorigeWeekGehaaldVoor(doel: WeekDoel, vorigeWeek: WeekHistorieEntry | null): number | undefined {
  const match = vorigeWeek?.doelen.find(v => v.vlak === doel.vlak && v.doel_titel === doel.doel_titel)
  return typeof match?.gehaald === 'number' && match.gehaald >= 0 ? match.gehaald : undefined
}

/* Kaart-hover en check-pop — zelfde karakter als home (150–250ms, alleen
   transform/opacity), met reduced-motion overrides. */
const DOELEN_STYLES = `
@keyframes mf-doel-pop {
  from { transform: scale(0.4); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.mf-doel-pop { animation: mf-doel-pop 0.2s var(--ease) both; }
.mf-doel-kaart { transition: border-color 0.18s var(--ease), box-shadow 0.18s var(--ease), transform 0.18s var(--ease); }
.mf-doel-kaart:hover { transform: translateY(-1px); }
@media (prefers-reduced-motion: reduce) {
  .mf-doel-pop { animation: none; }
  .mf-doel-kaart { transition: none; }
  .mf-doel-kaart:hover { transform: none; }
}
`

// ─── Main ─────────────────────────────────────────────────────────────────────

function DoelenInhoud() {
  const router = useRouter()
  const { toast } = useToast()
  const [klaar, setKlaar]         = useState(false)
  const [selectie, setSelectie]   = useState<WeekSelectie | null>(null)
  // Week-op-week: de afgeronde week direct vóór de actieve week (of null).
  // Momentopname bij laden — de historie verandert niet tijdens de sessie.
  const [vorigeWeek, setVorigeWeek] = useState<WeekHistorieEntry | null>(null)
  // Cross-device eerlijkheid: staat er op de server al een check-in van deze week,
  // ook al zijn de doelen op dít apparaat niet lokaal bekend?
  const [heeftCheckinDezeWeek, setHeeftCheckinDezeWeek] = useState(false)

  // Kaartvolgorde: momentopname bij laden — nog-niet-gelogde doelen bovenaan,
  // afgeronde stil eronder. Bewust niet live hersorteren: geen springende kaarten
  // op het moment van afvinken.
  const [doelVolgorde, setDoelVolgorde] = useState<WellbeingCat[]>([])

  // Log modal (details/notitie); snelle logs gaan buiten de dialog om.
  const [logModal, setLogModal]   = useState<{ doel: WeekDoel } | null>(null)
  const [logNotitie, setLogNotitie] = useState('')

  // Micro-feedback: welke kaart is zojuist afgevinkt (check-pop) en welk
  // weekdoel is zojuist volledig behaald (kalme badge-fade).
  const [netGelogdVlak, setNetGelogdVlak] = useState<WellbeingCat | null>(null)
  const [netBehaaldVlak, setNetBehaaldVlak] = useState<WellbeingCat | null>(null)

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
    // De lazy useState-initializer las de voorkeur al; hier alleen abonneren op wijzigingen.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
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
      if (sel && sel.doelen.length) {
        setVorigeWeek(vindVorigeWeek(sel.weekStart, laadWeekHistorie()))
        // Hiërarchie bij binnenkomst: open doelen eerst, vandaag-al-gelogde eronder.
        const volgorde = [...sel.doelen]
          .sort((a, b) => Number(isVandaagGelogd(a)) - Number(isVandaagGelogd(b)))
          .map(d => d.vlak)
        setDoelVolgorde(volgorde)
      } else {
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
  // `notitie === undefined` betekent: snelle log vanaf de kaart — bewaar dan
  // een eventueel eerder vandaag geschreven notitie in plaats van die te wissen.

  function logGehaald(doel: WeekDoel, gehaald: boolean, notitie?: string) {
    if (!selectie) return
    const bestaandeNotitie = logVandaag(doel)?.notitie
    const nieuweNotitie = notitie !== undefined ? (notitie.trim() || undefined) : bestaandeNotitie

    const bijgewerkt: WeekSelectie = {
      ...selectie,
      doelen: selectie.doelen.map(d => {
        if (d.vlak !== doel.vlak) return d
        const nieuweLog = { datum: vandaag(), gehaald, notitie: nieuweNotitie }
        const logs = [...d.logs.filter(l => l.datum !== vandaag()), nieuweLog]
        return { ...d, logs }
      }),
    }
    slaWeekSelectieOp(bijgewerkt)
    setSelectie(bijgewerkt)
    setLogModal(null)
    setLogNotitie('')
    setNetGelogdVlak(gehaald ? doel.vlak : null)

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
        setNetBehaaldVlak(doel.vlak)
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

  // Week-op-week, alleen met échte historie (gevuld ná de eerste rollover).
  // Feitelijk en schuldvrij: we tellen wat er vorige week gelogd-gehaald is,
  // zonder oordeel. Corrupte tellers vallen weg via de number-check.
  const vorigeWeekGehaald = vorigeWeek
    ? vorigeWeek.doelen.reduce((som, d) => som + (typeof d.gehaald === 'number' && d.gehaald >= 0 ? d.gehaald : 0), 0)
    : 0
  const vorigeWeekTotaalDagen = (vorigeWeek?.doelen.length ?? 0) * 7

  // Vaste volgorde uit de momentopname bij laden (open doelen eerst).
  const gesorteerdeDoelen = doelVolgorde.length
    ? [...selectie.doelen].sort((a, b) => doelVolgorde.indexOf(a.vlak) - doelVolgorde.indexOf(b.vlak))
    : selectie.doelen
  // "Wat is vandaag de volgende stap?" — het eerste doel dat nog open staat.
  const volgendeStapVlak = gesorteerdeDoelen.find(d => !isVandaagGelogd(d))?.vlak ?? null

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <style>{DOELEN_STYLES}</style>
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

        {/* Doelkaarten éérst — de volgende stap van vandaag staat bovenaan */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
          {gesorteerdeDoelen.map(doel => (
            <DoelKaart
              key={doel.vlak}
              doel={doel}
              cat={CAT[doel.vlak] ?? { ...FALLBACK_CAT, label: doel.vlak }}
              weekDagen={weekDagen}
              isVolgendeStap={doel.vlak === volgendeStapVlak}
              netGelogd={doel.vlak === netGelogdVlak}
              netBehaald={doel.vlak === netBehaaldVlak}
              vorigeWeekGehaald={vorigeWeekGehaaldVoor(doel, vorigeWeek)}
              onLog={(d, gehaald) => logGehaald(d, gehaald)}
              onDetails={openLog}
            />
          ))}
        </div>

        {/* Samenvatting strip */}
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {selectie.doelen.map(d => {
              const c = CAT[d.vlak] ?? { ...FALLBACK_CAT, label: d.vlak }
              const gelogd = isVandaagGelogd(d)
              return (
                <div key={d.vlak} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: gelogd ? c.kleur : 'var(--border-strong)' }} />
                  <span style={{ fontSize: 12, color: gelogd ? 'var(--text-2)' : 'var(--text-4)', fontWeight: gelogd ? 600 : 400 }}>{c.label}</span>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
              {aantalGelogdVandaag}/{selectie.doelen.length} vandaag gelogd
            </p>
            {/* Alleen tonen met echte historie van exact de vorige week — geen
                schattingen, geen "0" bij een lege historie. Feitelijk, zonder oordeel. */}
            {vorigeWeek && vorigeWeekTotaalDagen > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                Vorige week {vorigeWeekGehaald} van {vorigeWeekTotaalDagen} dagen gehaald
              </p>
            )}
          </div>
        </Card>

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
        <Card style={{ padding: '18px 22px' }}>
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
      </main>

      {/* Log modal — details/notitie; Enter bevestigt als gehaald */}
      <LogDialog
        doel={logModal?.doel ?? null}
        cat={logModal ? (CAT[logModal.doel.vlak] ?? { ...FALLBACK_CAT, label: logModal.doel.vlak }) : null}
        notitie={logNotitie}
        onNotitieChange={setLogNotitie}
        onBevestig={gehaald => { if (logModal) logGehaald(logModal.doel, gehaald, logNotitie) }}
        onSluit={() => setLogModal(null)}
      />
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
