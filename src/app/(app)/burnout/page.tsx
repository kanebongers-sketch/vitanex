'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import type { Params } from '@/lib/i18n/vertaal'


const RISICO_GLOW: Record<string, string> = {
  laag:  'var(--mf-green-light)',
  matig: 'var(--mf-amber-light)',
  hoog:  'var(--mf-red-light)',
}

type Scan = {
  id: string
  uitputting: number
  cynisme: number
  efficaciteit: number
  risico_niveau: string
  aangemaakt_op: string
}

// Teksten in het woordenboek: mentaal.burnout.vraag.<id> en
// mentaal.burnout.schaal.<sleutel>.
const VRAGEN: { id: string; categorie: 'uitputting' | 'cynisme' | 'efficaciteit' }[] = [
  // Uitputting
  { id: 'u1', categorie: 'uitputting' },
  { id: 'u2', categorie: 'uitputting' },
  { id: 'u3', categorie: 'uitputting' },
  { id: 'u4', categorie: 'uitputting' },
  // Cynisme / distantie
  { id: 'c1', categorie: 'cynisme' },
  { id: 'c2', categorie: 'cynisme' },
  { id: 'c3', categorie: 'cynisme' },
  { id: 'c4', categorie: 'cynisme' },
  // Professionele effectiviteit (omgekeerd: hoog = goed)
  { id: 'e1', categorie: 'efficaciteit' },
  { id: 'e2', categorie: 'efficaciteit' },
  { id: 'e3', categorie: 'efficaciteit' },
  { id: 'e4', categorie: 'efficaciteit' },
]

const SCHAAL = [
  { waarde: 1, sleutel: 'nooit' },
  { waarde: 2, sleutel: 'zelden' },
  { waarde: 3, sleutel: 'soms' },
  { waarde: 4, sleutel: 'vaak' },
  { waarde: 5, sleutel: 'altijd' },
]

type Vertaler = (sleutel: string, params?: Params) => string

function berekenRisico(uitputting: number, cynisme: number, efficaciteit: number): string {
  // High exhaustion or cynicism = burnout risk; low efficacy also contributes
  if (uitputting >= 4 || cynisme >= 4) return 'hoog'
  if (uitputting >= 3 || cynisme >= 3 || efficaciteit <= 2) return 'matig'
  return 'laag'
}

function risicoKleur(niveau: string) {
  if (niveau === 'hoog') return { bg: 'var(--mf-red-light)', border: 'var(--mf-red)', text: 'var(--mf-red)', gauge: 'var(--mf-red)' }
  if (niveau === 'matig') return { bg: 'var(--mf-amber-light)', border: 'var(--mf-amber)', text: 'var(--mf-amber-dark)', gauge: 'var(--mf-amber)' }
  return { bg: 'var(--mf-green-light)', border: 'var(--mf-green)', text: 'var(--mf-green-dark)', gauge: 'var(--mf-green)' }
}

function risicoLabel(niveau: string, t: Vertaler) {
  if (niveau === 'hoog') return t('mentaal.burnout.risicoHoog')
  if (niveau === 'matig') return t('mentaal.burnout.risicoMatig')
  return t('mentaal.burnout.risicoLaag')
}

function risicoAdvies(niveau: string, uitputting: number, cynisme: number, efficaciteit: number, t: Vertaler) {
  const tips: string[] = []
  if (niveau === 'hoog') {
    tips.push(t('mentaal.burnout.adviesHoog1'))
    tips.push(t('mentaal.burnout.adviesHoog2'))
    tips.push(t('mentaal.burnout.adviesHoog3'))
  } else if (niveau === 'matig') {
    tips.push(t('mentaal.burnout.adviesMatig1'))
    tips.push(t('mentaal.burnout.adviesMatig2'))
  } else {
    tips.push(t('mentaal.burnout.adviesLaag'))
  }
  if (uitputting >= 3.5) tips.push(t('mentaal.burnout.adviesUitputting'))
  if (cynisme >= 3.5) tips.push(t('mentaal.burnout.adviesDistantie'))
  if (efficaciteit <= 2.5) tips.push(t('mentaal.burnout.adviesEffectiviteit'))
  return tips
}

export default function BurnoutPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const [fase, setFase] = useState<'intro' | 'scan' | 'resultaat' | 'history'>('intro')
  const [antwoorden, setAntwoorden] = useState<Record<string, number>>({})
  const [opslaan, setOpslaan] = useState(false)
  const [resultaat, setResultaat] = useState<Scan | null>(null)
  const [history, setHistory] = useState<Scan[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [historyLaden, setHistoryLaden] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      if (profiel?.bedrijf_id) setBedrijfId(profiel.bedrijf_id)
    }
    check()
  }, [router])

  async function laadHistory() {
    if (!userId) return
    setHistoryLaden(true)
    const { data } = await supabase
      .from('burnout_scans')
      .select('id, uitputting, cynisme, efficaciteit, risico_niveau, aangemaakt_op')
      .eq('user_id', userId)
      .order('aangemaakt_op', { ascending: false })
      .limit(10)
    setHistory(data || [])
    setHistoryLaden(false)
    setFase('history')
  }

  function gem(categorie: 'uitputting' | 'cynisme' | 'efficaciteit') {
    const vragen = VRAGEN.filter(v => v.categorie === categorie)
    const totaal = vragen.reduce((s, v) => s + (antwoorden[v.id] ?? 0), 0)
    return totaal / vragen.length
  }

  async function submit() {
    if (!userId) return
    const volledig = VRAGEN.every(v => antwoorden[v.id] !== undefined)
    if (!volledig) return

    const u = gem('uitputting')
    const c = gem('cynisme')
    const e = gem('efficaciteit')
    const risico = berekenRisico(u, c, e)

    // Lokaal resultaat, zodat de gebruiker altijd een uitslag ziet — ook als
    // opslaan niet lukt.
    const lokaalResultaat: Scan = {
      id: 'lokaal',
      uitputting: Math.round(u * 10) / 10,
      cynisme: Math.round(c * 10) / 10,
      efficaciteit: Math.round(e * 10) / 10,
      risico_niveau: risico,
      aangemaakt_op: new Date().toISOString(),
    }

    if (!bedrijfId) {
      toast({
        title: t('mentaal.burnout.nietOpgeslagen'),
        description: t('mentaal.burnout.geenBedrijf'),
        variant: 'warning',
      })
      setResultaat(lokaalResultaat)
      setFase('resultaat')
      return
    }

    setOpslaan(true)
    const { data, error } = await supabase
      .from('burnout_scans')
      .insert({
        user_id: userId,
        bedrijf_id: bedrijfId,
        uitputting: lokaalResultaat.uitputting,
        cynisme: lokaalResultaat.cynisme,
        efficaciteit: lokaalResultaat.efficaciteit,
        risico_niveau: risico,
      })
      .select('id, uitputting, cynisme, efficaciteit, risico_niveau, aangemaakt_op')
      .single()

    setOpslaan(false)
    if (error || !data) {
      toast({
        title: t('mentaal.burnout.nietOpgeslagen'),
        description: t('mentaal.burnout.opslaanMislukt'),
        variant: 'error',
      })
      setResultaat(lokaalResultaat)
      setFase('resultaat')
      return
    }
    setResultaat(data)
    setFase('resultaat')
  }

  const voortgang = VRAGEN.filter(v => antwoorden[v.id] !== undefined).length
  const volledig = voortgang === VRAGEN.length

  if (fase === 'intro') return (
    <div className="mf-mesh-bg min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-6" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="rounded-2xl p-8 text-center mt-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex justify-center mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--mf-red)' }} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z"/><path d="M9.879 16.121A3 3 0 1 0 12.99 12L11 14"/></svg></div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{t('mentaal.burnout.titel')}</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)' }}>
            {t('mentaal.burnout.intro', { aantal: VRAGEN.length })}
            {' '}{t('mentaal.burnout.privacy')}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setFase('scan')}
              style={{ width: '100%' }}
            >
              {t('mentaal.burnout.start')}
            </Button>
            <button
              onClick={laadHistory}
              className="w-full py-3 rounded-xl text-sm transition"
              style={{ color: 'var(--text-3)', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
            >
              {t('mentaal.burnout.eerdereBekijken')}
            </button>
          </div>
        </div>
      </main>
    </div>
  )

  if (fase === 'scan') return (
    <div className="mf-mesh-bg min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-6" style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setFase('intro')} className="text-sm mb-4 inline-flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> {t('mentaal.burnout.terug')}
        </button>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-4)' }}>
            <span>{t('mentaal.burnout.beantwoord', { aantal: voortgang, totaal: VRAGEN.length })}</span>
            <span>{Math.round((voortgang / VRAGEN.length) * 100)}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={voortgang}
            aria-valuemin={0}
            aria-valuemax={VRAGEN.length}
            aria-label={t('mentaal.burnout.voortgangLabel', { aantal: voortgang, totaal: VRAGEN.length })}
            style={{ background: 'var(--bg-subtle)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(voortgang / VRAGEN.length) * 100}%`, background: 'var(--mentaforce-primary)' }}
            />
          </div>
        </div>

        {[
          { label: t('mentaal.burnout.groepUitputting'), categorie: 'uitputting' as const, kleur: 'var(--mf-red)' },
          { label: t('mentaal.burnout.groepBetrokkenheid'), categorie: 'cynisme' as const, kleur: 'var(--mf-amber)' },
          { label: t('mentaal.burnout.groepEffectiviteit'), categorie: 'efficaciteit' as const, kleur: 'var(--mf-green)' },
        ].map(groep => (
          <div key={groep.categorie} className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: groep.kleur }}>
              {groep.label}
            </p>
            <div className="flex flex-col gap-5">
              {VRAGEN.filter(v => v.categorie === groep.categorie).map(vraag => (
                <div key={vraag.id}>
                  <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{t(`mentaal.burnout.vraag.${vraag.id}`)}</p>
                  <div className="flex gap-2">
                    {SCHAAL.map(s => (
                      <button
                        key={s.waarde}
                        onClick={() => setAntwoorden(prev => ({ ...prev, [vraag.id]: s.waarde }))}
                        aria-label={t('mentaal.burnout.schaalLabel', { waarde: s.waarde, label: t(`mentaal.burnout.schaal.${s.sleutel}`) })}
                        aria-pressed={antwoorden[vraag.id] === s.waarde}
                        className="flex-1 rounded-lg text-xs font-medium transition border"
                        style={{
                          minHeight: 44,
                          background: antwoorden[vraag.id] === s.waarde ? groep.kleur : 'transparent',
                          borderColor: antwoorden[vraag.id] === s.waarde ? groep.kleur : 'var(--border)',
                          color: antwoorden[vraag.id] === s.waarde ? 'white' : 'var(--text-3)',
                        }}
                      >
                        {s.waarde}
                        <span className="block text-[10px] leading-tight opacity-70">{t(`mentaal.burnout.schaal.${s.sleutel}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          variant="primary"
          size="lg"
          onClick={submit}
          disabled={!volledig}
          loading={opslaan}
          style={{ width: '100%' }}
        >
          {opslaan ? t('mentaal.burnout.bezig') : t('mentaal.burnout.bekijkResultaat')}
        </Button>
      </main>
    </div>
  )

  if (fase === 'resultaat' && resultaat) {
    const kleur = risicoKleur(resultaat.risico_niveau)
    const tips = risicoAdvies(resultaat.risico_niveau, resultaat.uitputting, resultaat.cynisme, resultaat.efficaciteit, t)
    return (
      <div className="mf-mesh-bg min-h-screen" style={{ background: 'var(--bg-app)' }}>
        <Navbar />
        <main className="p-6" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-1)' }}>{t('mentaal.burnout.resultaat')}</h1>

          {/* Risk badge */}
          <div
            className="rounded-2xl border p-6 text-center mb-4"
            style={{ background: kleur.bg, borderColor: kleur.border }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${RISICO_GLOW[resultaat.risico_niveau] ?? 'var(--mf-green-light)'} 0%, transparent 70%)` }} />
            </div>
            <p className="text-xl font-semibold" style={{ color: kleur.text }}>
              {risicoLabel(resultaat.risico_niveau, t)}
            </p>
            <p className="text-xs mt-1" style={{ color: kleur.text, opacity: 0.7 }}>
              {new Date(resultaat.aangemaakt_op).toLocaleDateString(locale)}
            </p>
          </div>

          {/* Score bars */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-2)' }}>{t('mentaal.burnout.scores')}</p>
            {[
              { label: t('mentaal.burnout.uitputting'), waarde: resultaat.uitputting, kleur: 'var(--mf-red)', info: t('mentaal.burnout.lagerBeter') },
              { label: t('mentaal.burnout.distantie'), waarde: resultaat.cynisme, kleur: 'var(--mf-amber)', info: t('mentaal.burnout.lagerBeter') },
              { label: t('mentaal.burnout.effectiviteit'), waarde: resultaat.efficaciteit, kleur: 'var(--mf-green)', info: t('mentaal.burnout.hogerBeter') },
            ].map(s => (
              <div key={s.label} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: 'var(--text-2)' }}>{s.label}</span>
                  <span style={{ color: 'var(--text-4)' }}>{s.info} · {s.waarde}/5</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(s.waarde / 5) * 100}%`, background: s.kleur }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Advice */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>{t('mentaal.burnout.advies')}</p>
            <ul className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  <span className="flex-shrink-0 mt-0.5" style={{color: 'var(--mentaforce-primary)'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg></span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/coach"
              className="flex-1 py-3 rounded-xl text-sm font-medium text-center transition"
              style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)' }}
            >
              {t('mentaal.burnout.praatCoach')}
            </Link>
            <button
              onClick={() => { setAntwoorden({}); setFase('intro') }}
              className="flex-1 py-3 rounded-xl text-sm transition"
              style={{ border: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--bg-subtle)' }}
            >
              {t('mentaal.burnout.opnieuw')}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (fase === 'history') return (
    <div className="mf-mesh-bg min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="p-6" style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={() => setFase('intro')} className="text-sm mb-4 inline-flex items-center gap-1" style={{ color: 'var(--text-4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> {t('mentaal.burnout.terug')}
        </button>
        <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-1)' }}>{t('mentaal.burnout.eerdere')}</h1>
        {historyLaden ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--mf-green)' }} />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>{t('mentaal.burnout.geenScans')}</p>
          </div>
        ) : (
          <>
            {/* Trend tijdlijn */}
            {history.length >= 2 && (() => {
              const chronologisch = [...history].reverse().slice(-6)
              const scores = (s: Scan) => (s.uitputting + s.cynisme) / 2
              const eerst = scores(chronologisch[0])
              const laatste = scores(chronologisch[chronologisch.length - 1])
              const delta = laatste - eerst
              const trendLabel = delta < -0.3 ? `↗ ${t('mentaal.burnout.verbetering')}` : delta > 0.3 ? `↘ ${t('mentaal.burnout.verslechtering')}` : `→ ${t('mentaal.burnout.stabiel')}`
              const trendKleur = delta < -0.3 ? 'var(--mf-green)' : delta > 0.3 ? 'var(--mf-red)' : 'var(--mf-amber)'
              return (
                <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)' }}>
                      {t('mentaal.burnout.trend')}
                    </p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: trendKleur }}>{trendLabel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, position: 'relative' }}>
                    {/* Connecting line */}
                    <div style={{ position: 'absolute', top: 18, left: 18, right: 18, height: 2, background: 'var(--border)', zIndex: 0 }} />
                    {chronologisch.map((s, i) => {
                      const k = risicoKleur(s.risico_niveau)
                      const datum = new Date(s.aangemaakt_op)
                      const label = datum.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
                      return (
                        <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: k.bg, border: `2.5px solid ${k.gauge}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, color: k.text,
                          }}>
                            {s.risico_niveau === 'hoog' ? '!' : s.risico_niveau === 'matig' ? '~' : '✓'}
                          </div>
                          <span style={{ fontSize: 8, color: 'var(--text-4)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    {[
                      { kleur: 'var(--mf-green)', label: `✓ ${t('mentaal.burnout.laag')}` },
                      { kleur: 'var(--mf-amber)', label: `~ ${t('mentaal.burnout.matig')}` },
                      { kleur: 'var(--mf-red)',   label: `! ${t('mentaal.burnout.hoog')}` },
                    ].map(l => (
                      <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-4)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.kleur, display: 'inline-block' }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}

          <div className="flex flex-col gap-3">
            {history.map(s => {
              const kleur = risicoKleur(s.risico_niveau)
              return (
                <div key={s.id} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                      {new Date(s.aangemaakt_op).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: kleur.bg, color: kleur.text }}
                    >
                      {risicoLabel(s.risico_niveau, t)}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>{t('mentaal.burnout.uitputting')}: <strong>{s.uitputting}/5</strong></span>
                    <span>{t('mentaal.burnout.distantie')}: <strong>{s.cynisme}/5</strong></span>
                    <span>{t('mentaal.burnout.effectKort')}: <strong>{s.efficaciteit}/5</strong></span>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </main>
    </div>
  )

  return null
}
