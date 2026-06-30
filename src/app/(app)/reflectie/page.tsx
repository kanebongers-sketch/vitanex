'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, History, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Textarea'


const REFLECTIE_VRAGEN = [
  { id: 'hoogtepunt', vraag: 'Wat was het hoogtepunt van deze week?', placeholder: 'Het moment dat me het meest energiek maakte...' },
  { id: 'uitdaging', vraag: 'Wat was de grootste uitdaging?', placeholder: 'Iets wat me moeilijk afging of stress gaf...' },
  { id: 'leermoment', vraag: 'Wat heb ik geleerd of ontdekt over mezelf?', placeholder: 'Een inzicht, patroon of nieuwe vaardigheid...' },
  { id: 'energie', vraag: 'Wat gaf me energie? Wat kostte energie?', placeholder: 'Activiteiten, mensen of situaties die...' },
  { id: 'volgende_week', vraag: 'Wat wil ik volgende week anders doen?', placeholder: 'Eén concrete verandering of intentie...' },
  { id: 'dankbaarheid', vraag: 'Waar ben ik dankbaar voor deze week?', placeholder: 'Klein of groot, persoonlijk of professioneel...' },
]

interface ReflectieEntry {
  id: string
  week_start: string
  antwoorden: Record<string, string>
  aangemaakt_op: string
}

export default function ReflectiePage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [antwoorden, setAntwoorden] = useState<Record<string, string>>({})
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [eerdere, setEerdere] = useState<ReflectieEntry[]>([])
  const [toonHistorie, setToonHistorie] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const weekStart = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [{ data: huidig }, { data: historie }] = await Promise.all([
        supabase.from('reflectie_entries').select('antwoorden')
          .eq('user_id', user.id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('reflectie_entries').select('id, week_start, antwoorden, aangemaakt_op')
          .eq('user_id', user.id).order('week_start', { ascending: false }).limit(8),
      ])

      if (huidig?.antwoorden) setAntwoorden(huidig.antwoorden)
      setEerdere(historie ?? [])
      setLaden(false)
    }
    laad()
  }, [router, weekStart])

  async function slaOp() {
    if (!userId || Object.values(antwoorden).every(v => !v.trim())) return
    setOpslaan(true)

    await supabase.from('reflectie_entries').upsert({
      user_id: userId,
      week_start: weekStart,
      antwoorden,
    }, { onConflict: 'user_id,week_start' })

    setOpgeslagen(true)
    setOpslaan(false)

    // Lokale patch: werk de historie-lijst in-place bij i.p.v. een re-fetch,
    // zodat de huidige week meteen bovenaan verschijnt of wordt vervangen.
    setEerdere(prev => {
      const zonderHuidig = prev.filter(e => e.week_start !== weekStart)
      const bestaand = prev.find(e => e.week_start === weekStart)
      const bijgewerkt: ReflectieEntry = {
        id: bestaand?.id ?? `local-${weekStart}`,
        week_start: weekStart,
        antwoorden,
        aangemaakt_op: bestaand?.aangemaakt_op ?? new Date().toISOString(),
      }
      return [bijgewerkt, ...zonderHuidig].slice(0, 8)
    })

    setTimeout(() => {
      setOpgeslagen(false)
      router.push('/vandaag')
    }, 1500)
  }

  const weekLabel = new Date(weekStart).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
  const ingevuld = Object.values(antwoorden).filter(v => v.trim()).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 18%, transparent) 0%, transparent 70%)' }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>Wekelijkse reflectie</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Week van {weekLabel} · {ingevuld}/{REFLECTIE_VRAGEN.length} vragen beantwoord</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<History size={15} aria-hidden />}
            onClick={() => setToonHistorie(v => !v)}
          >
            {toonHistorie ? 'Huidige week' : `Historie (${eerdere.length})`}
          </Button>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="mf-spinner" /></div>
        ) : toonHistorie ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {eerdere.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>Nog geen eerdere reflecties</p>
            ) : eerdere.map(e => {
              const datum = new Date(e.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
              const aantalIngevuld = Object.values(e.antwoorden ?? {}).filter(v => v.trim()).length
              return (
                <Card key={e.id} style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Week van {datum}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{aantalIngevuld} van 6 vragen</p>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }} aria-hidden>
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < aantalIngevuld ? 'var(--mentaforce-primary)' : 'var(--border-strong)' }} />
                      ))}
                    </div>
                  </div>
                  {e.antwoorden?.hoogtepunt && (
                    <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '2px solid var(--mentaforce-primary)', paddingLeft: 10 }}>
                      &ldquo;{e.antwoorden.hoogtepunt.slice(0, 120)}{e.antwoorden.hoogtepunt.length > 120 ? '...' : ''}&rdquo;
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {REFLECTIE_VRAGEN.map((vraag, i) => {
              const isIngevuld = Boolean(antwoorden[vraag.id]?.trim())
              return (
                <Card key={vraag.id} style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: isIngevuld ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isIngevuld ? 'var(--mentaforce-primary)' : 'var(--text-3)', flexShrink: 0 }} aria-hidden>
                      {isIngevuld ? <Check size={14} aria-hidden /> : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Field label={vraag.vraag} htmlFor={`reflectie-${vraag.id}`}>
                        <Textarea
                          id={`reflectie-${vraag.id}`}
                          rows={3}
                          value={antwoorden[vraag.id] ?? ''}
                          onChange={e => setAntwoorden(prev => ({ ...prev, [vraag.id]: e.target.value }))}
                          placeholder={vraag.placeholder}
                        />
                      </Field>
                    </div>
                  </div>
                </Card>
              )
            })}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                onClick={slaOp}
                loading={opslaan}
                disabled={opslaan || Object.values(antwoorden).every(v => !v.trim())}
                leftIcon={opgeslagen ? <Check size={16} aria-hidden /> : undefined}
                style={{ flex: 1 }}
              >
                {opslaan ? 'Opslaan...' : opgeslagen ? 'Opgeslagen!' : 'Reflectie opslaan'}
              </Button>
              <Link
                href="/journal"
                className="mf-reflectie-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 22px',
                  borderRadius: 'var(--radius-btn)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-subtle)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <BookOpen size={16} aria-hidden />
                Naar journal
              </Link>
            </div>
            <style>{`
              .mf-reflectie-link:hover { opacity: 0.88; }
              .mf-reflectie-link:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>
          </div>
        )}
      </main>
    </div>
  )
}
