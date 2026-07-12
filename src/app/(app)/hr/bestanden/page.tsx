'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import HrShell from '@/components/layout/HrShell'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'


interface Medewerker { id: string; naam: string; email: string }
interface GedeeldBestand { id: string; bestandsnaam: string; aangemaakt_op: string; categorie: string; user_id: string }
interface Rapport { id: string; type: string; titel: string; inhoud: string; aangemaakt_op: string; user_id: string }

// Token-kleuren + bijbehorende lichte achtergrond (geen hex-alpha concatenatie).
const TYPE_STYLE: Record<string, { kleur: string; bg: string }> = {
  disc: { kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
  checkin: { kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
  onboarding: { kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
  algemeen: { kleur: 'var(--text-2)', bg: 'var(--bg-subtle)' },
}
const TYPE_LABEL: Record<string, string> = { disc: 'DISC', checkin: 'Check-in', onboarding: 'Onboarding', algemeen: 'Algemeen' }

const STAT_KLEUR: Record<string, string> = { blue: 'var(--mf-blue)', green: 'var(--mf-green)', purple: 'var(--mf-purple)' }

const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  color: 'var(--text-1)',
  fontSize: 14,
  cursor: 'pointer',
  outline: 'none',
}

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
    <HrShell>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </HrShell>
  )
  return (
    <HrShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Bestanden &amp; Rapporten</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Gedeelde bestanden en AI-rapporten van medewerkers.</p>

        {/* Samenvatting balk */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Medewerkers gedeeld', waarde: aantalMedewerkersGedeeld, kleur: STAT_KLEUR.blue },
            { label: 'Bestanden totaal', waarde: aantalBestanden, kleur: STAT_KLEUR.green },
            { label: 'Rapporten', waarde: aantalRapporten, kleur: STAT_KLEUR.purple },
          ].map(stat => (
            <Card key={stat.label} style={{ padding: '14px 20px', flex: 1, minWidth: 140, borderTop: `3px solid ${stat.kleur}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.kleur, lineHeight: 1 }}>{stat.waarde}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{stat.label}</div>
            </Card>
          ))}
        </div>

        <TabsRoot value={actieveTab} onValueChange={(v) => setActieveTab(v as 'bestanden' | 'rapporten')}>
          <TabsList style={{ marginBottom: 12 }}>
            <TabsTrigger value="bestanden">Gedeelde bestanden</TabsTrigger>
            <TabsTrigger value="rapporten">AI Rapporten</TabsTrigger>
          </TabsList>

          <TabsContent value="bestanden">
            {gesorteerdeBestandenEntries.length === 0 ? (
              <Card>
                <EmptyState icon={FileText} title="Geen gedeelde bestanden" description="Er zijn nog geen bestanden met HR gedeeld." />
              </Card>
            ) : (
              gesorteerdeBestandenEntries.map(([uid, docs]) => (
                <div key={uid} style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-3)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{medewerkers[uid]?.naam ?? 'Onbekend'}</div>
                  <Table caption={`Gedeelde bestanden van ${medewerkers[uid]?.naam ?? 'onbekende medewerker'}`}>
                    <THead>
                      <Tr>
                        <Th scope="col">Bestandsnaam</Th>
                        <Th scope="col" align="right">Gedeeld op</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {docs.map(b => (
                        <Tr key={b.id}>
                          <Td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{b.bestandsnaam}</Td>
                          <Td align="right" style={{ color: 'var(--text-3)', fontSize: 13 }}>{datumLabel(b.aangemaakt_op)}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="rapporten">
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ minWidth: 160 }}>
                <Field label="Type rapport">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} style={SELECT_STYLE}>
                    <option value='alle'>Alle types</option>
                    <option value='disc'>DISC</option>
                    <option value='checkin'>Check-in</option>
                    <option value='onboarding'>Onboarding</option>
                  </select>
                </Field>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Field label="Medewerker zoeken">
                  <Input placeholder='Naam medewerker…' value={filterMedewerker} onChange={e => setFilterMedewerker(e.target.value)} />
                </Field>
              </div>
            </div>
            {gefilterdeRapporten.length === 0 ? (
              <Card>
                <EmptyState icon={FileText} title="Geen rapporten gevonden" description="Pas de filters aan of wacht tot er rapporten gedeeld worden." />
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gefilterdeRapporten.map(r => {
                  const isOpen = openRapport === r.id
                  const ts = TYPE_STYLE[r.type] ?? TYPE_STYLE.algemeen
                  const panelId = `rapport-panel-${r.id}`
                  return (
                    <Card key={r.id} style={{ overflow: 'hidden' }}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenRapport(isOpen ? null : r.id)}
                        className="mf-rapport-trigger"
                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 10, textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{ background: ts.bg, color: ts.kleur, border: `1px solid ${ts.kleur}`, borderRadius: 'var(--radius-xs)', padding: '2px 7px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{TYPE_LABEL[r.type] ?? r.type}</span>
                          <span style={{ color: 'var(--text-3)', fontSize: 12, flexShrink: 0 }}>{medewerkers[r.user_id]?.naam ?? 'Onbekend'}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titel}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{datumLabel(r.aangemaakt_op)}</span>
                          {isOpen ? <ChevronUp size={16} aria-hidden style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} aria-hidden style={{ color: 'var(--text-3)' }} />}
                        </div>
                      </button>
                      {isOpen && (
                        <div id={panelId} style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ paddingTop: 14, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{r.inhoud}</div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </TabsRoot>
        <style>{`
          .mf-rapport-trigger:focus-visible {
            outline: 2px solid var(--mentaforce-primary);
            outline-offset: -2px;
            border-radius: var(--radius-sm);
          }
        `}</style>
      </div>
    </HrShell>
  )
}
