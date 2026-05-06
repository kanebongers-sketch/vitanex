'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

type Scan = {
  id: string
  uitputting: number
  cynisme: number
  efficaciteit: number
  risico_niveau: string
  aangemaakt_op: string
}

const VRAGEN: { id: string; tekst: string; categorie: 'uitputting' | 'cynisme' | 'efficaciteit' }[] = [
  // Uitputting
  { id: 'u1', tekst: 'Ik voel me emotioneel uitgeput door mijn werk.', categorie: 'uitputting' },
  { id: 'u2', tekst: 'Ik voel me vermoeid als ik \'s ochtends opsta en aan de werkdag denk.', categorie: 'uitputting' },
  { id: 'u3', tekst: 'Werken de hele dag kost me echt veel energie.', categorie: 'uitputting' },
  { id: 'u4', tekst: 'Ik voel me opgebrand na mijn werk.', categorie: 'uitputting' },
  // Cynisme / distantie
  { id: 'c1', tekst: 'Ik ben minder enthousiast over mijn werk geworden.', categorie: 'cynisme' },
  { id: 'c2', tekst: 'Ik twijfel steeds vaker aan het belang van mijn werk.', categorie: 'cynisme' },
  { id: 'c3', tekst: 'Ik raak minder betrokken bij wat er op het werk speelt.', categorie: 'cynisme' },
  { id: 'c4', tekst: 'Ik distantieer me van collega\'s of klanten om mijn energie te bewaren.', categorie: 'cynisme' },
  // Professionele effectiviteit (omgekeerd: hoog = goed)
  { id: 'e1', tekst: 'Ik voel me competent in mijn werk.', categorie: 'efficaciteit' },
  { id: 'e2', tekst: 'Ik bereik de dingen die ik wil bereiken in mijn functie.', categorie: 'efficaciteit' },
  { id: 'e3', tekst: 'Ik heb het gevoel dat ik een positieve bijdrage lever.', categorie: 'efficaciteit' },
  { id: 'e4', tekst: 'In mijn beleving doe ik goed werk.', categorie: 'efficaciteit' },
]

const SCHAAL = [
  { waarde: 1, label: 'Nooit' },
  { waarde: 2, label: 'Zelden' },
  { waarde: 3, label: 'Soms' },
  { waarde: 4, label: 'Vaak' },
  { waarde: 5, label: 'Altijd' },
]

function berekenRisico(uitputting: number, cynisme: number, efficaciteit: number): string {
  // High exhaustion or cynicism = burnout risk; low efficacy also contributes
  if (uitputting >= 4 || cynisme >= 4) return 'hoog'
  if (uitputting >= 3 || cynisme >= 3 || efficaciteit <= 2) return 'matig'
  return 'laag'
}

function risicoKleur(niveau: string) {
  if (niveau === 'hoog') return { bg: '#FCEBEB', border: '#E24B4A', text: '#A32D2D', gauge: '#E24B4A' }
  if (niveau === 'matig') return { bg: '#FFF8E7', border: '#BA7517', text: '#7A4D0C', gauge: '#BA7517' }
  return { bg: '#E1F5EE', border: '#1D9E75', text: '#0F6E56', gauge: '#1D9E75' }
}

function risicoLabel(niveau: string) {
  if (niveau === 'hoog') return 'Hoog risico'
  if (niveau === 'matig') return 'Matig risico'
  return 'Laag risico'
}

function risicoAdvies(niveau: string, uitputting: number, cynisme: number, efficaciteit: number) {
  const tips: string[] = []
  if (niveau === 'hoog') {
    tips.push('Overweeg een gesprek met je leidinggevende of HR over je werkbelasting.')
    tips.push('Zoek professionele begeleiding — een coach of psycholoog kan goed helpen.')
    tips.push('Plan bewust rustmomenten in je dag en week.')
  } else if (niveau === 'matig') {
    tips.push('Let op je energiepeil en kaart knelpunten aan bij je team of leidinggevende.')
    tips.push('Probeer micro-pauzes in te bouwen tussen intensieve taken.')
  } else {
    tips.push('Goed bezig! Blijf inzetten op je herstel en energie.')
  }
  if (uitputting >= 3.5) tips.push('Je scoort hoog op uitputting — slaap en herstel zijn extra belangrijk voor jou.')
  if (cynisme >= 3.5) tips.push('Je voelt wat distantie — praten met de coach of een collega kan helpen die motivatie terug te vinden.')
  if (efficaciteit <= 2.5) tips.push('Je twijfelt aan je effectiviteit — bespreek dit eens met je leidinggevende voor wat erkenning en helderheid.')
  return tips
}

export default function BurnoutPagina() {
  const router = useRouter()
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
    if (!userId || !bedrijfId) return
    const volledig = VRAGEN.every(v => antwoorden[v.id] !== undefined)
    if (!volledig) return

    const u = gem('uitputting')
    const c = gem('cynisme')
    const e = gem('efficaciteit')
    const risico = berekenRisico(u, c, e)

    setOpslaan(true)
    const { data } = await supabase
      .from('burnout_scans')
      .insert({
        user_id: userId,
        bedrijf_id: bedrijfId,
        uitputting: Math.round(u * 10) / 10,
        cynisme: Math.round(c * 10) / 10,
        efficaciteit: Math.round(e * 10) / 10,
        risico_niveau: risico,
        antwoorden,
      })
      .select('id, uitputting, cynisme, efficaciteit, risico_niveau, aangemaakt_op')
      .single()

    setOpslaan(false)
    if (data) { setResultaat(data); setFase('resultaat') }
  }

  const voortgang = VRAGEN.filter(v => antwoorden[v.id] !== undefined).length
  const volledig = voortgang === VRAGEN.length

  if (fase === 'intro') return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />
      <main className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-8">
          <p className="text-5xl mb-4">🔥</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Burn-out risicoscan</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            12 vragen over uitputting, betrokkenheid en effectiviteit. Duurt ongeveer 3 minuten.
            Resultaten zijn alleen voor jou — niet zichtbaar voor HR of je leidinggevende.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setFase('scan')}
              className="w-full py-3 rounded-xl text-white font-medium text-sm transition"
              style={{ background: 'var(--MentaForce-primary)' }}
            >
              Start de scan
            </button>
            <button
              onClick={laadHistory}
              className="w-full py-3 rounded-xl text-gray-500 text-sm border border-gray-200 hover:bg-gray-50 transition"
            >
              Bekijk eerdere scans
            </button>
          </div>
        </div>
      </main>
    </div>
  )

  if (fase === 'scan') return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />
      <main className="max-w-lg mx-auto p-6">
        <button onClick={() => setFase('intro')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-flex items-center gap-1">
          ← Terug
        </button>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{voortgang} van {VRAGEN.length} beantwoord</span>
            <span>{Math.round((voortgang / VRAGEN.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(voortgang / VRAGEN.length) * 100}%`, background: 'var(--MentaForce-primary)' }}
            />
          </div>
        </div>

        {[
          { label: 'Energie & uitputting', categorie: 'uitputting' as const, kleur: '#E24B4A' },
          { label: 'Betrokkenheid', categorie: 'cynisme' as const, kleur: '#BA7517' },
          { label: 'Effectiviteit', categorie: 'efficaciteit' as const, kleur: '#1D9E75' },
        ].map(groep => (
          <div key={groep.categorie} className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: groep.kleur }}>
              {groep.label}
            </p>
            <div className="flex flex-col gap-5">
              {VRAGEN.filter(v => v.categorie === groep.categorie).map(vraag => (
                <div key={vraag.id}>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">{vraag.tekst}</p>
                  <div className="flex gap-2">
                    {SCHAAL.map(s => (
                      <button
                        key={s.waarde}
                        onClick={() => setAntwoorden(prev => ({ ...prev, [vraag.id]: s.waarde }))}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition border"
                        style={{
                          background: antwoorden[vraag.id] === s.waarde ? groep.kleur : 'transparent',
                          borderColor: antwoorden[vraag.id] === s.waarde ? groep.kleur : '#e5e7eb',
                          color: antwoorden[vraag.id] === s.waarde ? 'white' : '#6b7280',
                        }}
                      >
                        {s.waarde}
                        <span className="block text-[10px] leading-tight opacity-70">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          disabled={!volledig || opslaan}
          className="w-full py-3.5 rounded-xl text-white font-medium text-sm transition disabled:opacity-40"
          style={{ background: 'var(--MentaForce-primary)' }}
        >
          {opslaan ? 'Bezig...' : 'Bekijk mijn resultaat'}
        </button>
      </main>
    </div>
  )

  if (fase === 'resultaat' && resultaat) {
    const kleur = risicoKleur(resultaat.risico_niveau)
    const tips = risicoAdvies(resultaat.risico_niveau, resultaat.uitputting, resultaat.cynisme, resultaat.efficaciteit)
    return (
      <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
        <Navbar />
        <main className="max-w-lg mx-auto p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Jouw resultaat</h1>

          {/* Risk badge */}
          <div
            className="rounded-2xl border p-6 text-center mb-4"
            style={{ background: kleur.bg, borderColor: kleur.border }}
          >
            <p className="text-3xl mb-2">
              {resultaat.risico_niveau === 'laag' ? '✅' : resultaat.risico_niveau === 'matig' ? '⚠️' : '🚨'}
            </p>
            <p className="text-xl font-semibold" style={{ color: kleur.text }}>
              {risicoLabel(resultaat.risico_niveau)}
            </p>
            <p className="text-xs mt-1" style={{ color: kleur.text, opacity: 0.7 }}>
              {new Date(resultaat.aangemaakt_op).toLocaleDateString('nl-BE')}
            </p>
          </div>

          {/* Score bars */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-4">Scores</p>
            {[
              { label: 'Uitputting', waarde: resultaat.uitputting, kleur: '#E24B4A', info: 'Lager is beter' },
              { label: 'Distantie', waarde: resultaat.cynisme, kleur: '#BA7517', info: 'Lager is beter' },
              { label: 'Effectiviteit', waarde: resultaat.efficaciteit, kleur: '#1D9E75', info: 'Hoger is beter' },
            ].map(s => (
              <div key={s.label} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{s.label}</span>
                  <span className="text-gray-400">{s.info} · {s.waarde}/5</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(s.waarde / 5) * 100}%`, background: s.kleur }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Advice */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Persoonlijk advies</p>
            <ul className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-600 leading-relaxed">
                  <span className="flex-shrink-0 mt-0.5">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/coach"
              className="flex-1 py-3 rounded-xl text-sm font-medium text-center text-white transition"
              style={{ background: 'var(--MentaForce-primary)' }}
            >
              Praat met de coach
            </Link>
            <button
              onClick={() => { setAntwoorden({}); setFase('intro') }}
              className="flex-1 py-3 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Opnieuw scannen
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (fase === 'history') return (
    <div className="min-h-screen" style={{ background: '#F8F9FA' }}>
      <Navbar />
      <main className="max-w-lg mx-auto p-6">
        <button onClick={() => setFase('intro')} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-flex items-center gap-1">
          ← Terug
        </button>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Eerdere scans</h1>
        {historyLaden ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--MentaForce-primary)' }} />
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">Nog geen scans gedaan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(s => {
              const kleur = risicoKleur(s.risico_niveau)
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {new Date(s.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: kleur.bg, color: kleur.text }}
                    >
                      {risicoLabel(s.risico_niveau)}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>Uitputting: <strong>{s.uitputting}/5</strong></span>
                    <span>Distantie: <strong>{s.cynisme}/5</strong></span>
                    <span>Effect.: <strong>{s.efficaciteit}/5</strong></span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )

  return null
}
