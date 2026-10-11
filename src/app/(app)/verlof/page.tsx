'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Palmtree, Thermometer, Star, Briefcase, ClipboardList } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

// Woordenboek-sleutels per verloftype.
const TYPE_LABELS: Record<VerlofType, string> = {
  vakantie: 'werk.verlofType.vakantie',
  ziekte: 'werk.verlofType.ziekte',
  bijzonder: 'werk.verlofType.bijzonder',
  onbetaald: 'werk.verlofType.onbetaald',
  overig: 'werk.verlofType.overig',
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
  aangevraagd: { variant: 'warning', label: 'werk.verlofStatus.aangevraagd' },
  goedgekeurd: { variant: 'success', label: 'werk.verlofStatus.goedgekeurd' },
  afgewezen:   { variant: 'danger',  label: 'werk.verlofStatus.afgewezen' },
}

function aantalDagen(van: string, tot: string): number {
  const v = new Date(van)
  const e = new Date(tot)
  return Math.max(1, Math.round((e.getTime() - v.getTime()) / 86400000) + 1)
}

export default function VerlofPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const [laden, setLaden] = useState(true)
  const [aanvragen, setAanvragen] = useState<VerlofAanvraag[]>([])
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  // Alleen écht opgenomen dagen (uit goedgekeurde aanvragen) — het totale
  // verlofsaldo kennen we hier niet, dat wordt beheerd door HR.
  const [opgenomen, setOpgenomen] = useState(0)

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
        setOpgenomen(opgenomenDagen)
      }

      setLaden(false)
    }
    laad()
  }, [router])

  async function indienen() {
    if (!datumVan || !datumTot) { setFout(t('werk.verlof.foutDatums')); return }
    if (new Date(datumTot) < new Date(datumVan)) { setFout(t('werk.verlof.foutVolgorde')); return }
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
      const melding = taal === 'nl' ? error.message : t('werk.algemeen.ietsMis')
      setFout(t('werk.verlof.opslaanMisluktMet', { fout: melding }))
      toast({ title: t('werk.verlof.opslaanMislukt'), description: melding, variant: 'error' })
    } else {
      setAanvragen(prev => [data as VerlofAanvraag, ...prev])
      setFormulier(false)
      setType('vakantie'); setDatumVan(''); setDatumTot(''); setReden('')
      toast({ title: t('werk.verlof.ingediend'), variant: 'success' })
    }
    setOpslaan(false)
  }

  const vandaag = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{t('werk.verlof.titel')}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{t('werk.verlof.intro')}</p>
          </div>
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden />} onClick={() => { setFout(''); setFormulier(true) }}>
            {t('werk.verlof.aanvragen')}
          </Button>
        </div>

        {/* Opgenomen verlof — uit echte, goedgekeurde aanvragen */}
        <Card className="mb-6" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{opgenomen}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{opgenomen === 1 ? t('werk.verlof.opgenomenEen') : t('werk.verlof.opgenomenMeer')}</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)', textAlign: 'right', maxWidth: 240 }}>
            {t('werk.verlof.saldoHr')}
          </p>
        </Card>

        {/* Formulier */}
        <DialogRoot open={formulier} onOpenChange={(open) => { if (!open) setFormulier(false) }}>
          <DialogContent>
            <DialogTitle>{t('werk.verlof.dialoogTitel')}</DialogTitle>

            <div className="flex flex-col gap-4" style={{ marginTop: 18 }}>
              {/* Type */}
              <div role="group" aria-label={t('werk.verlof.typeVerlof')}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>{t('werk.verlof.typeVerlof')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as VerlofType[]).map(soort => {
                    const Icoon = TYPE_ICON[soort]
                    const actief = type === soort
                    return (
                      <button key={soort} type="button" onClick={() => setType(soort)}
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
                        <span>{t(TYPE_LABELS[soort])}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Datums */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('werk.verlof.van')}>
                  <Input
                    type="date"
                    value={datumVan}
                    min={vandaag}
                    onChange={e => { setDatumVan(e.target.value); if (!datumTot) setDatumTot(e.target.value) }}
                  />
                </Field>
                <Field label={t('werk.verlof.totEnMet')}>
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
                  {aantalDagen(datumVan, datumTot) === 1 ? t('werk.verlof.dagEen') : t('werk.verlof.dagMeer', { aantal: aantalDagen(datumVan, datumTot) })}
                </p>
              )}

              {/* Reden */}
              <Field label={t('werk.verlof.reden')} hint={t('werk.verlof.optioneel')} error={fout || undefined}>
                <Textarea
                  rows={2}
                  value={reden}
                  onChange={e => setReden(e.target.value)}
                  placeholder={t('werk.verlof.redenPlaceholder')}
                />
              </Field>

              <Button
                onClick={indienen}
                loading={opslaan}
                disabled={!datumVan || !datumTot}
                style={{ width: '100%' }}
              >
                {opslaan ? t('werk.verlof.versturen') : t('werk.verlof.indienen')}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* Aanvragen lijst */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-4)' }}>{t('werk.verlof.mijnAanvragen')}</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="mf-spinner" />
          </div>
        ) : aanvragen.length === 0 ? (
          <Card>
            <EmptyState
              icon={Palmtree}
              title={t('werk.verlof.leegTitel')}
              description={t('werk.verlof.leegOmschrijving')}
            />
          </Card>
        ) : (
          <Table caption={t('werk.verlof.caption')}>
            <THead>
              <Tr>
                <Th scope="col">{t('werk.verlof.kolomType')}</Th>
                <Th scope="col">{t('werk.verlof.kolomPeriode')}</Th>
                <Th scope="col" align="right">{t('werk.verlof.kolomDagen')}</Th>
                <Th scope="col" align="right">{t('werk.verlof.kolomStatus')}</Th>
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
                          <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{TYPE_LABELS[a.type as VerlofType] ? t(TYPE_LABELS[a.type as VerlofType]) : a.type}</p>
                          {a.reden && <p className="text-xs italic" style={{ color: 'var(--text-4)' }}>&quot;{a.reden}&quot;</p>}
                          {a.reviewer_notitie && (
                            <p className="text-xs" style={{ marginTop: 2, color: a.status === 'goedgekeurd' ? 'var(--mentaforce-primary)' : 'var(--mf-red)' }}>
                              <strong>{t('werk.verlof.notitieHr')}</strong> {a.reviewer_notitie}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                      {a.datum_van !== a.datum_tot
                        ? t('werk.algemeen.bereik', {
                          van: new Date(a.datum_van).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
                          tot: new Date(a.datum_tot).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
                        })
                        : new Date(a.datum_van).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </Td>
                    <Td align="right" style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text-1)' }}>{dagen}</Td>
                    <Td align="right">
                      <Badge variant={stijl.variant}>{t(stijl.label)}</Badge>
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
