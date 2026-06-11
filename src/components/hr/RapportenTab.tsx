'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { bedrijfId: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string; user_id: string; user_naam: string }

const TYPE_KLEUR: Record<string, string> = { disc: '#3B82F6', checkin: '#10B981', onboarding: '#8B5CF6', algemeen: '#64748b' }
const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }

export default function RapportenTab({ bedrijfId }: Props) {
  const [rapporten, setRapporten] = useState<Rapport[]>([])
  const [geladen, setGeladen] = useState(false)
  const [filterType, setFilterType] = useState("alle")
  const [filterMedewerker, setFilterMedewerker] = useState('')
  const [openRapport, setOpenRapport] = useState<string | null>(null)

  useEffect(() => {
    if (!bedrijfId) return
    async function laad() {
      const { data: profielen } = await supabase.from('profiles').select('id, naam').eq('bedrijf_id', bedrijfId).eq('hr_inzage_rapporten', true)
      if (!profielen?.length) { setGeladen(true); return }
      const ids = profielen.map(p => p.id)
      const namenMap: Record<string, string> = {}
      for (const p of profielen) namenMap[p.id] = p.naam ?? 'Onbekend'
      const { data } = await supabase.from('ai_rapporten').select('id, type, titel, inhoud, aangemaakt_op, user_id').in('user_id', ids).order('aangemaakt_op', { ascending: false })
      setRapporten((data ?? []).map(r => ({ ...r, user_naam: namenMap[r.user_id] ?? "Onbekend" })))
      setGeladen(true)
    }
    laad()
  }, [bedrijfId])

  const gefilterd = rapporten.filter(r => {
    const typeOk = filterType === "alle" || r.type === filterType
    const medOk = !filterMedewerker || r.user_naam.toLowerCase().includes(filterMedewerker.toLowerCase())
    return typeOk && medOk
  })

  function datumLabel(d: string) {
    return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!geladen) return <div style={{ padding: 16, color: "#64748b" }}>Laden...</div>

  return (
    <div style={{ background: '#060d1f' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 13 }}>
          <option value='alle'>Alle types</option>
          <option value='disc'>DISC</option>
          <option value='checkin'>Check-in</option>
          <option value='onboarding'>Onboarding</option>
        </select>
        <input placeholder='Medewerker zoeken...' value={filterMedewerker} onChange={e => setFilterMedewerker(e.target.value)} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 13, flex: 1, minWidth: 140 }} />
      </div>
      {gefilterd.length === 0 ? (
        <div style={{ background: '#0a1628', borderRadius: 10, padding: 24, textAlign: 'center', color: '#64748b' }}>
          <div style={{ marginBottom: 6 }}>Geen rapporten gevonden.</div>
          <div style={{ fontSize: 13 }}>Rapporten verschijnen hier als medewerkers inzage hebben gegeven.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {gefilterd.map(r => (
            <div key={r.id} style={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
              <button onClick={() => setOpenRapport(openRapport === r.id ? null : r.id)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                  <span style={{ background: (TYPE_KLEUR[r.type] ?? '#64748b') + '20', color: TYPE_KLEUR[r.type] ?? '#64748b', border: '1px solid ' + (TYPE_KLEUR[r.type] ?? '#64748b') + '40', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{TYPE_LABEL[r.type] ?? r.type}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12, flexShrink: 0 }}>{r.user_naam}</span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{datumLabel(r.aangemaakt_op)}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>{openRapport === r.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {openRapport === r.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e293b' }}>
                  <div style={{ paddingTop: 12, color: '#cbd5e1', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}