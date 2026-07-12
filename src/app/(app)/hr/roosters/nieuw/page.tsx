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

function weekBereik(weekStart: string): string {
  const ma = new Date(weekStart)
  const zo = new Date(ma)
  zo.setDate(ma.getDate() + 6)
  return `${ma.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} t/m ${zo.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export default function NieuwRoosterPage() {
  const router = useRouter()
  const { toast } = useToast()
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
      setNaam(`Week ${weekNr}`)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleWeekChange(val: string) {
    // Zorg dat het altijd een maandag is
    const d = maandag(new Date(val))
    setWeekStart(toYMD(d))
    const weekNr = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
    setNaam(`Week ${weekNr}`)
  }

  async function opslaan() {
    if (!naam.trim()) { setFout('Geef het rooster een naam.'); return }
    setBezig(true)
    setFout('')
    const { data, error } = await supabase
      .from('roosters')
      .insert({ bedrijf_id: bedrijfId, naam: naam.trim(), week_start: weekStart, aangemaakt_door: userId })
      .select('id')
      .single()
    if (error || !data) {
      toast({
        title: 'Opslaan mislukt',
        description: error?.message ?? 'Onbekende fout. Probeer het later opnieuw.',
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
          Terug
        </Button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24 }}>Nieuw rooster</h1>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <Field label="Week" hint="De datum wordt automatisch op de maandag van die week gezet.">
              <Input
                type="date"
                value={weekStart}
                onChange={e => handleWeekChange(e.target.value)}
              />
            </Field>
            <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-3)' }}>
              Rooster loopt van <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{weekBereik(weekStart)}</strong>.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Field label="Naam rooster" error={fout || undefined}>
              <Input
                type="text"
                value={naam}
                onChange={e => { setNaam(e.target.value); if (fout) setFout('') }}
                placeholder="bijv. Week 23 - Team A"
              />
            </Field>
          </div>

          <Button
            onClick={opslaan}
            loading={bezig}
            rightIcon={<ArrowRight size={16} aria-hidden />}
            style={{ width: '100%' }}
          >
            {bezig ? 'Aanmaken…' : 'Rooster aanmaken'}
          </Button>
        </Card>
      </div>
    </HrShell>
  )
}
