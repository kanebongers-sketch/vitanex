'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/Navbar'

type Dimensie = 'D' | 'I' | 'S' | 'C'
interface Vraag { id: number; tekst: string; dimensie: Dimensie }

const VRAGEN: Vraag[] = [
  { id: 1, tekst: 'Ik neem graag het voortouw in nieuwe situaties.', dimensie: 'D' },
  { id: 2, tekst: 'Ik stel hoge eisen aan mezelf en anderen.', dimensie: 'D' },
  { id: 3, tekst: 'Ik ga direct op mijn doel af, zonder omwegen.', dimensie: 'D' },
  { id: 4, tekst: 'Ik neem snel beslissingen, ook zonder alle informatie.', dimensie: 'D' },
  { id: 5, tekst: 'Ik daag bestaande situaties en regels graag uit.', dimensie: 'D' },
  { id: 6, tekst: 'Ik werk hard om de beste te zijn in wat ik doe.', dimensie: 'D' },
  { id: 7, tekst: 'Ik maak makkelijk nieuwe contacten en vrienden.', dimensie: 'I' },
  { id: 8, tekst: 'Ik ben enthousiast en positief ingesteld.', dimensie: 'I' },
  { id: 9, tekst: 'Ik weet mensen te overtuigen en te inspireren.', dimensie: 'I' },
  { id: 10, tekst: 'Ik ben graag het middelpunt van de aandacht.', dimensie: 'I' },
  { id: 11, tekst: 'Ik deel mijn gevoelens en ervaringen open met anderen.', dimensie: 'I' },
  { id: 12, tekst: 'Ik breng energie en positiviteit in een groep.', dimensie: 'I' },
  { id: 13, tekst: 'Mensen kunnen op mij rekenen: ik ben betrouwbaar en consistent.', dimensie: 'S' },
  { id: 14, tekst: 'Ik werk het liefst in een stabiele, voorspelbare omgeving.', dimensie: 'S' },
  { id: 15, tekst: 'Ik ben een goede luisteraar en geef anderen ruimte.', dimensie: 'S' },
  { id: 16, tekst: 'Ik werk graag samen met anderen aan een gemeenschappelijk doel.', dimensie: 'S' },
  { id: 17, tekst: 'Ik blijf geduldig in stressvolle of onduidelijke situaties.', dimensie: 'S' },
  { id: 18, tekst: 'Ik streef naar harmonie en goede relaties in mijn omgeving.', dimensie: 'S' },
  { id: 19, tekst: 'Nauwkeurigheid en kwaliteit zijn voor mij erg belangrijk.', dimensie: 'C' },
  { id: 20, tekst: 'Ik analyseer situaties grondig voordat ik actie onderneem.', dimensie: 'C' },
  { id: 21, tekst: 'Ik volg graag vaste procedures en richtlijnen.', dimensie: 'C' },
  { id: 22, tekst: 'Ik controleer mijn werk meerdere keren om fouten te vermijden.', dimensie: 'C' },
  { id: 23, tekst: 'Ik werk op een systematische en gestructureerde manier.', dimensie: 'C' },
  { id: 24, tekst: 'Ik houd hoge kwaliteitsstandaarden aan in alles wat ik doe.', dimensie: 'C' },
]

const DIM_KLEUR: Record<Dimensie, string> = { D: '#EF4444', I: '#F59E0B', S: '#10B981', C: '#3B82F6' }
const DIM_LABEL: Record<Dimensie, string> = { D: 'Dominantie', I: 'Invloed', S: 'Stabiliteit', C: 'Conscientieusheid' }
const DIM_BESCHR: Record<Dimensie, string> = {
  D: 'Resultaatgericht, direct en besluitvaardig. Je neemt graag de leiding en stelt hoge eisen.',
  I: 'Enthousiast, sociaal en overtuigend. Je inspireert anderen en brengt energie in het team.',
  S: 'Betrouwbaar, geduldig en samenwerkingsgericht. Je zorgt voor stabiliteit en harmonie.',
  C: 'Nauwkeurig, analytisch en kwaliteitsgericht. Je werkt systematisch en grondig.',
}
const SCHAAL = ['Helemaal niet', 'Nauwelijks', 'Soms', 'Vaak', 'Volledig']

export default function DiscPage() {
  const router = useRouter()
  const [geladen, setGeladen] = useState(false)
  const [antwoorden, setAntwoorden] = useState<Record<number, number>>({})
  const [huidigIdx, setHuidigIdx] = useState(0)
  const [klaar, setKlaar] = useState(false)
  const [scores, setScores] = useState<Record<Dimensie, number>>({ D: 0, I: 0, S: 0, C: 0 })
  const [primair, setPrimair] = useState<Dimensie>('D')
  const [verzonden, setVerzonden] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)
      setGeladen(true)
    }
    init()
  }, [router])

  function antwoord(vraagId: number, waarde: number) {
    const nieuw = { ...antwoorden, [vraagId]: waarde }
    setAntwoorden(nieuw)
    if (huidigIdx < VRAGEN.length - 1) {
      setTimeout(() => setHuidigIdx(v => v + 1), 300)
    } else { bereken(nieuw) }
  }

  function bereken(ant: Record<number, number>) {
    const s: Record<Dimensie, number> = { D: 0, I: 0, S: 0, C: 0 }
    for (const v of VRAGEN) s[v.dimensie] += ant[v.id] ?? 0
    setScores(s)
    const pr = (Object.entries(s) as [Dimensie, number][]).reduce((m, c) => c[1] > m[1] ? c : m)[0]
    setPrimair(pr)
    setKlaar(true)
  }

  async function verzend() {
    setBezig(true)
    setFout('')
    try {
      const res = await authFetch('/api/disc', {
        method: 'POST',
        body: JSON.stringify({ d_score: scores.D, i_score: scores.I, s_score: scores.S, c_score: scores.C, primair_profiel: primair, antwoorden, bedrijf_id: bedrijfId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(j.error ?? 'Verwerking mislukt')
      }
      setVerzonden(true)
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Er ging iets mis')
    } finally { setBezig(false) }
  }

  if (!geladen) return (
    <div style={{ minHeight: '100vh', background: '#060d1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#64748b' }}>Laden...</span>
    </div>
  )
  const hv = VRAGEN[huidigIdx]
  return (
    <div style={{ minHeight: '100vh', background: '#060d1f', color: '#f1f5f9' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>DISC Persoonlijkheidstest</h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>24 vragen. Geen goed of fout antwoord.</p>
        </div>
        {verzonden && (
          <div style={{ background: '#0f1e36', border: '1px solid #1e3a5f', borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#10B981', marginBottom: 8 }}>Resultaat opgeslagen!</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>Je DISC-profiel en rapport zijn opgeslagen.</p>
            <button onClick={() => router.push('/bestanden')} style={{ background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Bekijk je rapport</button>
          </div>
        )}
        {klaar && !verzonden && (
          <div style={{ background: '#0f1e36', border: '1px solid #1e3a5f', borderRadius: 16, padding: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>Jouw DISC-profiel</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 28 }}>Primair: <span style={{ color: DIM_KLEUR[primair], fontWeight: 700, fontSize: 18 }}>{primair} - {DIM_LABEL[primair]}</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {(Object.entries(scores) as [Dimensie, number][]).map(([dim, score]) => (
                <div key={dim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: DIM_KLEUR[dim], fontWeight: 600 }}>{dim} - {DIM_LABEL[dim]}</span>
                    <span style={{ color: '#94a3b8', fontSize: 14 }}>{score}/30</span>
                  </div>
                  <div style={{ background: '#1e293b', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: ((score / 30) * 100) + '%', height: '100%', background: DIM_KLEUR[dim], borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: DIM_KLEUR[primair] + '18', border: '1px solid ' + DIM_KLEUR[primair] + '40', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ color: DIM_KLEUR[primair], fontWeight: 700, marginBottom: 8 }}>{DIM_LABEL[primair]}</h3>
              <p style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{DIM_BESCHR[primair]}</p>
            </div>
            {fout && <div style={{ background: '#3f0e0e', border: '1px solid #7f1d1d', borderRadius: 8, padding: 12, color: '#fca5a5', marginBottom: 16 }}>{fout}</div>}
            <button onClick={verzend} disabled={bezig} style={{ width: '100%', background: bezig ? '#334155' : DIM_KLEUR[primair], color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: bezig ? 'not-allowed' : 'pointer' }}>{bezig ? 'Opslaan...' : 'Resultaat opslaan & rapport genereren'}</button>
          </div>
        )}
        {!klaar && !verzonden && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Vraag {huidigIdx + 1} van {VRAGEN.length}</span>
                <span style={{ color: '#64748b', fontSize: 14 }}>{Math.round((huidigIdx / VRAGEN.length) * 100)}%</span>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 6, height: 6 }}>
                <div style={{ width: ((huidigIdx / VRAGEN.length) * 100) + '%', height: '100%', background: DIM_KLEUR[hv.dimensie], borderRadius: 6, transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <div style={{ background: '#0f1e36', border: '1px solid ' + DIM_KLEUR[hv.dimensie] + '40', borderRadius: 16, padding: 32 }}>
              <div style={{ display: 'inline-block', background: DIM_KLEUR[hv.dimensie] + '20', color: DIM_KLEUR[hv.dimensie], borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{DIM_LABEL[hv.dimensie]}</div>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', lineHeight: 1.5, marginBottom: 32 }}>{hv.tekst}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(w => {
                  const g = antwoorden[hv.id] === w
                  return (
                    <button key={w} onClick={() => antwoord(hv.id, w)} style={{ flex: 1, minWidth: 80, background: g ? DIM_KLEUR[hv.dimensie] : '#1e293b', border: '1px solid ' + (g ? DIM_KLEUR[hv.dimensie] : '#334155'), borderRadius: 10, padding: '14px 8px', color: g ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{w}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.2 }}>{SCHAAL[w - 1]}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button onClick={() => setHuidigIdx(v => Math.max(0, v - 1))} disabled={huidigIdx === 0} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', color: huidigIdx === 0 ? '#334155' : '#94a3b8', cursor: huidigIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}>Vorige</button>
                {huidigIdx < VRAGEN.length - 1 && antwoorden[hv.id] && (
                  <button onClick={() => setHuidigIdx(v => v + 1)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Volgende</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}