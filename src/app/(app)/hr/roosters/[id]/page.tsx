'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/layout/HrShell'
import WeekRoosterView from '@/components/rooster/WeekRoosterView'
import { type Dienst } from '@/components/rooster/DienstKaart'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/Dialog'

type Profiel = { id: string; naam: string; afdeling?: string | null; functie?: string | null }
type RoosterInfo = { id: string; naam: string; week_start: string }
type DienstRij = Dienst & { user_naam?: string }
type DienstForm = {
  user_id: string
  datum: string
  start_tijd: string
  eind_tijd: string
  rol_label: string
  notitie: string
}

const LEEG_FORM: DienstForm = {
  user_id: '',
  datum: '',
  start_tijd: '09:00',
  eind_tijd: '17:00',
  rol_label: '',
  notitie: '',
}

function weekDagen(weekStart: string): string[] {
  const ma = new Date(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const DAGNAMEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

/** Token-gestileerde native select; gedeeld door medewerker- en dag-keuze. */
const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 16,
  lineHeight: 1.4,
  color: 'var(--text-1)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  boxSizing: 'border-box',
}

function dagLabel(ymd: string): string {
  const d = new Date(ymd)
  const idx = (d.getDay() === 0 ? 7 : d.getDay()) - 1
  return `${DAGNAMEN[idx]} ${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
}

export default function RoosterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const roosterId = params.id as string

  const [rooster, setRooster] = useState<RoosterInfo | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profiel[]>([])
  const [diensten, setDiensten] = useState<DienstRij[]>([])
  const [geladen, setGeladen] = useState(false)
  const [form, setForm] = useState<DienstForm>(LEEG_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<DienstRij | null>(null)

  async function laadDiensten(bedrijfId: string) {
    const { data } = await supabase
      .from('rooster_diensten')
      .select('id, datum, start_tijd, eind_tijd, rol_label, notitie, user_id')
      .eq('rooster_id', roosterId)
      .order('datum', { ascending: true })

    // Koppel namen
    const { data: profielen } = await supabase
      .from('profiles')
      .select('id, naam')
      .eq('bedrijf_id', bedrijfId)

    const naamMap: Record<string, string> = {}
    profielen?.forEach(p => { naamMap[p.id] = p.naam })

    setDiensten((data ?? []).map(d => ({
      ...d,
      user_naam: naamMap[d.user_id] ?? 'Onbekend',
    })))
  }

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data: r } = await supabase
        .from('roosters').select('id, naam, week_start').eq('id', roosterId).single()
      if (!r) { router.push('/hr/roosters'); return }
      setRooster(r)

      const { data: meds } = await supabase
        .from('profiles')
        .select('id, naam, afdeling, functie')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .eq('rol', 'medewerker')
        .order('naam', { ascending: true })
      setMedewerkers(meds ?? [])

      await laadDiensten(profiel.bedrijf_id)
      setForm(prev => ({ ...prev, datum: r.week_start }))
      setGeladen(true)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roosterId])

  async function voegDienstToe() {
    if (!form.user_id) { setFout('Kies een medewerker.'); return }
    if (!form.datum) { setFout('Kies een datum.'); return }
    if (form.start_tijd >= form.eind_tijd) { setFout('Eindtijd moet na starttijd zijn.'); return }
    setBezig(true); setFout('')
    const { error } = await supabase.from('rooster_diensten').insert({
      rooster_id: roosterId,
      user_id: form.user_id,
      datum: form.datum,
      start_tijd: form.start_tijd,
      eind_tijd: form.eind_tijd,
      rol_label: form.rol_label || null,
      notitie: form.notitie || null,
    })
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'error' })
      setBezig(false)
      return
    }
    const { data: profiel } = await supabase
      .from('profiles').select('bedrijf_id').eq('id', form.user_id).single()
    await laadDiensten(profiel?.bedrijf_id ?? '')
    setForm(prev => ({ ...LEEG_FORM, datum: prev.datum }))
    setFormOpen(false)
    setBezig(false)
    toast({ title: 'Dienst toegevoegd', variant: 'success' })
  }

  async function bevestigVerwijderDienst() {
    const doel = teVerwijderen
    if (!doel) return
    setVerwijderBezig(doel.id)
    const { error } = await supabase.from('rooster_diensten').delete().eq('id', doel.id)
    if (error) {
      toast({ title: 'Verwijderen mislukt', description: 'Probeer het later opnieuw.', variant: 'error' })
      setVerwijderBezig(null)
      return
    }
    setDiensten(prev => prev.filter(d => d.id !== doel.id))
    setVerwijderBezig(null)
    setTeVerwijderen(null)
    toast({ title: 'Dienst verwijderd', variant: 'success' })
  }

  function openForm() {
    setFout('')
    setForm(prev => ({ ...LEEG_FORM, datum: prev.datum || (rooster?.week_start ?? '') }))
    setFormOpen(true)
  }

  if (!geladen || !rooster) {
    return (
      <HrShell>
        <p style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>Laden…</p>
      </HrShell>
    )
  }

  const dagen = weekDagen(rooster.week_start)
  const weekEind = (() => { const z = new Date(rooster.week_start); z.setDate(z.getDate() + 6); return z })()

  return (
    <HrShell>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Kruimelpad" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text-2)' }}>
          <button
            onClick={() => router.push('/hr/roosters')}
            className="mf-pressable"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 0, font: 'inherit' }}
          >
            Roosters
          </button>
          <span aria-hidden>/</span>
          <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{rooster.naam}</span>
        </nav>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{rooster.naam}</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>
              {new Date(rooster.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' – '}
              {weekEind.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button onClick={openForm} leftIcon={<Plus size={16} aria-hidden />}>
            Dienst toevoegen
          </Button>
        </header>

        {/* Week grid */}
        <Card style={{ padding: 20, marginBottom: 24 }}>
          <WeekRoosterView
            diensten={diensten}
            weekStart={new Date(rooster.week_start)}
            toonNaam={true}
          />
        </Card>

        {/* Diensten tabel per dag */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dagen.map((dag, i) => {
            const dagDiensten = diensten.filter(d => d.datum === dag)
            const datumKort = new Date(dag).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
            return (
              <div key={dag}>
                <h2 style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: 14, marginBottom: 10 }}>
                  {DAGNAMEN[i]}{' '}
                  <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 12 }}>{datumKort}</span>
                </h2>
                {dagDiensten.length === 0 ? (
                  <Card style={{ padding: '14px 18px' }}>
                    <p style={{ color: 'var(--text-4)', fontSize: 12, margin: 0 }}>Geen diensten</p>
                  </Card>
                ) : (
                  <Table caption={`Diensten op ${DAGNAMEN[i]} ${datumKort}`}>
                    <THead>
                      <Tr>
                        <Th scope="col">Tijd</Th>
                        <Th scope="col">Medewerker</Th>
                        <Th scope="col">Rol</Th>
                        <Th scope="col">Notitie</Th>
                        <Th scope="col" align="right">Actie</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {dagDiensten.map(d => (
                        <Tr key={d.id}>
                          <Td>
                            <span style={{ fontWeight: 600, color: 'var(--mentaforce-primary)', whiteSpace: 'nowrap' }}>
                              {d.start_tijd.slice(0, 5)}–{d.eind_tijd.slice(0, 5)}
                            </span>
                          </Td>
                          <Th scope="row" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
                            {d.user_naam}
                          </Th>
                          <Td style={{ color: 'var(--text-3)', fontSize: 12 }}>{d.rol_label || '—'}</Td>
                          <Td style={{ color: 'var(--text-3)', fontSize: 12, fontStyle: d.notitie ? 'italic' : 'normal' }}>
                            {d.notitie || '—'}
                          </Td>
                          <Td align="right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTeVerwijderen(d)}
                              aria-label={`Dienst van ${d.user_naam} verwijderen`}
                              style={{ color: 'var(--mf-red)', padding: '6px 8px' }}
                            >
                              <Trash2 size={15} aria-hidden />
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                )}
              </div>
            )
          })}
        </section>

        {/* Dienst toevoegen dialog */}
        <DialogRoot open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setFout('') } }}>
          <DialogContent>
            <DialogTitle>Dienst toevoegen</DialogTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              {/* Medewerker */}
              <Field label="Medewerker">
                <select
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  className="mf-ui-control"
                  style={SELECT_STYLE}
                >
                  <option value="">Kies medewerker…</option>
                  {medewerkers.map(m => (
                    <option key={m.id} value={m.id}>{m.naam}{m.afdeling ? ` (${m.afdeling})` : ''}</option>
                  ))}
                </select>
              </Field>

              {/* Datum */}
              <Field label="Datum">
                <select
                  value={form.datum}
                  onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                  className="mf-ui-control"
                  style={SELECT_STYLE}
                >
                  <option value="">Kies dag…</option>
                  {dagen.map(d => (
                    <option key={d} value={d}>{dagLabel(d)}</option>
                  ))}
                </select>
              </Field>

              {/* Tijden */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Starttijd">
                  <Input
                    type="time"
                    value={form.start_tijd}
                    onChange={e => setForm(f => ({ ...f, start_tijd: e.target.value }))}
                  />
                </Field>
                <Field label="Eindtijd">
                  <Input
                    type="time"
                    value={form.eind_tijd}
                    onChange={e => setForm(f => ({ ...f, eind_tijd: e.target.value }))}
                  />
                </Field>
              </div>

              {/* Rol label */}
              <Field label="Rol / label" hint="Optioneel">
                <Input
                  type="text"
                  value={form.rol_label}
                  onChange={e => setForm(f => ({ ...f, rol_label: e.target.value }))}
                  placeholder="bijv. Kassa, Magazijn, Support…"
                />
              </Field>

              {/* Notitie */}
              <Field label="Notitie" hint="Optioneel">
                <Input
                  type="text"
                  value={form.notitie}
                  onChange={e => setForm(f => ({ ...f, notitie: e.target.value }))}
                  placeholder="Extra info voor de medewerker…"
                />
              </Field>

              {fout && (
                <p role="alert" style={{ background: 'var(--mf-red-light)', color: 'var(--mf-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, margin: 0 }}>
                  {fout}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <DialogClose asChild>
                <Button variant="ghost" style={{ flex: 1 }}>Annuleren</Button>
              </DialogClose>
              <Button onClick={voegDienstToe} loading={bezig} style={{ flex: 2 }}>
                {bezig ? 'Opslaan…' : 'Dienst opslaan'}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* Verwijderbevestiging */}
        <DialogRoot open={!!teVerwijderen} onOpenChange={(open) => { if (!open) setTeVerwijderen(null) }}>
          <DialogContent>
            <DialogTitle>Dienst verwijderen?</DialogTitle>
            <DialogDescription>
              {teVerwijderen
                ? `De dienst van ${teVerwijderen.user_naam} (${teVerwijderen.start_tijd.slice(0, 5)}–${teVerwijderen.eind_tijd.slice(0, 5)}) wordt verwijderd. Dit kan niet ongedaan worden gemaakt.`
                : ''}
            </DialogDescription>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <DialogClose asChild>
                <Button variant="ghost">Annuleren</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={verwijderBezig === teVerwijderen?.id}
                onClick={bevestigVerwijderDienst}
                leftIcon={<Trash2 size={15} aria-hidden />}
              >
                Verwijderen
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>
      </div>
    </HrShell>
  )
}
