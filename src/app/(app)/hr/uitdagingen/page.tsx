'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import { Plus, X, Trophy, Calendar, Target, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'


interface TeamUitdaging {
  id: string
  titel: string
  beschrijving: string
  type: string
  doel_waarde: number | null
  eenheid: string | null
  start_datum: string
  eind_datum: string
  actief: boolean
  team_uitdaging_logs?: { user_id: string }[]
}

const TYPES = [
  { id: 'stappen', label: 'Stappen' },
  { id: 'minuten_sport', label: 'Sportminuten' },
  { id: 'water', label: 'Water (glazen)' },
  { id: 'slaap', label: 'Slaap (uren)' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'custom', label: 'Anders' },
]

const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-strong)',
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'var(--bg-subtle)',
  color: 'var(--text-1)',
  outline: 'none',
}

export default function HRUitdagingenPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const [laden, setLaden] = useState(true)
  const [uitdagingen, setUitdagingen] = useState<TeamUitdaging[]>([])
  const [showForm, setShowForm] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [form, setForm] = useState({
    titel: '',
    beschrijving: '',
    type: 'stappen',
    doel_waarde: '',
    eenheid: '',
    start_datum: new Date().toISOString().split('T')[0],
    eind_datum: '',
  })

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!['hr', 'admin'].includes(profiel?.rol ?? '')) {
        router.push('/home')
        return
      }

      const res = await authFetch('/api/team-uitdagingen')
      if (res.ok) {
        const json = await res.json() as { uitdagingen: TeamUitdaging[] }
        setUitdagingen(json.uitdagingen ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function aanmaken() {
    if (!form.titel.trim() || !form.eind_datum) return
    setOpslaan(true)
    try {
      const res = await authFetch('/api/team-uitdagingen', {
        method: 'POST',
        body: JSON.stringify({
          titel: form.titel,
          beschrijving: form.beschrijving || undefined,
          type: form.type,
          doel_waarde: form.doel_waarde ? parseFloat(form.doel_waarde) : undefined,
          eenheid: form.eenheid || TYPES.find(t => t.id === form.type)?.label,
          start_datum: form.start_datum,
          eind_datum: form.eind_datum,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { uitdaging: TeamUitdaging }
        setUitdagingen(prev => [json.uitdaging, ...prev])
        setShowForm(false)
        setForm({ titel: '', beschrijving: '', type: 'stappen', doel_waarde: '', eenheid: '', start_datum: new Date().toISOString().split('T')[0], eind_datum: '' })
        toast({ title: 'Uitdaging aangemaakt', variant: 'success' })
      } else {
        toast({ title: 'Aanmaken mislukt', description: 'Probeer het opnieuw.', variant: 'error' })
      }
    } catch (err: unknown) {
      const bericht = err instanceof Error ? err.message : 'Onbekende fout'
      toast({ title: 'Aanmaken mislukt', description: bericht, variant: 'error' })
    }
    setOpslaan(false)
  }

  const dagenResterend = (einddatum: string) => {
    const diff = Math.ceil((new Date(einddatum).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Team uitdagingen
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Maak en beheer team wellbeing challenges</p>
          </div>
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            leftIcon={showForm ? <X size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuleer' : 'Nieuw'}
          </Button>
        </header>

        {/* Aanmaak formulier */}
        {showForm && (
          <Card style={{ borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 16 }}>
              Nieuwe uitdaging
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Titel" required>
                <Input value={form.titel} onChange={e => setForm(p => ({ ...p, titel: e.target.value }))}
                  placeholder="30 minuten bewegen per dag" />
              </Field>

              <Field label="Beschrijving">
                <Textarea value={form.beschrijving} onChange={e => setForm(p => ({ ...p, beschrijving: e.target.value }))}
                  placeholder="Extra context voor deelnemers..."
                  rows={2}
                  style={{ resize: 'none', minHeight: 0 }} />
              </Field>

              <Field label="Type">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  style={SELECT_STYLE}>
                  {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Doelwaarde">
                  <Input type="number" value={form.doel_waarde} onChange={e => setForm(p => ({ ...p, doel_waarde: e.target.value }))}
                    placeholder="10000" />
                </Field>
                <Field label="Eenheid">
                  <Input value={form.eenheid} onChange={e => setForm(p => ({ ...p, eenheid: e.target.value }))}
                    placeholder="stappen" />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Startdatum">
                  <Input type="date" value={form.start_datum} onChange={e => setForm(p => ({ ...p, start_datum: e.target.value }))} />
                </Field>
                <Field label="Einddatum" required>
                  <Input type="date" value={form.eind_datum} onChange={e => setForm(p => ({ ...p, eind_datum: e.target.value }))} />
                </Field>
              </div>

              <Button onClick={aanmaken} disabled={!form.titel.trim() || !form.eind_datum} loading={opslaan} style={{ width: '100%' }}>
                {opslaan ? 'Aanmaken…' : 'Uitdaging aanmaken'}
              </Button>
            </div>
          </Card>
        )}

        {/* Uitdagingen lijst */}
        {uitdagingen.length === 0 && !showForm ? (
          <Card style={{ borderRadius: 'var(--radius-lg)' }}>
            <EmptyState
              icon={Trophy}
              title="Nog geen uitdagingen"
              description="Maak je eerste team uitdaging aan."
              action={
                <Button size="sm" leftIcon={<Plus size={15} aria-hidden />} onClick={() => setShowForm(true)}>
                  Nieuwe uitdaging
                </Button>
              }
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {uitdagingen.map(u => {
              const resterende = dagenResterend(u.eind_datum)
              const deelnemers = u.team_uitdaging_logs?.length ?? 0
              const isAfgelopen = !u.actief || resterende < 0
              return (
                <Card key={u.id} style={{
                  padding: '16px 18px',
                  border: `1px solid ${u.actief && resterende > 0 ? 'var(--border)' : 'var(--border-strong)'}`,
                  opacity: isAfgelopen ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{u.titel}</p>
                      {u.beschrijving && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.beschrijving}</p>}
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      {resterende > 0 ? (
                        <Badge variant="success" style={{ fontSize: 10 }}>{resterende}d resterend</Badge>
                      ) : (
                        <Badge variant="neutral" style={{ fontSize: 10 }}>Afgelopen</Badge>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} aria-hidden />
                      {new Date(u.start_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} → {new Date(u.eind_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </span>
                    {u.doel_waarde && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Target size={12} aria-hidden />
                        {u.doel_waarde} {u.eenheid}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} aria-hidden />
                      {deelnemers} deelnemers
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
