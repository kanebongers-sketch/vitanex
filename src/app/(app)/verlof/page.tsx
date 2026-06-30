'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Palmtree, Thermometer, Star, Briefcase, ClipboardList } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { DialogRoot, DialogContent, DialogTitle } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'


type VerlofType = 'vakantie' | 'ziekte' | 'bijzonder' | 'onbetaald' | 'overig'
type VerlofStatus = 'aangevraagd' | 'goedgekeurd' | 'afgewezen'

type VerlofAanvraag = {
  id: string
  type: VerlofType
  datum_van: string
  datum_tot: string
  reden: string
  status: VerlofStatus
  created_at: string
  reviewer_notitie?: string | null
}

const TYPE_LABELS: Record<VerlofType, string> = {
  vakantie: 'Vakantie',
  ziekte: 'Ziekteverlof',
  bijzonder: 'Bijzonder verlof',
  onbetaald: 'Onbetaald verlof',
  overig: 'Overig',
}

const TYPE_ICON: Record<VerlofType, LucideIcon> = {
  vakantie: Palmtree,
  ziekte: Thermometer,
  bijzonder: Star,
  onbetaald: Briefcase,
  overig: ClipboardList,
}

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const STATUS_STIJL: Record<VerlofStatus, { variant: BadgeVariant; label: string }> = {
  aangevraagd: { variant: 'warning', label: 'In behandeling' },
  goedgekeurd: { variant: 'success', label: 'Goedgekeurd' },
  afgewezen:   { variant: 'danger',  label: 'Afgewezen' },
}

function aantalDagen(van: string, tot: string): number {
  const v = new Date(van)
  const t = new Date(tot)
  return Math.max(1, Math.round((t.getTime() - v.getTime()) / 86400000) + 1)
}

export default function VerlofPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [aanvragen, setAanvragen] = useState<VerlofAanvraag[]>([])
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [saldo, setSaldo] = useState({ vakantie: 20, opgenomen: 0 })

  const [type, setType] = useState<VerlofType>('vakantie')
  const [datumVan, setDatumVan] = useState('')
  const [datumTot, setDatumTot] = useState('')
  const [reden, setReden] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const { data } = await supabase
        .from('verlof_aanvragen')
        .select('id, type, datum_van, datum_tot, reden, status, reviewer_notitie, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        setAanvragen(data as VerlofAanvraag[])
        const opgenomenDagen = data
          .filter(a => a.status === 'goedgekeurd' && a.type === 'vakantie')
          .reduce((sum, a) => sum + aantalDagen(a.datum_van, a.datum_tot), 0)
        setSaldo(s => ({ ...s, opgenomen: opgenomenDagen }))
      }

      setLaden(false)
    }
    laad()
  }, [router])

  async function indienen() {
    if (!datumVan || !datumTot) { setFout('Vul begin- en einddatum in.'); return }
    if (new Date(datumTot) < new Date(datumVan)) { setFout('Einddatum moet na begindatum liggen.'); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('verlof_aanvragen').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      type,
      datum_van: datumVan,
      datum_tot: datumTot,
      reden: reden.trim(),
      status: 'aangevraagd',
    }).select().single()

    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'error' })
    } else {
      setAanvragen(prev => [data as VerlofAanvraag, ...prev])
      setFormulier(false)
      setType('vakantie'); setDatumVan(''); setDatumTot(''); setReden('')
      toast({ title: 'Aanvraag ingediend', variant: 'success' })
    }
    setOpslaan(false)
  }

  const resterend = saldo.vakantie - saldo.opgenomen
  const vandaag = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Verlof</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Aanvragen en overzicht</p>
          </div>
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden />} onClick={() => { setFout(''); setFormulier(true) }}>
            Aanvragen
          </Button>
        </div>

        {/* Saldo kaarten */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{saldo.vakantie}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Totaal</p>
          </Card>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--mf-amber)' }}>{saldo.opgenomen}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Opgenomen</p>
          </Card>
          <Card style={{ padding: 16, textAlign: 'center' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--mentaforce-primary)' }}>{resterend}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Resterend</p>
          </Card>
        </div>

        {/* Formulier */}
        <DialogRoot open={formulier} onOpenChange={(open) => { if (!open) setFormulier(false) }}>
          <DialogContent>
            <DialogTitle>Verlof aanvragen</DialogTitle>

            <div className="flex flex-col gap-4" style={{ marginTop: 18 }}>
              {/* Type */}
              <div role="group" aria-label="Type verlof">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>Type verlof</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as VerlofType[]).map(t => {
                    const Icoon = TYPE_ICON[t]
                    const actief = type === t
                    return (
                      <button key={t} type="button" onClick={() => setType(t)}
                        aria-pressed={actief}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm transition"
                        style={{
                          minHeight: 44,
                          borderRadius: 'var(--radius-md)',
                          background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                          border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                          color: actief ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                          fontWeight: actief ? 600 : 400,
                          cursor: 'pointer',
                        }}>
                        <Icoon size={16} aria-hidden strokeWidth={1.75} />
                        <span>{TYPE_LABELS[t]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Datums */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Van">
                  <Input
                    type="date"
                    value={datumVan}
                    min={vandaag}
                    onChange={e => { setDatumVan(e.target.value); if (!datumTot) setDatumTot(e.target.value) }}
                  />
                </Field>
                <Field label="Tot en met">
                  <Input
                    type="date"
                    value={datumTot}
                    min={datumVan || vandaag}
                    onChange={e => setDatumTot(e.target.value)}
                  />
                </Field>
              </div>

              {datumVan && datumTot && (
                <p className="text-xs" style={{ color: 'var(--text-4)', marginTop: -8 }}>
                  {aantalDagen(datumVan, datumTot)} dag{aantalDagen(datumVan, datumTot) !== 1 ? 'en' : ''}
                </p>
              )}

              {/* Reden */}
              <Field label="Reden" hint="Optioneel" error={fout || undefined}>
                <Textarea
                  rows={2}
                  value={reden}
                  onChange={e => setReden(e.target.value)}
                  placeholder="Beschrijf de reden..."
                />
              </Field>

              <Button
                onClick={indienen}
                loading={opslaan}
                disabled={!datumVan || !datumTot}
                style={{ width: '100%' }}
              >
                {opslaan ? 'Versturen...' : 'Aanvraag indienen'}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* Aanvragen lijst */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-4)' }}>Mijn aanvragen</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="mf-spinner" />
          </div>
        ) : aanvragen.length === 0 ? (
          <Card>
            <EmptyState
              icon={Palmtree}
              title="Nog geen verlofaanvragen"
              description="Klik op '+ Aanvragen' om te starten."
            />
          </Card>
        ) : (
          <Table caption="Mijn verlofaanvragen">
            <THead>
              <Tr>
                <Th scope="col">Type</Th>
                <Th scope="col">Periode</Th>
                <Th scope="col" align="right">Dagen</Th>
                <Th scope="col" align="right">Status</Th>
              </Tr>
            </THead>
            <TBody>
              {aanvragen.map(a => {
                const stijl = STATUS_STIJL[a.status]
                const dagen = aantalDagen(a.datum_van, a.datum_tot)
                const Icoon = TYPE_ICON[a.type as VerlofType]
                return (
                  <Tr key={a.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 34, height: 34, borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-subtle)', color: 'var(--text-2)', flexShrink: 0,
                        }}>
                          <Icoon size={17} strokeWidth={1.75} />
                        </span>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{TYPE_LABELS[a.type as VerlofType]}</p>
                          {a.reden && <p className="text-xs italic" style={{ color: 'var(--text-4)' }}>&quot;{a.reden}&quot;</p>}
                          {a.reviewer_notitie && (
                            <p className="text-xs" style={{ marginTop: 2, color: a.status === 'goedgekeurd' ? 'var(--mentaforce-primary)' : 'var(--mf-red)' }}>
                              <strong>Notitie HR:</strong> {a.reviewer_notitie}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                      {new Date(a.datum_van).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                      {a.datum_van !== a.datum_tot && (
                        <> – {new Date(a.datum_tot).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}</>
                      )}
                    </Td>
                    <Td align="right" style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text-1)' }}>{dagen}</Td>
                    <Td align="right">
                      <Badge variant={stijl.variant}>{stijl.label}</Badge>
                    </Td>
                  </Tr>
                )
              })}
            </TBody>
          </Table>
        )}
      </main>
    </div>
  )
}
