'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Sparkle, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth/auth-fetch'
import { getActiviteit } from '@/lib/navigatie/activiteiten'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'

const ACT = getActiviteit('dankbaarheid')


interface DankbaarheidLog {
  id: string
  datum: string
  items: string[]
}

const PLACEHOLDERS = [
  'Een fijne samenwerking vandaag…',
  'Een moment waarvan ik genoot…',
  'Iets wat me energie gaf…',
  'Een kleine overwinning…',
  'Een persoon die me hielp…',
]

const SUGGESTIE_SETS = [
  [
    'Mijn gezondheid', 'Een gesprek met…', 'De rust van vandaag',
    'Een kleine overwinning', 'Mijn energie',
  ],
  [
    'Iemand die hielp', 'Lekker gegeten', 'Goed geslapen',
    'Een mooie wandeling', 'Tijd voor mezelf',
  ],
  [
    'Mijn team/collega\'s', 'Buiten zijn geweest', 'Iets geleerd',
    'Thuis en veiligheid', 'Een grapje of lach',
  ],
]

export default function DankbaarheidPagina() {
  const router = useRouter()
  const { toast } = useToast()
  const veldId = useId()
  const [logs, setLogs] = useState<DankbaarheidLog[]>([])
  const [items, setItems] = useState(['', '', ''])
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)
  const [activeFocus, setActiveFocus] = useState<number | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      try {
        const res = await authFetch('/api/dankbaarheid?limiet=14')
        if (res.ok) {
          const json = await res.json() as { logs: DankbaarheidLog[] }
          setLogs(json.logs ?? [])

          const vandaag = new Date().toISOString().split('T')[0]
          const vandaagLog = json.logs.find(l => l.datum === vandaag)
          if (vandaagLog) setItems([...vandaagLog.items, '', ''].slice(0, 3))
        } else {
          toast({ title: 'Laden mislukt', description: 'Je eerdere entries konden niet worden opgehaald.', variant: 'error' })
        }
      } catch {
        toast({ title: 'Geen verbinding', description: 'Je eerdere entries konden niet worden opgehaald.', variant: 'error' })
      }
      setLaden(false)
    }
    laad()
  }, [router, toast])

  async function slaOp() {
    const geldig = items.map(i => i.trim()).filter(Boolean)
    if (!geldig.length) return

    setOpslaan(true)
    try {
      const res = await authFetch('/api/dankbaarheid', {
        method: 'POST',
        body: JSON.stringify({ items: geldig }),
      })
      if (res.ok) {
        const json = await res.json() as { log: DankbaarheidLog }
        setLogs(prev => {
          const rest = prev.filter(l => l.datum !== json.log.datum)
          return [json.log, ...rest]
        })
        vitaEvent('habit_completed', { kind: 'dankbaarheid' })
        setSucces(true)
        setTimeout(() => {
          setSucces(false)
          router.push('/home')
        }, 1200)
      } else {
        toast({ title: 'Opslaan mislukt', description: 'Je dankbaarheid kon niet worden opgeslagen. Probeer het opnieuw.', variant: 'error' })
      }
    } catch {
      toast({ title: 'Opslaan mislukt', description: 'Je dankbaarheid kon niet worden opgeslagen. Controleer je verbinding.', variant: 'error' })
    }
    setOpslaan(false)
  }

  const vandaag = new Date().toISOString().split('T')[0]
  const heeftVandaag = logs.some(l => l.datum === vandaag)

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 800, margin: '0 auto' }}>

        <header style={{ marginBottom: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--mentaforce-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mentaforce-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ACT.label}</span>
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Dankbaarheidslogboek
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
            Drie dingen per dag. Een gewoonte uit de positieve psychologie.
          </p>
        </header>

        {/* 7-daagse streak strip */}
        {logs.length > 0 && (() => {
          const nu = new Date()
          const datumSet = new Set(logs.map(l => l.datum))
          const strip = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(nu)
            d.setDate(d.getDate() - (6 - i))
            const ds = d.toISOString().split('T')[0]
            return { ds, dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2), actief: datumSet.has(ds), isVandaag: ds === vandaag }
          })
          let streak = 0
          for (let i = 6; i >= 0; i--) {
            const d = new Date(nu); d.setDate(d.getDate() - i)
            if (datumSet.has(d.toISOString().split('T')[0])) streak++; else break
          }
          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                role="img"
                aria-label={`Dankbaarheid afgelopen 7 dagen: op ${strip.filter(s => s.actief).length} van de 7 dagen ingevuld`}
                style={{ flex: 1, display: 'flex', gap: 6 }}
              >
                {strip.map(({ ds, dag, actief, isVandaag }) => (
                  <div key={ds} aria-hidden="true" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: 28, borderRadius: 6,
                      background: actief ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      opacity: actief ? 0.85 : 0.5,
                      outline: isVandaag ? `2px solid ${actief ? 'var(--mf-green)' : 'var(--border-strong)'}` : 'none',
                      outlineOffset: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <Heart size={12} aria-hidden fill="var(--bg-app)" style={{ color: 'var(--bg-app)' }} />}
                    </div>
                    <span style={{ fontSize: 8, color: isVandaag ? 'var(--text-2)' : 'var(--text-4)', fontWeight: isVandaag ? 800 : 400, textTransform: 'capitalize' }}>{dag}</span>
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{streak}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>daagse<br />streak</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Dankbaarheid orb */}
        <div aria-hidden style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, var(--mf-green-light) 0%, transparent 70%)' }} />
        </div>

        {/* Invoer sectie */}
        <section style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: '20px',
          border: '1px solid var(--border)', marginBottom: 24,
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Heart size={20} aria-hidden style={{ color: 'var(--mf-green)' }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                {heeftVandaag ? 'Aanpassen' : 'Vandaag dankbaar voor…'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-4)' }}>
                {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {items.map((item, i) => {
            const inputId = `${veldId}-item-${i}`
            const suggestiesId = `${veldId}-suggesties-${i}`
            const toonSuggesties = activeFocus === i && !item
            return (
              <div
                key={i}
                style={{ marginBottom: 12 }}
                onFocus={() => setActiveFocus(i)}
                onBlur={e => {
                  // Suggesties blijven zichtbaar zolang de focus binnen dit item
                  // blijft (input óf chip), zodat ze met het toetsenbord bereikbaar zijn.
                  const naar = e.relatedTarget as Node | null
                  if (!naar || !e.currentTarget.contains(naar)) setActiveFocus(null)
                }}
              >
                <label htmlFor={inputId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-subtle)',
                  borderRadius: 12, padding: '10px 14px',
                  border: activeFocus === i ? '1.5px solid var(--mf-green)' : '1px solid var(--border)',
                  transition: 'border-color 0.15s var(--ease)',
                  cursor: 'text',
                }}>
                  <span aria-hidden style={{ fontSize: 14, color: 'var(--mf-green)', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span className="sr-only">Dankbaar voor, item {i + 1}</span>
                  <input
                    id={inputId}
                    type="text"
                    value={item}
                    onChange={e => setItems(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={PLACEHOLDERS[i % PLACEHOLDERS.length]}
                    maxLength={200}
                    aria-describedby={toonSuggesties ? suggestiesId : undefined}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 13, color: 'var(--text-1)',
                    }}
                    onKeyDown={e => e.key === 'Enter' && slaOp()}
                  />
                  {item && (
                    <button
                      type="button"
                      onClick={() => setItems(prev => prev.map((v, j) => j === i ? '' : v))}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, flexShrink: 0,
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0,
                      }}
                      aria-label="Wis veld"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  )}
                </label>
                {toonSuggesties && (
                  <div id={suggestiesId} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 4 }}>
                    {SUGGESTIE_SETS[i % SUGGESTIE_SETS.length].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        // preventDefault houdt de focus op het input tijdens een muisklik
                        // (Safari focust knoppen niet bij klikken); de actie zit in onClick.
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setItems(prev => prev.map((v, j) => j === i ? sug : v))}
                        style={{
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                          background: 'var(--mf-green-light)', color: 'var(--mf-green)',
                          border: '1px solid var(--border-strong)', cursor: 'pointer',
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={slaOp}
            disabled={opslaan || !items.some(i => i.trim())}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '12px', borderRadius: 12, marginTop: 6,
              background: succes
                ? 'var(--mf-green)'
                : 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)',
              color: 'var(--bg-app)', border: 'none',
              cursor: opslaan || !items.some(i => i.trim()) ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700,
              opacity: opslaan || !items.some(i => i.trim()) ? 0.6 : 1,
              transition: 'opacity 0.15s var(--ease)',
            }}
          >
            {succes ? <><Check size={16} aria-hidden /> Opgeslagen!</> : opslaan ? 'Opslaan…' : heeftVandaag ? 'Bijwerken' : 'Opslaan'}
          </button>
        </section>

        {/* Geschiedenis */}
        {logs.length > 0 && (
          <section>
            <h2 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', margin: '0 0 12px' }}>
              Recente entries ({logs.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map(log => (
                <article key={log.id} style={{
                  background: 'var(--bg-card)', borderRadius: 14, padding: '14px 16px',
                  border: log.datum === vandaag ? '1.5px solid var(--mf-green-mid)' : '1px solid var(--border)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginBottom: 8 }}>
                    {new Date(log.datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {log.datum === vandaag && (
                      <span style={{ marginLeft: 6, color: 'var(--mf-green)', fontWeight: 700 }}>vandaag</span>
                    )}
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {log.items.map((item, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Sparkle size={12} aria-hidden style={{ color: 'var(--mf-green)', flexShrink: 0, marginTop: 2 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
