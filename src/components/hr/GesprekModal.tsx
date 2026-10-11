'use client'

import { useState } from 'react'
import { Lock, Plus, Trash2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { useVertaling } from '@/lib/i18n/TaalProvider'

export type Actiepunt = {
  tekst: string
  gedaan: boolean
  deadline: string | null
}

export type Gesprek = {
  id?: string
  medewerker_id: string
  datum: string
  type: 'functionering' | 'beoordeling' | 'welzijn' | 'overig'
  onderwerp: string
  notities_intern: string
  samenvatting_medewerker: string
  actiepunten: Actiepunt[]
  status: 'gepland' | 'afgerond' | 'geannuleerd'
  followup_datum: string | null
}

type Medewerker = { id: string; naam: string }

type Props = {
  gesprek?: Partial<Gesprek> | null
  bedrijfId: string
  hrUserId: string
  medewerkers: Medewerker[]
  onClose: () => void
  onSaved: () => void
}

const TYPE_OPTIES = ['functionering', 'beoordeling', 'welzijn', 'overig'] as const

const selectStijl: React.CSSProperties = {
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

export default function GesprekModal({ gesprek, bedrijfId, hrUserId, medewerkers, onClose, onSaved }: Props) {
  const { t, taal } = useVertaling()
  const isNieuw = !gesprek?.id

  const [medewerkerId, setMedewerkerId] = useState(gesprek?.medewerker_id ?? '')
  const [datum, setDatum] = useState(gesprek?.datum ?? new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<Gesprek['type']>(gesprek?.type ?? 'functionering')
  const [onderwerp, setOnderwerp] = useState(gesprek?.onderwerp ?? '')
  const [notitiesIntern, setNotitiesIntern] = useState(gesprek?.notities_intern ?? '')
  const [samenvattingMedewerker, setSamenvattingMedewerker] = useState(gesprek?.samenvatting_medewerker ?? '')
  const [actiepunten, setActiepunten] = useState<Actiepunt[]>(gesprek?.actiepunten ?? [])
  const [status, setStatus] = useState<Gesprek['status']>(gesprek?.status ?? 'gepland')
  const [followupDatum, setFollowupDatum] = useState(gesprek?.followup_datum ?? '')
  const [nieuwActiepunt, setNieuwActiepunt] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [actieveTab, setActieveTab] = useState<'algemeen' | 'notities' | 'actiepunten'>('algemeen')

  function voegActiepuntToe() {
    if (!nieuwActiepunt.trim()) return
    setActiepunten(prev => [...prev, { tekst: nieuwActiepunt.trim(), gedaan: false, deadline: null }])
    setNieuwActiepunt('')
  }

  function toggleActiepunt(idx: number) {
    setActiepunten(prev => prev.map((a, i) => i === idx ? { ...a, gedaan: !a.gedaan } : a))
  }

  function verwijderActiepunt(idx: number) {
    setActiepunten(prev => prev.filter((_, i) => i !== idx))
  }

  function stelDeadlineIn(idx: number, deadline: string) {
    setActiepunten(prev => prev.map((a, i) => i === idx ? { ...a, deadline: deadline || null } : a))
  }

  async function opslaan() {
    if (!medewerkerId) { setFout(t('werk.gesprekModal.foutMedewerker')); return }
    if (!onderwerp.trim()) { setFout(t('werk.gesprekModal.foutOnderwerp')); return }
    setBezig(true)
    setFout(null)

    const payload = {
      bedrijf_id: bedrijfId,
      hr_user_id: hrUserId,
      medewerker_id: medewerkerId,
      datum,
      type,
      onderwerp: onderwerp.trim(),
      notities_intern: notitiesIntern.trim() || null,
      samenvatting_medewerker: samenvattingMedewerker.trim() || null,
      actiepunten,
      status,
      follow_up_datum: followupDatum || null,
    }

    let error
    if (isNieuw) {
      ;({ error } = await supabase.from('hr_gesprekken').insert(payload))
    } else {
      ;({ error } = await supabase.from('hr_gesprekken').update(payload).eq('id', gesprek!.id!))
    }

    setBezig(false)
    if (error) { setFout(taal === 'nl' ? error.message : t('werk.algemeen.opslaanMislukt')); return }
    onSaved()
  }

  return (
    <DialogRoot open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        style={{
          width: 'min(92vw, 600px)',
          maxHeight: '90vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TabsRoot
          value={actieveTab}
          onValueChange={(v) => setActieveTab(v as typeof actieveTab)}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {/* Header */}
          <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
            <div style={{ marginBottom: 16, paddingRight: 40 }}>
              <DialogTitle style={{ fontSize: 17, paddingRight: 0 }}>
                {isNieuw ? t('werk.gesprekModal.titelNieuw') : t('werk.gesprekModal.titelBewerken')}
              </DialogTitle>
              <DialogDescription style={{ fontSize: 12, marginTop: 4 }}>
                {isNieuw ? t('werk.gesprekModal.omschrijvingNieuw') : t('werk.gesprekModal.omschrijvingBewerken')}
              </DialogDescription>
            </div>

            <TabsList>
              <TabsTrigger value="algemeen">{t('werk.gesprekModal.tabAlgemeen')}</TabsTrigger>
              <TabsTrigger value="notities">{t('werk.gesprekModal.tabNotities')}</TabsTrigger>
              <TabsTrigger value="actiepunten">
                {actiepunten.length ? t('werk.gesprekModal.tabActiepuntenAantal', { aantal: actiepunten.length }) : t('werk.gesprekModal.tabActiepunten')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }}>

            {/* Tab: Algemeen */}
            <TabsContent value="algemeen" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Medewerker */}
                <Field label={t('werk.gesprekModal.medewerker')} required>
                  <select value={medewerkerId} onChange={e => setMedewerkerId(e.target.value)} style={selectStijl}>
                    <option value="">{t('werk.gesprekModal.selecteerMedewerker')}</option>
                    {medewerkers.map(m => (
                      <option key={m.id} value={m.id}>{m.naam}</option>
                    ))}
                  </select>
                </Field>

                {/* Datum + Type rij */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label={t('werk.gesprekModal.datum')} required>
                    <Input type="date" value={datum} onChange={e => setDatum(e.target.value)} />
                  </Field>
                  <Field label={t('werk.gesprekModal.typeGesprek')} required>
                    <select value={type} onChange={e => setType(e.target.value as Gesprek['type'])} style={selectStijl}>
                      {TYPE_OPTIES.map(o => (
                        <option key={o} value={o}>{t(`werk.gesprekModal.typeOptie.${o}`)}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Onderwerp */}
                <Field label={t('werk.gesprekModal.onderwerp')} required>
                  <Input
                    type="text"
                    value={onderwerp}
                    onChange={e => setOnderwerp(e.target.value)}
                    placeholder={t('werk.gesprekModal.onderwerpPlaceholder')}
                  />
                </Field>

                {/* Status + Follow-up rij */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label={t('werk.gesprekModal.status')}>
                    <select value={status} onChange={e => setStatus(e.target.value as Gesprek['status'])} style={selectStijl}>
                      <option value="gepland">{t('werk.gesprekStatus.gepland')}</option>
                      <option value="afgerond">{t('werk.gesprekStatus.afgerond')}</option>
                      <option value="geannuleerd">{t('werk.gesprekStatus.geannuleerd')}</option>
                    </select>
                  </Field>
                  <Field label={t('werk.gesprekModal.followupDatum')}>
                    <Input type="date" value={followupDatum ?? ''} onChange={e => setFollowupDatum(e.target.value)} />
                  </Field>
                </div>

                {/* Status badge preview */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('werk.gesprekModal.statusDubbelepunt')}</span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Notities */}
            <TabsContent value="notities" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  background: 'var(--mf-amber-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  border: '1px solid var(--mf-amber)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <Lock size={16} aria-hidden style={{ color: 'var(--mf-amber)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{t('werk.gesprekModal.internAlleenHr')}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t('werk.gesprekModal.samenvattingZichtbaar')}</p>
                  </div>
                </div>

                <Field label={t('werk.gesprekModal.interneNotities')}>
                  <Textarea
                    value={notitiesIntern}
                    onChange={e => setNotitiesIntern(e.target.value)}
                    placeholder={t('werk.gesprekModal.interneNotitiesPlaceholder')}
                    rows={5}
                  />
                </Field>

                <Field label={t('werk.gesprekModal.samenvatting')}>
                  <Textarea
                    value={samenvattingMedewerker}
                    onChange={e => setSamenvattingMedewerker(e.target.value)}
                    placeholder={t('werk.gesprekModal.samenvattingPlaceholder')}
                    rows={4}
                  />
                </Field>
              </div>
            </TabsContent>

            {/* Tab: Actiepunten */}
            <TabsContent value="actiepunten" style={{ paddingTop: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {actiepunten.length === 0 && (
                  <div style={{
                    background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)',
                    padding: '32px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13,
                  }}>
                    {t('werk.gesprekModal.geenActiepunten')}
                  </div>
                )}

                {actiepunten.map((ap, idx) => (
                  <div key={idx} style={{
                    background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px',
                    border: `1px solid ${ap.gedaan ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => toggleActiepunt(idx)}
                        aria-pressed={ap.gedaan}
                        aria-label={ap.gedaan ? t('werk.gesprekModal.markeerNietGedaan', { tekst: ap.tekst }) : t('werk.gesprekModal.markeerGedaan', { tekst: ap.tekst })}
                        className="mf-pressable"
                        style={{
                          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${ap.gedaan ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                          background: ap.gedaan ? 'var(--mentaforce-primary)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {ap.gedaan && <Check size={12} aria-hidden style={{ color: 'var(--bg-app)' }} strokeWidth={3} />}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 13, color: ap.gedaan ? 'var(--text-3)' : 'var(--text-2)',
                        textDecoration: ap.gedaan ? 'line-through' : 'none',
                      }}>{ap.tekst}</span>
                      <button
                        type="button"
                        onClick={() => verwijderActiepunt(idx)}
                        aria-label={t('werk.gesprekModal.verwijderActiepunt', { tekst: ap.tekst })}
                        className="mf-pressable"
                        style={{
                          width: 24, height: 24, borderRadius: 6, border: '1px solid var(--mf-red)',
                          background: 'var(--mf-red-light)', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--mf-red)', flexShrink: 0,
                        }}
                      >
                        <Trash2 size={12} aria-hidden />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 30 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('werk.gesprekModal.deadline')}</span>
                      <Input
                        type="date"
                        value={ap.deadline ?? ''}
                        onChange={e => stelDeadlineIn(idx, e.target.value)}
                        aria-label={t('werk.gesprekModal.deadlineVoor', { tekst: ap.tekst })}
                        style={{ width: 'auto', fontSize: 13, padding: '4px 10px' }}
                      />
                      {ap.deadline && (
                        <Button variant="ghost" size="sm" onClick={() => stelDeadlineIn(idx, '')} style={{ padding: '4px 8px', fontSize: 11 }}>
                          {t('werk.gesprekModal.wis')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Nieuw actiepunt */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Input
                    type="text"
                    value={nieuwActiepunt}
                    onChange={e => setNieuwActiepunt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') voegActiepuntToe() }}
                    placeholder={t('werk.gesprekModal.nieuwActiepuntPlaceholder')}
                    aria-label={t('werk.gesprekModal.nieuwActiepunt')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={voegActiepuntToe}
                    disabled={!nieuwActiepunt.trim()}
                    leftIcon={<Plus size={15} aria-hidden />}
                  >
                    {t('werk.gesprekModal.toevoegen')}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {fout && (
              <div role="alert" style={{
                marginTop: 12, background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--mf-red)',
              }}>{fout}</div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
          }}>
            <Button variant="secondary" onClick={onClose}>{t('werk.algemeen.annuleren')}</Button>
            <Button onClick={opslaan} loading={bezig} style={{ minWidth: 100 }}>
              {isNieuw ? t('werk.gesprekModal.gesprekPlannen') : t('werk.gesprekModal.wijzigingenOpslaan')}
            </Button>
          </div>
        </TabsRoot>
      </DialogContent>
    </DialogRoot>
  )
}

export function StatusBadge({ status }: { status: Gesprek['status'] }) {
  const { t } = useVertaling()
  const map: Record<Gesprek['status'], { variant: 'accent' | 'success' | 'neutral'; dot: string }> = {
    gepland:     { variant: 'accent',  dot: 'var(--mentaforce-primary)' },
    afgerond:    { variant: 'success', dot: 'var(--mf-green)' },
    geannuleerd: { variant: 'neutral', dot: 'var(--text-3)' },
  }
  const s = map[status]
  return (
    <Badge variant={s.variant}>
      <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {t(`werk.gesprekStatus.${status}`)}
    </Badge>
  )
}
