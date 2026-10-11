'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Check, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
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
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'


type Registratie = {
  id: string
  datum: string
  uren: number
  project: string
  beschrijving: string
  goedgekeurd: boolean
  created_at: string
}

// De waarde (Nederlands) gaat naar de database; het label wordt vertaald.
const PROJECTEN = ['Intern', 'Algemeen', 'Training', 'Overleg', 'Administratie', 'Overig']
const PROJECT_SLEUTEL: Record<string, string> = Object.fromEntries(PROJECTEN.map(p => [p, `werk.uren.project.${p.toLowerCase()}`]))

function weekDagen(): Date[] {
  const vandaag = new Date()
  const dag = vandaag.getDay() === 0 ? 6 : vandaag.getDay() - 1
  const maandag = new Date(vandaag)
  maandag.setDate(vandaag.getDate() - dag)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(maandag)
    d.setDate(maandag.getDate() + i)
    return d
  })
}

function dagNaam(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { weekday: 'short' })
}

export default function UrenPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const projectLabel = (p: string) => (PROJECT_SLEUTEL[p] ? t(PROJECT_SLEUTEL[p]) : p)
  const [laden, setLaden] = useState(true)
  const [registraties, setRegistraties] = useState<Registratie[]>([])
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [uren, setUren] = useState('')
  const [project, setProject] = useState('Intern')
  const [beschrijving, setBeschrijving] = useState('')

  const dagen = weekDagen()

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      // Huidige week: maandag t/m zondag
      const van = new Date()
      const dag = van.getDay() === 0 ? 6 : van.getDay() - 1
      van.setDate(van.getDate() - dag)
      const tot = new Date(van)
      tot.setDate(van.getDate() + 6)
      const startDatum = van.toISOString().split('T')[0]
      const eindDatum = tot.toISOString().split('T')[0]

      const { data } = await supabase
        .from('tijdregistraties')
        .select('id, user_id, datum, uren, project, beschrijving, goedgekeurd, created_at')
        .eq('user_id', user.id)
        .gte('datum', startDatum)
        .lte('datum', eindDatum)
        .order('datum', { ascending: false })

      if (data) setRegistraties(data as Registratie[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function opslaanRegistratie() {
    const u = parseFloat(uren)
    if (!uren || isNaN(u) || u <= 0 || u > 24) { setFout(t('werk.uren.foutUren')); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('tijdregistraties').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      datum,
      uren: u,
      project,
      beschrijving: beschrijving.trim(),
      goedgekeurd: false,
    }).select().single()

    if (error) {
      const melding = taal === 'nl' ? error.message : t('werk.algemeen.ietsMis')
      setFout(t('werk.uren.opslaanMisluktMet', { fout: melding }))
      toast({ title: t('werk.uren.opslaanMislukt'), description: melding, variant: 'error' })
    } else {
      setRegistraties(prev => [data as Registratie, ...prev])
      setFormulier(false)
      setUren(''); setBeschrijving('')
      toast({ title: t('werk.uren.opgeslagen'), variant: 'success' })
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    const vorige = registraties
    setRegistraties(prev => prev.filter(r => r.id !== id))
    const { error } = await supabase.from('tijdregistraties').delete().eq('id', id)
    if (error) {
      setRegistraties(vorige)
      toast({ title: t('werk.uren.verwijderenMislukt'), description: taal === 'nl' ? error.message : t('werk.algemeen.ietsMis'), variant: 'error' })
    }
  }

  const huidigeWeekDatums = new Set(dagen.map(d => d.toISOString().slice(0, 10)))
  const huidigeWeekReg = registraties.filter(r => huidigeWeekDatums.has(r.datum))
  const totaalUren = huidigeWeekReg.reduce((s, r) => s + r.uren, 0)
  const doelUren = 40

  const dagUren = new Map<string, number>()
  for (const r of registraties) {
    dagUren.set(r.datum, (dagUren.get(r.datum) ?? 0) + r.uren)
  }

  const haaltDoel = totaalUren >= doelUren
  const voortgangKleur = haaltDoel ? 'var(--mentaforce-primary)' : 'var(--mf-blue)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{t('werk.uren.titel')}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{t('werk.uren.intro')}</p>
          </div>
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden />} onClick={() => { setFout(''); setFormulier(true) }}>
            {t('werk.uren.loggen')}
          </Button>
        </div>

        {/* Week-overzicht kaart */}
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t('werk.uren.dezeWeek')}</p>
            <p className="text-sm font-bold" style={{ color: voortgangKleur }}>
              {t('werk.uren.voortgang', { totaal: totaalUren, doel: doelUren })}
            </p>
          </div>
          <div
            role="img"
            aria-label={t('werk.uren.voortgangLabel', { totaal: totaalUren, doel: doelUren })}
            className="rounded-full overflow-hidden mb-4"
            style={{ height: 8, background: 'var(--bg-subtle)' }}
          >
            <div className="mf-uren-fill" style={{
              height: '100%',
              width: '100%',
              borderRadius: 9999,
              transformOrigin: 'left center',
              transform: `scaleX(${Math.min(1, totaalUren / doelUren)})`,
              background: voortgangKleur,
            }} />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dagen.map(dag => {
              const sleutel = dag.toISOString().slice(0, 10)
              const u = dagUren.get(sleutel) ?? 0
              const isVandaag = sleutel === new Date().toISOString().slice(0, 10)
              return (
                <div key={sleutel} className="flex flex-col items-center gap-1">
                  <p className="text-xs" style={{ color: isVandaag ? 'var(--mentaforce-primary)' : 'var(--text-3)', fontWeight: isVandaag ? 700 : 400 }}>
                    {dagNaam(dag, locale)}
                  </p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: u > 0 ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                      color: u > 0 ? 'var(--mentaforce-primary)' : 'var(--text-4)',
                      border: isVandaag ? '2px solid var(--mentaforce-primary)' : '2px solid transparent',
                    }}>
                    {u > 0 ? u : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Formulier */}
        <DialogRoot open={formulier} onOpenChange={(open) => { if (!open) setFormulier(false) }}>
          <DialogContent>
            <DialogTitle>{t('werk.uren.dialoogTitel')}</DialogTitle>

            <div className="flex flex-col gap-4" style={{ marginTop: 18 }}>
              <Field label={t('werk.uren.datum')}>
                <Input type="date" value={datum} onChange={e => setDatum(e.target.value)} />
              </Field>

              <Field label={t('werk.uren.aantal')} error={fout || undefined}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={uren}
                  onChange={e => setUren(e.target.value)}
                  placeholder={t('werk.uren.aantalPlaceholder')}
                />
              </Field>

              <Field label={t('werk.uren.projectLabel')}>
                <select value={project} onChange={e => setProject(e.target.value)}
                  className="mf-ui-control"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 16,
                    lineHeight: 1.4,
                    color: 'var(--text-1)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                  }}>
                  {PROJECTEN.map(p => <option key={p} value={p}>{projectLabel(p)}</option>)}
                </select>
              </Field>

              <Field label={t('werk.uren.omschrijving')} hint={t('werk.uren.optioneel')}>
                <Textarea
                  rows={2}
                  value={beschrijving}
                  onChange={e => setBeschrijving(e.target.value)}
                  placeholder={t('werk.uren.omschrijvingPlaceholder')}
                />
              </Field>

              <Button onClick={opslaanRegistratie} loading={opslaan} disabled={!uren} style={{ width: '100%' }}>
                {opslaan ? t('werk.uren.opslaanBezig') : t('werk.uren.opslaan')}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* Recente registraties */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{t('werk.uren.recent')}</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="mf-spinner" />
          </div>
        ) : registraties.length === 0 ? (
          <Card>
            <EmptyState icon={Clock} title={t('werk.uren.leegTitel')} description={t('werk.uren.leegOmschrijving')} />
          </Card>
        ) : (
          <Table caption={t('werk.uren.caption')}>
            <THead>
              <Tr>
                <Th scope="col">{t('werk.uren.projectLabel')}</Th>
                <Th scope="col">{t('werk.uren.datum')}</Th>
                <Th scope="col" align="right">{t('werk.uren.kolomUren')}</Th>
                <Th scope="col" align="right">{t('werk.uren.kolomStatus')}</Th>
                <Th scope="col" align="right"><span className="sr-only">{t('werk.uren.acties')}</span></Th>
              </Tr>
            </THead>
            <TBody>
              {registraties.slice(0, 20).map(r => (
                <Tr key={r.id}>
                  <Td>
                    <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{projectLabel(r.project)}</p>
                    {r.beschrijving && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.beschrijving}</p>}
                  </Td>
                  <Td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                    {new Date(r.datum).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Td>
                  <Td align="right" style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text-1)' }}>{r.uren}</Td>
                  <Td align="right">
                    {r.goedgekeurd
                      ? <Badge variant="success"><Check size={12} aria-hidden /> {t('werk.uren.goedgekeurd')}</Badge>
                      : <Badge variant="neutral">{t('werk.uren.inBehandeling')}</Badge>}
                  </Td>
                  <Td align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verwijder(r.id)}
                      aria-label={t('werk.uren.verwijderLabel', { project: projectLabel(r.project), datum: new Date(r.datum).toLocaleDateString(locale) })}
                      style={{ padding: 8, color: 'var(--text-3)' }}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </main>
      <style>{`
        .mf-uren-fill { transition: transform 0.4s var(--ease); transform-origin: left center; }
        @media (prefers-reduced-motion: reduce) {
          .mf-uren-fill { transition: none; }
        }
      `}</style>
    </div>
  )
}
