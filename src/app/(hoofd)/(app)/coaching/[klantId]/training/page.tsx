'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, type CSSProperties } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { CoachHeader, CoachSection, CoachEmpty, CoachSkeleton } from '@/components/coaching/CoachChrome'
import {
  DOEL_OPTIES,
  NIVEAUS,
  NIVEAU_LABELS,
  schemaSamenvatting,
  type FitnessSchemaRij,
  type NieuwSchemaInput,
  type TrainingLogRij,
  type TrainingNiveau,
} from '@/lib/coaching/training'
import {
  Dumbbell, Plus, Trash2, Power, ClipboardList, Flame, Clock, ShieldAlert,
} from 'lucide-react'

// ── Concept-state (het formulier bouwt hierin op) ─────────────────────────────
interface OefeningConcept {
  naam: string
  sets: number
  herhalingen: string
  heeft_gewicht: boolean
  uitvoering_tip: string
}
interface DagConcept {
  naam: string
  spiergroepen: string
  coaching_tekst: string
  oefeningen: OefeningConcept[]
}

const LEGE_OEFENING: OefeningConcept = {
  naam: '', sets: 3, herhalingen: '8-12', heeft_gewicht: true, uitvoering_tip: '',
}
function legeDag(nummer: number): DagConcept {
  return { naam: `Dag ${nummer}`, spiergroepen: '', coaching_tekst: '', oefeningen: [{ ...LEGE_OEFENING }] }
}

const SELECT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15, lineHeight: 1.4,
  color: 'var(--text-1)', background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer',
}

function fmtDatum(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

// ── Oefening-rij ──────────────────────────────────────────────────────────────
interface OefeningRijProps {
  oef: OefeningConcept
  index: number
  canRemove: boolean
  onChange: (patch: Partial<OefeningConcept>) => void
  onRemove: () => void
}
function OefeningRij({ oef, index, canRemove, onChange, onRemove }: OefeningRijProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <div style={{ flex: '1 1 160px', minWidth: 0 }}>
        <Input
          aria-label={`Oefening ${index + 1} naam`}
          placeholder="Bijv. Bankdrukken"
          value={oef.naam}
          maxLength={80}
          onChange={e => onChange({ naam: e.target.value })}
        />
      </div>
      <Input
        aria-label={`Oefening ${index + 1} aantal sets`}
        type="number" inputMode="numeric" min={1} max={20}
        value={oef.sets || ''}
        onChange={e => onChange({ sets: parseInt(e.target.value) || 0 })}
        style={{ width: 62, textAlign: 'center', flexShrink: 0 }}
      />
      <Input
        aria-label={`Oefening ${index + 1} herhalingen`}
        placeholder="8-12"
        value={oef.herhalingen}
        maxLength={24}
        onChange={e => onChange({ herhalingen: e.target.value })}
        style={{ width: 78, textAlign: 'center', flexShrink: 0 }}
      />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={oef.heeft_gewicht}
          onChange={e => onChange({ heeft_gewicht: e.target.checked })}
          aria-label={`Oefening ${index + 1} met gewicht`}
          style={{ accentColor: 'var(--mf-green)', width: 15, height: 15 }}
        />
        kg
      </label>
      <Button
        variant="ghost" size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Oefening ${index + 1} verwijderen`}
        style={{ color: 'var(--mf-red)', padding: '6px 8px', flexShrink: 0 }}
      >
        <Trash2 size={14} aria-hidden />
      </Button>
    </div>
  )
}

// ── Dag-kaart ─────────────────────────────────────────────────────────────────
interface DagKaartProps {
  dag: DagConcept
  index: number
  canRemove: boolean
  onChange: (patch: Partial<DagConcept>) => void
  onOefChange: (oi: number, patch: Partial<OefeningConcept>) => void
  onOefAdd: () => void
  onOefRemove: (oi: number) => void
  onRemove: () => void
}
function DagKaart({ dag, index, canRemove, onChange, onOefChange, onOefAdd, onOefRemove, onRemove }: DagKaartProps) {
  return (
    <Card style={{ padding: '16px 18px', background: 'var(--bg-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)', fontSize: 13, fontWeight: 800 }}>
          {index + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            aria-label={`Dag ${index + 1} naam`}
            placeholder={`Dag ${index + 1} — bijv. Push (borst & triceps)`}
            value={dag.naam}
            maxLength={80}
            onChange={e => onChange({ naam: e.target.value })}
          />
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Dag ${index + 1} verwijderen`}
          style={{ color: 'var(--mf-red)', padding: '6px 8px', flexShrink: 0 }}
        >
          <Trash2 size={15} aria-hidden />
        </Button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Input
          aria-label={`Dag ${index + 1} spiergroepen`}
          placeholder="Spiergroepen, komma-gescheiden (bijv. Borst, Triceps)"
          value={dag.spiergroepen}
          maxLength={120}
          onChange={e => onChange({ spiergroepen: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span style={{ flex: '1 1 160px' }}>Oefening</span>
        <span style={{ width: 62, textAlign: 'center' }}>Sets</span>
        <span style={{ width: 78, textAlign: 'center' }}>Herh.</span>
        <span style={{ width: 58 }}>Gewicht</span>
        <span style={{ width: 30 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dag.oefeningen.map((oef, oi) => (
          <OefeningRij
            key={oi}
            oef={oef}
            index={oi}
            canRemove={dag.oefeningen.length > 1}
            onChange={patch => onOefChange(oi, patch)}
            onRemove={() => onOefRemove(oi)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onOefAdd}
        className="mf-pressable"
        style={{ marginTop: 10, width: '100%', background: 'none', border: '1.5px dashed var(--border-strong)', color: 'var(--text-3)', borderRadius: 10, padding: '8px 0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Plus size={13} aria-hidden /> Oefening toevoegen
      </button>

      <div style={{ marginTop: 12 }}>
        <Textarea
          aria-label={`Dag ${index + 1} coaching-tekst`}
          placeholder="Motiverende coaching-tekst voor deze sessie (optioneel)"
          value={dag.coaching_tekst}
          rows={2}
          maxLength={400}
          autoGrow={false}
          onChange={e => onChange({ coaching_tekst: e.target.value })}
        />
      </div>
    </Card>
  )
}

// ── Schema-builder (compose-state; container geeft data door) ──────────────────
interface SchemaBuilderProps {
  onSubmit: (input: Omit<NieuwSchemaInput, 'klant_id'>) => Promise<boolean>
  bezig: boolean
  fout: string | null
}
function SchemaBuilder({ onSubmit, bezig, fout }: SchemaBuilderProps) {
  const [titel, setTitel] = useState('')
  const [doel, setDoel] = useState<string>(DOEL_OPTIES[0].value)
  const [niveau, setNiveau] = useState<TrainingNiveau>('beginner')
  const [dagen, setDagen] = useState<DagConcept[]>([legeDag(1)])

  const patchDag = (di: number, patch: Partial<DagConcept>) =>
    setDagen(prev => prev.map((d, i) => (i === di ? { ...d, ...patch } : d)))
  const patchOef = (di: number, oi: number, patch: Partial<OefeningConcept>) =>
    setDagen(prev => prev.map((d, i) => (i !== di ? d : { ...d, oefeningen: d.oefeningen.map((o, j) => (j === oi ? { ...o, ...patch } : o)) })))
  const addOef = (di: number) =>
    setDagen(prev => prev.map((d, i) => (i !== di ? d : { ...d, oefeningen: [...d.oefeningen, { ...LEGE_OEFENING }] })))
  const removeOef = (di: number, oi: number) =>
    setDagen(prev => prev.map((d, i) => (i !== di ? d : { ...d, oefeningen: d.oefeningen.filter((_, j) => j !== oi) })))
  const addDag = () => setDagen(prev => (prev.length >= 7 ? prev : [...prev, legeDag(prev.length + 1)]))
  const removeDag = (di: number) => setDagen(prev => prev.filter((_, i) => i !== di))

  const geldig = titel.trim().length >= 2 && dagen.every(d => d.oefeningen.some(o => o.naam.trim().length >= 2))

  async function verstuur() {
    if (!geldig || bezig) return
    const input: Omit<NieuwSchemaInput, 'klant_id'> = {
      titel: titel.trim(),
      doel,
      niveau,
      dagen: dagen.map(d => ({
        naam: d.naam.trim(),
        spiergroepen: d.spiergroepen.split(',').map(s => s.trim()).filter(Boolean),
        coaching_tekst: d.coaching_tekst.trim(),
        oefeningen: d.oefeningen
          .filter(o => o.naam.trim().length >= 2)
          .map(o => ({
            naam: o.naam.trim(),
            sets: o.sets,
            herhalingen: o.herhalingen.trim() || '8-12',
            heeft_gewicht: o.heeft_gewicht,
            uitvoering_tip: o.uitvoering_tip.trim(),
          })),
      })),
    }
    const gelukt = await onSubmit(input)
    if (gelukt) {
      setTitel('')
      setDoel(DOEL_OPTIES[0].value)
      setNiveau('beginner')
      setDagen([legeDag(1)])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Titel van het schema" error={fout ?? undefined}>
        <Input
          placeholder="Bijv. Kracht-opbouw 3-daags"
          value={titel}
          maxLength={120}
          onChange={e => setTitel(e.target.value)}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Doel">
          <select style={SELECT_STYLE} value={doel} onChange={e => setDoel(e.target.value)}>
            {DOEL_OPTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Niveau">
          <select style={SELECT_STYLE} value={niveau} onChange={e => setNiveau(e.target.value as TrainingNiveau)}>
            {NIVEAUS.map(n => <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {dagen.map((dag, di) => (
          <DagKaart
            key={di}
            dag={dag}
            index={di}
            canRemove={dagen.length > 1}
            onChange={patch => patchDag(di, patch)}
            onOefChange={(oi, patch) => patchOef(di, oi, patch)}
            onOefAdd={() => addOef(di)}
            onOefRemove={oi => removeOef(di, oi)}
            onRemove={() => removeDag(di)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <Button
          variant="secondary" size="sm"
          onClick={addDag}
          disabled={dagen.length >= 7}
          leftIcon={<Plus size={15} aria-hidden />}
        >
          Dag toevoegen
        </Button>
        <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{dagen.length}/7 dagen</span>
        <Button
          onClick={verstuur}
          loading={bezig}
          disabled={!geldig}
          leftIcon={<Dumbbell size={15} aria-hidden />}
          style={{ marginLeft: 'auto' }}
        >
          Schema toewijzen
        </Button>
      </div>
    </div>
  )
}

// ── Bestaand-schema-item ──────────────────────────────────────────────────────
interface SchemaItemProps {
  schema: FitnessSchemaRij
  bezig: boolean
  onDeactiveer: () => void
}
function SchemaItem({ schema, bezig, onDeactiveer }: SchemaItemProps) {
  const doorCoach = schema.toegewezen_door != null
  return (
    <Card className={schema.actief ? 'mf-card-glow' : undefined} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: schema.actief ? 1 : 0.6 }}>
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'var(--mf-green-light)', color: 'var(--mf-green)' }}>
        <Dumbbell size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{schema.naam}</p>
          {schema.actief
            ? <Badge variant="success" style={{ fontSize: 10, padding: '2px 8px' }}>Actief</Badge>
            : <Badge variant="neutral" style={{ fontSize: 10, padding: '2px 8px' }}>Inactief</Badge>}
          <Badge variant={doorCoach ? 'accent' : 'neutral'} style={{ fontSize: 10, padding: '2px 8px' }}>
            {doorCoach ? 'Door jou toegewezen' : 'Door klant zelf'}
          </Badge>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginTop: 4 }}>
          {schemaSamenvatting(schema)}
          {schema.niveau ? ` · ${schema.niveau}` : ''}
          {schema.doel ? ` · ${schema.doel}` : ''}
        </p>
      </div>
      {doorCoach && schema.actief && (
        <Button
          variant="ghost" size="sm"
          loading={bezig}
          onClick={onDeactiveer}
          leftIcon={<Power size={14} aria-hidden />}
          aria-label={`${schema.naam} deactiveren`}
        >
          Deactiveer
        </Button>
      )}
    </Card>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────
export default function KlantTrainingPagina() {
  const router = useRouter()
  const { klantId } = useParams<{ klantId: string }>()

  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [schemas, setSchemas] = useState<FitnessSchemaRij[]>([])
  const [logs, setLogs] = useState<TrainingLogRij[]>([])
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [actieId, setActieId] = useState<string | null>(null)

  const laadTraining = useCallback(async () => {
    const res = await authFetch(`/api/coaching/training?klant=${klantId}`)
    if (res.ok) {
      const data = await res.json() as { schemas: FitnessSchemaRij[]; logs: TrainingLogRij[] }
      setSchemas(data.schemas ?? [])
      setLogs(data.logs ?? [])
    } else {
      setNietGevonden(true)
    }
  }, [klantId])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!profiel || !['coach', 'admin'].includes(profiel.rol ?? '')) { router.push('/home'); return }
      await laadTraining()
      setLaden(false)
    }
    laad()
  }, [router, laadTraining])

  async function wijsToe(input: Omit<NieuwSchemaInput, 'klant_id'>): Promise<boolean> {
    setBezig(true)
    setFout(null)
    const res = await authFetch('/api/coaching/training', {
      method: 'POST',
      body: JSON.stringify({ klant_id: klantId, ...input }),
    })
    const data = await res.json() as { error?: string }
    setBezig(false)
    if (res.ok) { await laadTraining(); return true }
    setFout(data.error ?? 'Schema toewijzen mislukt.')
    return false
  }

  async function deactiveer(schemaId: string) {
    setActieId(schemaId)
    const res = await authFetch(`/api/coaching/training/${schemaId}`, { method: 'DELETE' })
    if (res.ok) await laadTraining()
    setActieId(null)
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <main className="mf-page-main" style={{ padding: '40px 40px 80px', maxWidth: 900, margin: '0 auto' }}>

        <CoachHeader
          eyebrow="Coaching · Training"
          titel="Trainingsschema"
          subtitel="Stel een schema samen. Je klant volgt het in de sport-app; een nieuw schema vervangt het actieve."
          backHref={`/coaching/${klantId}`}
          backLabel="Terug naar klant"
        />

        {laden ? (
          <CoachSkeleton rijen={3} />
        ) : nietGevonden ? (
          <CoachEmpty
            icon={ShieldAlert}
            titel="Klant niet gevonden"
            tekst="Deze klant is niet (actief) aan jou gekoppeld."
            toon="wacht"
          />
        ) : (
          <>
            <Card className="mf-animate-up mf-delay-1" style={{ padding: '20px 22px', marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={16} aria-hidden style={{ color: 'var(--mf-green)' }} /> Nieuw schema samenstellen
              </h2>
              <SchemaBuilder onSubmit={wijsToe} bezig={bezig} fout={fout} />
            </Card>

            <CoachSection titel="Schema's van deze klant">
              {schemas.length === 0 ? (
                <CoachEmpty
                  icon={Dumbbell}
                  titel="Nog geen schema"
                  tekst="Stel hierboven het eerste trainingsschema samen voor deze klant."
                />
              ) : (
                <ul className="mf-coach-stagger" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {schemas.map(s => (
                    <li key={s.id}>
                      <SchemaItem schema={s} bezig={actieId === s.id} onDeactiveer={() => deactiveer(s.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </CoachSection>

            <CoachSection titel="Recente trainingen">
              {logs.length === 0 ? (
                <CoachEmpty
                  icon={Flame}
                  titel="Nog geen trainingen gelogd"
                  tekst="Zodra je klant een training afrondt, verschijnt die hier."
                />
              ) : (
                <Card style={{ overflow: 'hidden' }}>
                  {logs.map((log, i) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span aria-hidden style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--mf-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Flame size={15} strokeWidth={1.8} style={{ color: 'var(--mf-orange)' }} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.naam ?? 'Training'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{fmtDatum(log.datum)}</div>
                      </div>
                      {log.duur_minuten != null && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)', fontWeight: 600, flexShrink: 0 }}>
                          <Clock size={11} aria-hidden /> {log.duur_minuten} min
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </CoachSection>
          </>
        )}
      </main>
    </div>
  )
}
