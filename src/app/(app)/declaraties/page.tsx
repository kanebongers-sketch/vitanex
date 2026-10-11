'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Car, UtensilsCrossed, Package, GraduationCap, Handshake, Wallet,
} from 'lucide-react'
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
import {
  DialogRoot, DialogContent, DialogTitle,
} from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'


type DeclaratieStatus = 'ingediend' | 'goedgekeurd' | 'afgewezen'
type DeclaratieCategorie = 'reiskosten' | 'maaltijd' | 'materiaal' | 'training' | 'representatie' | 'overig'

type Declaratie = {
  id: string
  datum: string
  bedrag: number
  categorie: DeclaratieCategorie
  beschrijving: string
  status: DeclaratieStatus
  created_at: string
  reviewer_notitie?: string | null
}

// Woordenboek-sleutels per categorie.
const CAT_LABELS: Record<DeclaratieCategorie, string> = {
  reiskosten: 'werk.declaratieCategorie.reiskosten',
  maaltijd: 'werk.declaratieCategorie.maaltijd',
  materiaal: 'werk.declaratieCategorie.materiaal',
  training: 'werk.declaratieCategorie.training',
  representatie: 'werk.declaratieCategorie.representatie',
  overig: 'werk.declaratieCategorie.overig',
}

const CAT_ICON: Record<DeclaratieCategorie, LucideIcon> = {
  reiskosten: Car,
  maaltijd: UtensilsCrossed,
  materiaal: Package,
  training: GraduationCap,
  representatie: Handshake,
  overig: Wallet,
}

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const STATUS_STIJL: Record<DeclaratieStatus, { variant: BadgeVariant; label: string }> = {
  ingediend:   { variant: 'warning', label: 'werk.declaratieStatus.ingediend' },
  goedgekeurd: { variant: 'success', label: 'werk.declaratieStatus.goedgekeurd' },
  afgewezen:   { variant: 'danger',  label: 'werk.declaratieStatus.afgewezen' },
}

function euro(bedrag: number, locale: string): string {
  return `€${bedrag.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DeclaratiesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const [laden, setLaden] = useState(true)
  const [declaraties, setDeclaraties] = useState<Declaratie[]>([])
  const [userId, setUserId] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [bedrag, setBedrag] = useState('')
  const [categorie, setCategorie] = useState<DeclaratieCategorie>('reiskosten')
  const [beschrijving, setBeschrijving] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      const { data } = await supabase
        .from('declaraties')
        .select('id, datum, bedrag, categorie, beschrijving, status, reviewer_notitie, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setDeclaraties(data as Declaratie[])
      setLaden(false)
    }
    laad()
  }, [router])

  async function indienen() {
    const b = parseFloat(bedrag.replace(',', '.'))
    if (!bedrag || isNaN(b) || b <= 0) { setFout(t('werk.declaraties.foutBedrag')); return }
    if (!beschrijving.trim()) { setFout(t('werk.declaraties.foutOmschrijving')); return }
    setOpslaan(true); setFout('')

    const { data, error } = await supabase.from('declaraties').insert({
      user_id: userId,
      bedrijf_id: bedrijfId,
      datum,
      bedrag: b,
      categorie,
      beschrijving: beschrijving.trim(),
      status: 'ingediend',
    }).select().single()

    if (error) {
      const melding = taal === 'nl' ? error.message : t('werk.algemeen.ietsMis')
      setFout(t('werk.declaraties.opslaanMisluktMet', { fout: melding }))
      toast({ title: t('werk.declaraties.opslaanMislukt'), description: melding, variant: 'error' })
    } else {
      setDeclaraties(prev => [data as Declaratie, ...prev])
      setFormulier(false)
      setBedrag(''); setBeschrijving(''); setCategorie('reiskosten')
      toast({ title: t('werk.declaraties.ingediend'), variant: 'success' })
    }
    setOpslaan(false)
  }

  const openstaand = declaraties.filter(d => d.status === 'ingediend').reduce((s, d) => s + d.bedrag, 0)
  const totaalGoedgekeurd = declaraties.filter(d => d.status === 'goedgekeurd').reduce((s, d) => s + d.bedrag, 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="px-6 py-6 mf-safe-bottom" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{t('werk.declaraties.titel')}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{t('werk.declaraties.intro')}</p>
          </div>
          <Button size="sm" leftIcon={<Plus size={16} aria-hidden />} onClick={() => { setFout(''); setFormulier(true) }}>
            {t('werk.declaraties.indienen')}
          </Button>
        </div>

        {/* Statistieken */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          <Card style={{ padding: 16 }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-4)' }}>{t('werk.declaraties.openstaand')}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--mf-amber)' }}>{euro(openstaand, locale)}</p>
          </Card>
          <Card style={{ padding: 16 }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-4)' }}>{t('werk.declaraties.goedgekeurd')}</p>
            <p className="text-xl font-bold" style={{ color: 'var(--mentaforce-primary)' }}>{euro(totaalGoedgekeurd, locale)}</p>
          </Card>
        </div>

        {/* Formulier */}
        <DialogRoot open={formulier} onOpenChange={(open) => { if (!open) setFormulier(false) }}>
          <DialogContent>
            <DialogTitle>{t('werk.declaraties.dialoogTitel')}</DialogTitle>

            <div className="flex flex-col gap-4" style={{ marginTop: 18 }}>
              {/* Categorie */}
              <div role="group" aria-label={t('werk.declaraties.categorie')}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>{t('werk.declaraties.categorie')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CAT_LABELS) as DeclaratieCategorie[]).map(c => {
                    const Icoon = CAT_ICON[c]
                    const actief = categorie === c
                    return (
                      <button key={c} type="button" onClick={() => setCategorie(c)}
                        aria-pressed={actief}
                        className="flex flex-col items-center gap-1 px-2 py-3 text-xs transition"
                        style={{
                          minHeight: 44,
                          borderRadius: 'var(--radius-md)',
                          background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
                          border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                          color: actief ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                          fontWeight: actief ? 600 : 400,
                          cursor: 'pointer',
                        }}>
                        <Icoon size={18} aria-hidden strokeWidth={1.75} />
                        <span>{t(CAT_LABELS[c])}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('werk.declaraties.datum')}>
                  <Input type="date" value={datum} onChange={e => setDatum(e.target.value)} />
                </Field>
                <Field label={t('werk.declaraties.bedrag')}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={bedrag}
                    onChange={e => setBedrag(e.target.value)}
                    placeholder="0,00"
                  />
                </Field>
              </div>

              <Field label={t('werk.declaraties.omschrijving')} error={fout || undefined}>
                <Textarea
                  rows={2}
                  value={beschrijving}
                  onChange={e => setBeschrijving(e.target.value)}
                  placeholder={t('werk.declaraties.omschrijvingPlaceholder')}
                />
              </Field>

              <Button onClick={indienen} loading={opslaan} style={{ width: '100%' }}>
                {opslaan ? t('werk.declaraties.indienenBezig') : t('werk.declaraties.dialoogTitel')}
              </Button>
            </div>
          </DialogContent>
        </DialogRoot>

        {/* Lijst */}
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-4)' }}>{t('werk.declaraties.mijn')}</p>

        {laden ? (
          <div className="flex justify-center py-10">
            <div className="mf-spinner" />
          </div>
        ) : declaraties.length === 0 ? (
          <Card>
            <EmptyState icon={Wallet} title={t('werk.declaraties.leegTitel')} description={t('werk.declaraties.leegOmschrijving')} />
          </Card>
        ) : (
          <Table caption={t('werk.declaraties.mijn')}>
            <THead>
              <Tr>
                <Th scope="col">{t('werk.declaraties.categorie')}</Th>
                <Th scope="col">{t('werk.declaraties.datum')}</Th>
                <Th scope="col" align="right">{t('werk.declaraties.kolomBedrag')}</Th>
                <Th scope="col" align="right">{t('werk.declaraties.kolomStatus')}</Th>
              </Tr>
            </THead>
            <TBody>
              {declaraties.map(d => {
                const stijl = STATUS_STIJL[d.status]
                const Icoon = CAT_ICON[d.categorie as DeclaratieCategorie]
                return (
                  <Tr key={d.id}>
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
                          <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{CAT_LABELS[d.categorie as DeclaratieCategorie] ? t(CAT_LABELS[d.categorie as DeclaratieCategorie]) : d.categorie}</p>
                          {d.beschrijving && (
                            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{d.beschrijving}</p>
                          )}
                          {d.reviewer_notitie && (
                            <p className="text-xs" style={{ marginTop: 2, color: d.status === 'goedgekeurd' ? 'var(--mentaforce-primary)' : 'var(--mf-red)' }}>
                              <strong>{t('werk.declaraties.notitie')}</strong> {d.reviewer_notitie}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                      {new Date(d.datum).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Td>
                    <Td align="right" style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--text-1)' }}>
                      {euro(d.bedrag, locale)}
                    </Td>
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
