'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/Collapsible'

interface Props { bedrijfId: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string; user_id: string; user_naam: string }

type BadgeVariant = 'accent' | 'success' | 'neutral'
const TYPE_VARIANT: Record<string, BadgeVariant> = { disc: 'accent', checkin: 'success', onboarding: 'neutral', algemeen: 'neutral' }
const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }

const selectStijl: React.CSSProperties = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 12px',
  color: 'var(--text-1)',
  fontSize: 13,
  outline: 'none',
}

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

  if (!geladen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[0, 1, 2].map(i => <Skeleton key={i} height={46} radius="var(--radius-md)" />)}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          aria-label="Filter op type rapport"
          style={selectStijl}
        >
          <option value='alle'>Alle types</option>
          <option value='disc'>DISC</option>
          <option value='checkin'>Check-in</option>
          <option value='onboarding'>Onboarding</option>
        </select>
        <Input
          placeholder='Medewerker zoeken...'
          value={filterMedewerker}
          onChange={e => setFilterMedewerker(e.target.value)}
          aria-label="Medewerker zoeken"
          style={{ flex: 1, minWidth: 140, fontSize: 13, padding: '9px 12px' }}
        />
      </div>
      {gefilterd.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Geen rapporten gevonden"
          description="Rapporten verschijnen hier als medewerkers inzage hebben gegeven."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {gefilterd.map(r => (
            <CollapsibleRoot
              key={r.id}
              open={openRapport === r.id}
              onOpenChange={(o) => setOpenRapport(o ? r.id : null)}
            >
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <CollapsibleTrigger
                  className="mf-pressable"
                  style={{
                    width: '100%', background: 'transparent', border: 'none', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 8,
                    color: 'var(--text-1)', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <Badge variant={TYPE_VARIANT[r.type] ?? 'neutral'}>{TYPE_LABEL[r.type] ?? r.type}</Badge>
                    <span style={{ color: 'var(--text-3)', fontSize: 12, flexShrink: 0 }}>{r.user_naam}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{datumLabel(r.aangemaakt_op)}</span>
                    <ChevronDown
                      size={16}
                      aria-hidden
                      style={{
                        color: 'var(--text-3)',
                        transform: openRapport === r.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s var(--ease)',
                      }}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 12, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
                  </div>
                </CollapsibleContent>
              </div>
            </CollapsibleRoot>
          ))}
        </div>
      )}
    </div>
  )
}
