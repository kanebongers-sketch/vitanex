'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import HrShell from '@/components/layout/HrShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import {
  DialogRoot, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/Dialog'


type Rooster = {
  id: string
  naam: string
  week_start: string
  created_at: string
  aangemaakt_door: string | null
  dienst_count?: number
}

function weekLabel(weekStart: string, locale: string): { van: string; tot: string } {
  const ma = new Date(weekStart)
  const zo = new Date(ma)
  zo.setDate(ma.getDate() + 6)
  return {
    van: ma.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    tot: zo.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
  }
}

export default function HrRoostersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const [roosters, setRoosters] = useState<Rooster[]>([])
  const [geladen, setGeladen] = useState(false)
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null)
  const [teVerwijderen, setTeVerwijderen] = useState<Rooster | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data } = await supabase
        .from('roosters')
        .select('id, naam, week_start, created_at, aangemaakt_door')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .order('week_start', { ascending: false })

      // Haal dienst-aantallen op
      const ids = (data ?? []).map(r => r.id)
      const counts: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: dc } = await supabase
          .from('rooster_diensten')
          .select('rooster_id')
          .in('rooster_id', ids)
        dc?.forEach(d => { counts[d.rooster_id] = (counts[d.rooster_id] ?? 0) + 1 })
      }

      setRoosters((data ?? []).map(r => ({ ...r, dienst_count: counts[r.id] ?? 0 })))
      setGeladen(true)
    }
    laad()
  }, [router])

  async function bevestigVerwijderen() {
    const doel = teVerwijderen
    if (!doel) return
    setVerwijderBezig(doel.id)
    const { error } = await supabase.from('roosters').delete().eq('id', doel.id)
    if (error) {
      toast({ title: t('werk.hrRoosters.verwijderenMislukt'), description: t('werk.algemeen.later'), variant: 'error' })
      setVerwijderBezig(null)
      return
    }
    setRoosters(prev => prev.filter(r => r.id !== doel.id))
    setVerwijderBezig(null)
    setTeVerwijderen(null)
    toast({ title: t('werk.hrRoosters.verwijderd'), description: t('werk.hrRoosters.verwijderdOmschrijving', { naam: doel.naam }), variant: 'success' })
  }

  return (
    <HrShell>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{t('werk.hrRoosters.titel')}</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>{t('werk.hrRoosters.intro')}</p>
          </div>
          <Link href="/hr/roosters/nieuw" style={{ textDecoration: 'none' }}>
            <Button leftIcon={<Plus size={16} aria-hidden />}>{t('werk.hrRoosters.nieuw')}</Button>
          </Link>
        </header>

        {!geladen ? (
          <ul aria-hidden style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => (
              <li key={i}>
                <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div className="mf-skeleton" style={{ width: '38%', height: 15, borderRadius: 6 }} />
                    <div className="mf-skeleton" style={{ width: '24%', height: 11, borderRadius: 6, marginTop: 8 }} />
                  </div>
                  <div className="mf-skeleton" style={{ width: 140, height: 32, borderRadius: 8 }} />
                </Card>
              </li>
            ))}
          </ul>
        ) : roosters.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title={t('werk.hrRoosters.leegTitel')}
              description={t('werk.hrRoosters.leegOmschrijving')}
              action={
                <Link href="/hr/roosters/nieuw" style={{ textDecoration: 'none' }}>
                  <Button leftIcon={<Plus size={16} aria-hidden />}>{t('werk.hrRoosters.nieuw')}</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roosters.map(r => (
              <li key={r.id}>
                <Card interactive style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 15 }}>{r.naam}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {t('werk.algemeen.bereik', weekLabel(r.week_start, INTL_LOCALE[taal]))}
                      <span style={{ marginLeft: 12, color: 'var(--text-3)' }}>{t('werk.hrRoosters.dienstenAantal', { aantal: r.dienst_count ?? 0 })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link href={`/hr/roosters/${r.id}`} style={{ textDecoration: 'none' }}>
                      <Button variant="secondary" size="sm" leftIcon={<Pencil size={15} aria-hidden />}>
                        {t('werk.hrRoosters.bewerken')}
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setTeVerwijderen(r)}
                      leftIcon={<Trash2 size={15} aria-hidden />}
                      aria-label={t('werk.hrRoosters.verwijderLabel', { naam: r.naam })}
                    >
                      {t('werk.hrRoosters.verwijder')}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Verwijderbevestiging */}
      <DialogRoot open={!!teVerwijderen} onOpenChange={(open) => { if (!open) setTeVerwijderen(null) }}>
        <DialogContent>
          <DialogTitle>{t('werk.hrRoosters.dialoogTitel')}</DialogTitle>
          <DialogDescription>
            {teVerwijderen
              ? t('werk.hrRoosters.dialoogTekst', { naam: teVerwijderen.naam })
              : ''}
          </DialogDescription>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <DialogClose asChild>
              <Button variant="ghost">{t('werk.algemeen.annuleren')}</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={verwijderBezig === teVerwijderen?.id}
              onClick={bevestigVerwijderen}
              leftIcon={<Trash2 size={15} aria-hidden />}
            >
              {t('werk.hrRoosters.definitief')}
            </Button>
          </div>
        </DialogContent>
      </DialogRoot>
    </HrShell>
  )
}
