'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

type Gesprek = {
  id: string
  datum: string
  type: 'functionering' | 'beoordeling' | 'welzijn' | 'onboarding' | 'overig'
  onderwerp: string
  samenvatting_medewerker: string | null
  actiepunten: { tekst: string; gereed: boolean; deadline?: string }[]
  follow_up_datum: string | null
  status: 'gepland' | 'afgerond' | 'geannuleerd'
  hr_naam?: string
}

const TYPE_STIJL: Record<Gesprek['type'], { label: string; kleur: string; bg: string; emoji: string }> = {
  functionering: { label: 'Functionering', kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)', emoji: '📊' },
  beoordeling:   { label: 'Beoordeling',   kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', emoji: '⭐' },
  welzijn:       { label: 'Welzijn',       kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', emoji: '💚' },
  onboarding:    { label: 'Onboarding',    kleur: 'var(--mf-amber)', bg: 'var(--mf-amber-light)', emoji: '👋' },
  overig:        { label: 'Overig',        kleur: 'var(--text-2)', bg: 'var(--bg-subtle)', emoji: '💬' },
}

const STATUS_STIJL: Record<Gesprek['status'], { label: string; kleur: string; bg: string }> = {
  gepland:     { label: 'Gepland',     kleur: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
  afgerond:    { label: 'Afgerond',    kleur: 'var(--mf-green-dark)', bg: 'var(--mf-green-light)' },
  geannuleerd: { label: 'Geannuleerd', kleur: 'var(--text-3)', bg: 'var(--bg-subtle)' },
}

function formatDatum(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function DagenTot({ datum }: { datum: string }) {
  // Tijdstip per mount vastzetten zodat de render puur blijft
  const [nu] = useState(() => Date.now())
  const dagen = Math.ceil((new Date(datum).getTime() - nu) / 86400000)
  if (dagen < 0) return null
  if (dagen === 0) return <span style={{ color: 'var(--mf-red)', fontWeight: 700, fontSize: 11 }}>Vandaag</span>
  if (dagen <= 3) return <span style={{ color: 'var(--mf-amber)', fontWeight: 700, fontSize: 11 }}>{dagen}d</span>
  return <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{dagen} dagen</span>
}

export default function MijnGesprekkenPage() {
  const router = useRouter()
  const [gesprekken, setGesprekken] = useState<Gesprek[]>([])
  const [laden, setLaden] = useState(true)
  const [actief, setActief] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id').eq('id', user.id).single()
      if (!profiel?.bedrijf_id) { router.push('/home'); return }

      const { data } = await supabase
        .from('hr_gesprekken')
        .select('id, datum, type, onderwerp, samenvatting_medewerker, actiepunten, follow_up_datum, status, hr_user_id')
        .eq('medewerker_id', user.id)
        .order('datum', { ascending: false })

      if (data && data.length > 0) {
        const hrIds = [...new Set(data.map(g => g.hr_user_id))]
        const { data: hrProfielen } = await supabase
          .from('profiles').select('id, naam').in('id', hrIds)
        const hrNamen = new Map(hrProfielen?.map(p => [p.id, p.naam]) ?? [])

        setGesprekken(data.map(g => ({
          ...g,
          actiepunten: Array.isArray(g.actiepunten) ? g.actiepunten : [],
          hr_naam: hrNamen.get(g.hr_user_id) ?? 'HR',
        })))
      }
      setLaden(false)
    }
    laad()
  }, [router])

  const actief_gesprek = gesprekken.find(g => g.id === actief)
  const aankomend = gesprekken.filter(g => g.status === 'gepland')
  const afgerond = gesprekken.filter(g => g.status === 'afgerond')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app, #F9FAFB)' }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Mijn gesprekken
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Overzicht van je HR-gesprekken en actiepunten
          </p>
        </div>

        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="mf-spinner" />
          </div>
        ) : gesprekken.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                <GlowOrb color={[0.231, 0.510, 0.965]} intensity={0.4} size={80} />
              </div>
              <p style={{ fontSize: 32, position: 'relative', zIndex: 1 }}>💬</p>
            </div>
            <p style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Nog geen gesprekken gepland</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Je HR-manager kan hier 1-op-1 gesprekken inplannen.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Aankomende gesprekken */}
            {aankomend.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 10 }}>
                  Aankomend
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {aankomend.map(g => <GesprekKaart key={g.id} g={g} actief={actief === g.id} onClick={() => setActief(actief === g.id ? null : g.id)} />)}
                </div>
              </div>
            )}

            {/* Afgeronde gesprekken */}
            {afgerond.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 10 }}>
                  Afgerond
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {afgerond.map(g => <GesprekKaart key={g.id} g={g} actief={actief === g.id} onClick={() => setActief(actief === g.id ? null : g.id)} />)}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Detail panel */}
        {actief_gesprek && (
          <div style={{
            marginTop: 24, background: 'var(--bg-card)', borderRadius: 20,
            border: '1px solid var(--border)', padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{TYPE_STIJL[actief_gesprek.type].emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{actief_gesprek.onderwerp}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {formatDatum(actief_gesprek.datum)} · met {actief_gesprek.hr_naam}
                  </p>
                </div>
              </div>
              <button onClick={() => setActief(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Samenvatting */}
            {actief_gesprek.samenvatting_medewerker ? (
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>Samenvatting</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{actief_gesprek.samenvatting_medewerker}</p>
              </div>
            ) : (
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'var(--bg-subtle)', border: '1px dashed #E5E7EB' }}>
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Nog geen samenvatting beschikbaar</p>
              </div>
            )}

            {/* Actiepunten */}
            {actief_gesprek.actiepunten.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
                  Actiepunten ({actief_gesprek.actiepunten.filter(a => a.gereed).length}/{actief_gesprek.actiepunten.length} gereed)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {actief_gesprek.actiepunten.map((ap, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: ap.gereed ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                      border: `1px solid ${ap.gereed ? 'var(--mf-green-mid)' : 'var(--border)'}`,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: ap.gereed ? 'var(--mf-green)' : 'white',
                        border: `2px solid ${ap.gereed ? 'var(--mf-green)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ap.gereed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: ap.gereed ? 'var(--mf-green-dark)' : 'var(--text-2)', textDecoration: ap.gereed ? 'line-through' : 'none' }}>{ap.tekst}</p>
                        {ap.deadline && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Deadline: {formatDatum(ap.deadline)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up */}
            {actief_gesprek.follow_up_datum && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--mf-amber-light)', border: '1px solid #F3C98A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <p style={{ fontSize: 13, color: 'var(--mf-amber-dark)' }}>
                  Vervolggesprek gepland op <strong>{formatDatum(actief_gesprek.follow_up_datum)}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function GesprekKaart({ g, actief, onClick }: { g: Gesprek; actief: boolean; onClick: () => void }) {
  const type = TYPE_STIJL[g.type]
  const status = STATUS_STIJL[g.status]
  const openAp = g.actiepunten.filter(a => !a.gereed).length

  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: actief ? 'var(--mf-green-light)' : 'white',
      border: `1px solid ${actief ? 'var(--mf-green-mid)' : 'var(--border)'}`,
      borderRadius: 14, padding: '14px 16px',
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {type.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.onderwerp}</p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: type.bg, color: type.kleur, flexShrink: 0 }}>{type.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(g.datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · {g.hr_naam}</p>
              {openAp > 0 && <span style={{ fontSize: 11, color: 'var(--mf-amber)', fontWeight: 600 }}>{openAp} openstaand{openAp !== 1 ? 'e' : ''} actiepunt{openAp !== 1 ? 'en' : ''}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: status.bg, color: status.kleur }}>{status.label}</span>
          {g.status === 'gepland' && <DagenTot datum={g.datum} />}
        </div>
      </div>
    </button>
  )
}
