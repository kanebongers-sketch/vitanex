'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarRange } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

import WeekRoosterView from '@/components/rooster/WeekRoosterView'
import DienstKaart, { type Dienst } from '@/components/rooster/DienstKaart'

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

function weekLabel(ma: Date): string {
  const zo = new Date(ma)
  zo.setDate(ma.getDate() + 6)
  return `${ma.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${zo.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
}

const WEEK_TITELS = ['Deze week', 'Volgende week', 'Over 2 weken']

export default function RoosterPage() {
  const router = useRouter()
  const [geladen, setGeladen] = useState(false)
  const [naam, setNaam] = useState('')
  const [diensten, setDiensten] = useState<Dienst[]>([])
  const [weekOffset, setWeekOffset] = useState(0) // 0=deze week, 1=volgende, 2=daarna

  const ma = maandag(new Date())
  const gekozenMa = new Date(ma)
  gekozenMa.setDate(ma.getDate() + weekOffset * 7)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol').eq('id', user.id).single()
      if (!profiel) { router.push('/login'); return }

      // HR/admin doorsturen naar HR-view
      if (['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/hr/roosters')
        return
      }

      setNaam(profiel.naam ?? 'Medewerker')

      // Haal diensten op voor de komende 3 weken
      const vanDatum = toYMD(ma)
      const totDatum = (() => {
        const t = new Date(ma)
        t.setDate(ma.getDate() + 21)
        return toYMD(t)
      })()

      const { data: raw } = await supabase
        .from('rooster_diensten')
        .select('id, datum, start_tijd, eind_tijd, rol_label, notitie')
        .eq('user_id', user.id)
        .gte('datum', vanDatum)
        .lte('datum', totDatum)
        .order('datum', { ascending: true })

      setDiensten((raw ?? []) as Dienst[])
      setGeladen(true)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wekenLabels = [0, 1, 2].map(i => {
    const m = new Date(ma)
    m.setDate(ma.getDate() + i * 7)
    return weekLabel(m)
  })

  // Komende diensten (buiten gekozen week) voor de lijst onderaan
  const gekozenStart = toYMD(gekozenMa)
  const gekozenEind = (() => {
    const z = new Date(gekozenMa)
    z.setDate(gekozenMa.getDate() + 6)
    return toYMD(z)
  })()

  const dienstenDezePeriode = diensten.filter(d => d.datum >= gekozenStart && d.datum <= gekozenEind)
  const aantalUren = dienstenDezePeriode.reduce((tot, d) => {
    const [sh, sm] = d.start_tijd.split(':').map(Number)
    const [eh, em] = d.eind_tijd.split(':').map(Number)
    return tot + (eh * 60 + em - sh * 60 - sm) / 60
  }, 0)

  if (!geladen) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Rooster laden…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Mijn rooster</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>Hallo {naam}, hier zijn je geplande diensten.</p>
        </header>

        {/* Week-keuze */}
        <div role="group" aria-label="Week kiezen" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {WEEK_TITELS.map((titel, i) => {
            const actief = weekOffset === i
            return (
              <button
                key={i}
                type="button"
                aria-pressed={actief}
                onClick={() => setWeekOffset(i)}
                className="mf-pressable mf-week-tab"
                style={{
                  padding: '8px 16px',
                  borderRadius: '100px',
                  border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
                  background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                  color: actief ? 'var(--bg-app)' : 'var(--text-2)',
                  fontSize: 13,
                  fontWeight: actief ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'opacity 0.15s var(--ease)',
                }}
              >
                {titel}
                <span style={{ display: 'block', fontSize: 10, opacity: 0.8 }}>{wekenLabels[i]}</span>
              </button>
            )
          })}
        </div>

        {/* Statistiek strip */}
        <Card style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{dienstenDezePeriode.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>diensten</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>{aantalUren.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>uur gepland</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mentaforce-primary)' }}>
              {weekLabel(gekozenMa).split('–')[0].trim()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>week van</div>
          </div>
        </Card>

        {/* Week grid */}
        <Card style={{ padding: 20, marginBottom: 24 }}>
          <WeekRoosterView diensten={diensten} weekStart={gekozenMa} toonNaam={false} />
        </Card>

        {/* Lijst komende diensten */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>
            Diensten deze periode
          </h2>
          {dienstenDezePeriode.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarRange}
                title="Geen diensten gepland"
                description="Er zijn geen diensten gepland voor deze week."
              />
            </Card>
          ) : (
            dienstenDezePeriode.map(d => (
              <DienstKaart key={d.id} dienst={d} toonNaam={false} />
            ))
          )}
        </section>
      </div>
      <style>{`
        .mf-week-tab:hover { opacity: 0.88; }
        .mf-week-tab:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
