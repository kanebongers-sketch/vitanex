'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import HrShell from '@/components/layout/HrShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

function maandag(datum: Date): Date {
  const d = new Date(datum)
  const dag = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (dag - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function weekBereik(weekStart: string, locale: string): { van: string; tot: string } {
  const ma = new Date(weekStart)
  const zo = new Date(ma)
  zo.setDate(ma.getDate() + 6)
  return {
    van: ma.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
    tot: zo.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export default function NieuwRoosterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, taal } = useVertaling()
  const [bedrijfId, setBedrijfId] = useState('')
  const [userId, setUserId] = useState('')
  const [naam, setNaam] = useState('')
  const [weekStart, setWeekStart] = useState(() => toYMD(maandag(new Date())))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setBedrijfId(profiel.bedrijf_id)
      setUserId(user.id)
      // Auto-naam op basis van week
      const d = new Date(weekStart)
      const weekNr = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
      setNaam(t('werk.roosterNieuw.weekNaam', { nr: weekNr }))
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleWeekChange(val: string) {
    // Zorg dat het altijd een maandag is
    const d = maandag(new Date(val))
    setWeekStart(toYMD(d))
    const weekNr = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
    setNaam(t('werk.roosterNieuw.weekNaam', { nr: weekNr }))
  }

  async function opslaan() {
    if (!naam.trim()) { setFout(t('werk.roosterNieuw.foutNaam')); return }
    setBezig(true)
    setFout('')
    const { data, error } = await supabase
      .from('roosters')
      .insert({ bedrijf_id: bedrijfId, naam: naam.trim(), week_start: weekStart, aangemaakt_door: userId })
      .select('id')
      .single()
    if (error || !data) {
      toast({
        title: t('werk.roosterNieuw.opslaanMislukt'),
        description: (taal === 'nl' ? error?.message : undefined) ?? t('werk.roosterNieuw.onbekendeFout'),
        variant: 'error',
      })
      setBezig(false)
      return
    }
    router.push(`/hr/roosters/${data.id}`)
  }

  return (
    <HrShell>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft size={15} aria-hidden />}
          style={{ marginBottom: 20, paddingLeft: 0 }}
        >
          {t('werk.roosterNieuw.terug')}
        </Button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24 }}>{t('werk.roosterNieuw.titel')}</h1>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <Field label={t('werk.roosterNieuw.week')} hint={t('werk.roosterNieuw.weekHint')}>
              <Input
                type="date"
                value={weekStart}
                onChange={e => handleWeekChange(e.target.value)}
              />
            </Field>
            <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-3)' }}>
              {t('werk.roosterNieuw.looptVan', { bereik: t('werk.roosterNieuw.bereik', weekBereik(weekStart, INTL_LOCALE[taal])) })}
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Field label={t('werk.roosterNieuw.naam')} error={fout || undefined}>
              <Input
                type="text"
                value={naam}
                onChange={e => { setNaam(e.target.value); if (fout) setFout('') }}
                placeholder={t('werk.roosterNieuw.naamPlaceholder')}
              />
            </Field>
          </div>

          <Button
            onClick={opslaan}
            loading={bezig}
            rightIcon={<ArrowRight size={16} aria-hidden />}
            style={{ width: '100%' }}
          >
            {bezig ? t('werk.roosterNieuw.aanmaken') : t('werk.roosterNieuw.aanmaakKnop')}
          </Button>
        </Card>
      </div>
    </HrShell>
  )
}
