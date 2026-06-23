'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/layout/HrShell'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

interface Medewerker { id: string; naam: string; email: string }
interface GedeeldBestand { id: string; bestandsnaam: string; aangemaakt_op: string; categorie: string; user_id: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string; user_id: string }

const TYPE_KLEUR: Record<string, string> = { disc: 'var(--mf-blue)', checkin: 'var(--mf-green)', onboarding: 'var(--mf-purple)', algemeen: 'var(--text-2)' }
const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }

export default function HrBestandenPage() {
  const router = useRouter()
  const [geladen, setGeladen] = useState(false)
  const [actieveTab, setActieveTab] = useState<'bestanden' | 'rapporten'>('bestanden')
  const [bestanden, setBestanden] = useState<GedeeldBestand[]>([])
  const [rapporten, setRapporten] = useState<Rapport[]>([])
  const [medewerkers, setMedewerkers] = useState<Record<string, Medewerker>>({})
  const [filterType, setFilterType] = useState("alle")
  const [filterMedewerker, setFilterMedewerker] = useState('')
  const [openRapport, setOpenRapport] = useState<string | null>(null)

  async function laadData(bedrijfId: string) {
    if (!bedrijfId) return
    const { data: meds } = await supabase.from('profiles').select('id, naam, email, hr_inzage_rapporten, hr_inzage_bestanden').eq('bedrijf_id', bedrijfId)
    const medMap: Record<string, Medewerker> = {}
    for (const m of (meds ?? [])) medMap[m.id] = m
    setMedewerkers(medMap)
    const gedeeldIds = (meds ?? []).filter(m => m.hr_inzage_bestanden).map(m => m.id)
    const rapportIds = (meds ?? []).filter(m => m.hr_inzage_rapporten).map(m => m.id)
    if (gedeeldIds.length > 0) {
      const { data: docs } = await supabase.from('documenten').select('id, bestandsnaam, aangemaakt_op, categorie, user_id').in('user_id', gedeeldIds).eq('gedeeld_met_hr', true)
      setBestanden(docs ?? [])
    }
    if (rapportIds.length > 0) {
      const { data: raps } = await supabase.from('ai_rapporten').select('id, type, titel, inhoud, aangemaakt_op, user_id').in('user_id', rapportIds).order('aangemaakt_op', { ascending: false })
      setRapporten(raps ?? [])
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr','admin'].includes(profiel.rol ?? '')) { router.push('/hr'); return }
      await laadData(profiel.bedrijf_id ?? "")
      setGeladen(true)
    }
    init()
  }, [router])


  function datumLabel(d: string) {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const gefilterdeRapporten = rapporten.filter(r => {
    const typeOk = filterType === "alle" || r.type === filterType
    const medOk = !filterMedewerker || (medewerkers[r.user_id]?.naam ?? '').toLowerCase().includes(filterMedewerker.toLowerCase())
    return typeOk && medOk
  })

  const bestandenPerMed: Record<string, GedeeldBestand[]> = {}
  for (const b of bestanden) {
    if (!bestandenPerMed[b.user_id]) bestandenPerMed[b.user_id] = []
    bestandenPerMed[b.user_id].push(b)
  }

  // Sorteer medewerkers op naam
  const gesorteerdeBestandenEntries = Object.entries(bestandenPerMed).sort(([uidA], [uidB]) => {
    const naamA = medewerkers[uidA]?.naam ?? ''
    const naamB = medewerkers[uidB]?.naam ?? ''
    return naamA.localeCompare(naamB, 'nl')
  })

  // Samenvatting statistieken
  const aantalMedewerkersGedeeld = Object.keys(bestandenPerMed).length
  const aantalBestanden = bestanden.length
  const aantalRapporten = rapporten.length

  if (!geladen) return (
    <HrShell><div style={{ padding: 32, color: 'var(--text-3)' }}>Laden...</div></HrShell>
  )
  return (
    <HrShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--bg-subtle)', marginBottom: 8 }}>Bestanden &amp; Rapporten</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>Gedeelde bestanden en AI-rapporten van medewerkers.</p>

        {/* Samenvatting balk */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Medewerkers gedeeld', waarde: aantalMedewerkersGedeeld, kleur: 'var(--mf-blue)' },
            { label: 'Bestanden totaal', waarde: aantalBestanden, kleur: 'var(--mf-green)' },
            { label: 'Rapporten', waarde: aantalRapporten, kleur: 'var(--mf-purple)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0a1628', border: `1px solid ${stat.kleur}30`, borderRadius: 12, padding: '14px 20px', flex: 1, minWidth: 140 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                  <GlowOrb color={[0.231, 0.510, 0.965]} intensity={0.35} size={70} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.kleur, lineHeight: 1, position: 'relative', zIndex: 1 }}>{stat.waarde}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#0a1628', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['bestanden', 'rapporten'] as const).map(tab => (
            <button key={tab} onClick={() => setActieveTab(tab)} style={{ background: actieveTab === tab ? 'var(--mf-blue)' : 'transparent', color: actieveTab === tab ? '#fff' : 'var(--text-2)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {tab === 'bestanden' ? 'Gedeelde bestanden' : 'AI Rapporten'}
            </button>
          ))}
        </div>

        {actieveTab === 'bestanden' && (
          <div>
            {gesorteerdeBestandenEntries.length === 0 ? (
              <div style={{ background: '#0a1628', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>Geen gedeelde bestanden.</div>
            ) : (
              gesorteerdeBestandenEntries.map(([uid, docs]) => (
                <div key={uid} style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-3)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{medewerkers[uid]?.naam ?? 'Onbekend'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {docs.map(b => (
                      <div key={b.id} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--border)', fontWeight: 500 }}>{b.bestandsnaam}</div>
                        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{datumLabel(b.aangemaakt_op)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {actieveTab === 'rapporten' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: 'var(--border)', fontSize: 14, cursor: 'pointer' }}>
                <option value='alle'>Alle types</option>
                <option value='disc'>DISC</option>
                <option value='checkin'>Check-in</option>
                <option value='onboarding'>Onboarding</option>
              </select>
              <input placeholder='Medewerker zoeken...' value={filterMedewerker} onChange={e => setFilterMedewerker(e.target.value)} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: 'var(--border)', fontSize: 14, flex: 1, minWidth: 160 }} />
            </div>
            {gefilterdeRapporten.length === 0 ? (
              <div style={{ background: '#0a1628', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-2)' }}>Geen rapporten gevonden.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gefilterdeRapporten.map(r => (
                  <div key={r.id} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                    <button onClick={() => setOpenRapport(openRapport === r.id ? null : r.id)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ background: (TYPE_KLEUR[r.type] ?? 'var(--text-2)') + '20', color: TYPE_KLEUR[r.type] ?? 'var(--text-2)', border: '1px solid ' + (TYPE_KLEUR[r.type] ?? 'var(--text-2)') + '40', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{TYPE_LABEL[r.type] ?? r.type}</span>
                        <span style={{ color: 'var(--text-3)', fontSize: 12, flexShrink: 0 }}>{medewerkers[r.user_id]?.naam ?? 'Onbekend'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{datumLabel(r.aangemaakt_op)}</span>
                        <span style={{ color: 'var(--text-2)' }}>{openRapport === r.id ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {openRapport === r.id && (
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid #1e293b' }}>
                        <div style={{ paddingTop: 14, color: 'var(--border)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </HrShell>
  )
}
