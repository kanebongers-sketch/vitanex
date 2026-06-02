'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wicadprbktnzjnyexukl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY2FkcHJia3RuempueWV4dWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTAxNDYsImV4cCI6MjA5MzQ2NjE0Nn0.jWTb0y0DgNUXZC6X84Ppm4SSP8R1rAX0yqJsRPuVVZE'
)

/* ── Kleuren ── */
const FF      = '#F5A623'
const FF_DIM  = 'rgba(245,166,35,0.10)'
const FF_GLOW = '0 0 24px rgba(245,166,35,0.18)'
const DARK    = '#0c0c11'
const CARD    = '#131318'
const CARD2   = '#1a1a22'
const BORDER  = 'rgba(255,255,255,0.06)'
const TEXT    = 'rgba(255,255,255,0.88)'
const MUTED   = 'rgba(255,255,255,0.35)'
const GREEN   = '#22C55E'
const RED     = '#EF4444'

const STATUS_COLOR: Record<string, string> = {
  'Nieuw':             '#4B5563',
  'Verstuurd 1':       '#EAB308',
  'Verstuurd 2':       '#F59E0B',
  'Verstuurd 3':       '#F97316',
  'Verstuurd 4':       '#EF4444',
  'Verstuurd 5':       '#DC2626',
  'Gereageerd':        GREEN,
  'Niet interessant':  '#1F2937',
}

const RONDE_LABEL: Record<number, string> = {
  1: 'Eerste contact',
  2: 'Follow-up 1',
  3: 'Follow-up 2',
  4: 'Follow-up 3',
  5: 'Afsluitend',
}

type Bedrijf = { naam: string; email: string; stad: string; sector: string; status: string; ronde: number; datum_laatste: string; volgende_actie: string }
type DagStat = { datum: string; verstuurd: number; followup: number }

export default function AgentPage() {
  const [bedrijven,  setBedrijven]  = useState<Bedrijf[]>([])
  const [dagStats,   setDagStats]   = useState<DagStat[]>([])
  const [geladen,    setGeladen]    = useState(false)
  const [tab,        setTab]        = useState<'campagne' | 'bedrijven' | 'planning'>('campagne')
  const [zoek,       setZoek]       = useState('')
  const [nu,         setNu]         = useState(new Date())

  const laad = useCallback(async () => {
    const [{ data: b }, { data: d }] = await Promise.all([
      supabase.from('agent_bedrijven').select('*').order('aangemaakt_op', { ascending: false }),
      supabase.from('agent_dag_stats').select('*').order('datum', { ascending: false }).limit(14),
    ])
    setBedrijven((b ?? []) as Bedrijf[])
    setDagStats((d ?? []) as DagStat[])
    setGeladen(true)
    setNu(new Date())
  }, [])

  useEffect(() => { laad() }, [laad])
  useEffect(() => {
    const t = setInterval(laad, 30_000)
    return () => clearInterval(t)
  }, [laad])

  /* Statistieken */
  const totaal     = bedrijven.length
  const perStatus  = bedrijven.reduce<Record<string, number>>((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc }, {})
  const vandaag    = nu.toLocaleDateString('nl-NL')
  const vandaagStat = dagStats.find(d => d.datum === vandaag)
  const vandaagVerstuurd = vandaagStat?.verstuurd ?? 0
  const dagDoel    = 10
  const dagPct     = Math.min(100, Math.round((vandaagVerstuurd / dagDoel) * 100))

  /* Funnel */
  const funnel = [
    { label: 'Totaal bedrijven',  val: totaal,                               color: '#6B7280' },
    { label: 'Ronde 1 verstuurd', val: perStatus['Verstuurd 1'] ?? 0,        color: '#EAB308' },
    { label: 'Ronde 2 verstuurd', val: perStatus['Verstuurd 2'] ?? 0,        color: '#F59E0B' },
    { label: 'Ronde 3 verstuurd', val: perStatus['Verstuurd 3'] ?? 0,        color: '#F97316' },
    { label: 'Ronde 4 verstuurd', val: perStatus['Verstuurd 4'] ?? 0,        color: RED },
    { label: 'Ronde 5 verstuurd', val: perStatus['Verstuurd 5'] ?? 0,        color: '#DC2626' },
    { label: 'Gereageerd',        val: perStatus['Gereageerd']  ?? 0,        color: GREEN },
  ]

  /* Bedrijven filter */
  const gefilterd = bedrijven.filter(b =>
    !zoek || [b.naam, b.email, b.stad, b.sector].some(s => s?.toLowerCase().includes(zoek.toLowerCase()))
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: TEXT, fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ height: 58, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, background: DARK, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${FF}, #e08800)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: FF_GLOW }}>🤖</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1, color: 'white' }}>Fit Factory Outreach Agent</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>15 km rond Eersel · Nederland · max 10 emails/dag</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: MUTED }}>Live · {nu.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={laad} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 7, color: MUTED, fontSize: 12, padding: '6px 14px', cursor: 'pointer' }}>↻</button>
        </div>
      </header>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 72px' }}>

        {/* ── DAG BANNER ── */}
        <div style={{ background: `linear-gradient(135deg, #1c1400, #141400)`, border: `1px solid rgba(245,166,35,0.22)`, borderRadius: 18, padding: '26px 32px', marginBottom: 26, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: 'rgba(245,166,35,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Vandaag · {vandaag}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: FF, lineHeight: 1 }}>{vandaagVerstuurd}</span>
              <span style={{ fontSize: 22, color: 'rgba(245,166,35,0.4)' }}>/ {dagDoel}</span>
              <span style={{ fontSize: 14, color: MUTED }}>emails</span>
            </div>
            <div style={{ height: 7, background: 'rgba(245,166,35,0.12)', borderRadius: 4, overflow: 'hidden', maxWidth: 280, marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${dagPct}%`, background: `linear-gradient(90deg, ${FF}, #ff9500)`, borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: dagPct > 0 ? '0 0 10px rgba(245,166,35,0.5)' : 'none' }} />
            </div>
            <p style={{ fontSize: 13, color: dagPct >= 100 ? GREEN : MUTED }}>
              {dagPct >= 100 ? '✓ Dagdoel bereikt!' : `Nog ${dagDoel - vandaagVerstuurd} te sturen`}
            </p>
          </div>

          {/* Commando instructies */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 10, fontWeight: 600 }}>Terminal · Versturen (vraagt bevestiging)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[1,2,3,4,5].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: STATUS_COLOR[`Verstuurd ${r}`], background: `${STATUS_COLOR[`Verstuurd ${r}`]}15`, borderRadius: 4, padding: '1px 6px', fontWeight: 700, minWidth: 54, textAlign: 'center' }}>Ronde {r}</span>
                  <code style={{ fontSize: 12, color: '#86EFAC', fontFamily: 'monospace' }}>python main.py verstuur {r}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Totaal',       val: totaal,                          color: TEXT,   sub: 'In database' },
            { label: 'Nieuw',        val: perStatus['Nieuw'] ?? 0,         color: '#93C5FD', sub: 'Ronde 1 klaar' },
            { label: 'Actief',       val: [1,2,3,4].reduce((s,r)=>s+(perStatus[`Verstuurd ${r}`]??0),0), color: FF, sub: 'In campagne' },
            { label: 'Afgerond',     val: perStatus['Verstuurd 5'] ?? 0,   color: '#F87171', sub: 'Ronde 5 gehad' },
            { label: 'Gereageerd',   val: perStatus['Gereageerd'] ?? 0,    color: GREEN, sub: '🎯 Conversie' },
            { label: 'Niet interes.',val: perStatus['Niet interessant']??0, color: '#374151', sub: 'Uitgesloten' },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginTop: 5 }}>{s.label}</p>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

          {/* ── LINKER KOLOM: Funnel + Planning ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Funnel */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Campagne funnel</p>
              {funnel.map((row, i) => {
                const p = totaal > 0 ? (row.val / totaal) * 100 : 0
                const breedte = i === 0 ? 100 : Math.max(4, p)
                return (
                  <div key={row.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: TEXT }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.val}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${breedte}%`, background: row.color, borderRadius: 3, opacity: 0.85, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Week activiteit */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px 24px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Activiteit (14 dagen)</p>
              {dagStats.length === 0 ? (
                <p style={{ fontSize: 13, color: MUTED }}>Nog geen activiteit geregistreerd.</p>
              ) : (
                <div>
                  {/* Bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginBottom: 8 }}>
                    {[...dagStats].reverse().map((d, i) => {
                      const hoogte = Math.max(4, Math.round((d.verstuurd / dagDoel) * 60))
                      return (
                        <div key={i} title={`${d.datum}: ${d.verstuurd} emails`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ width: '100%', height: hoogte, background: d.verstuurd >= dagDoel ? GREEN : FF, borderRadius: '3px 3px 0 0', opacity: 0.8, transition: 'height 0.5s' }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {dagStats.slice(0, 5).map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: MUTED }}>{d.datum}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Chip color='#4B5563'>{d.verstuurd} emails</Chip>
                          {d.followup > 0 && <Chip color={FF}>{d.followup} follow-up</Chip>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RECHTER KOLOM: Tabs ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              {([
                { id: 'campagne',  label: 'Rondes' },
                { id: 'bedrijven', label: `Bedrijven (${totaal})` },
                { id: 'planning',  label: 'Planning' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '13px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? FF : MUTED, borderBottom: tab === t.id ? `2px solid ${FF}` : '2px solid transparent', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>

              {/* RONDES TAB */}
              {tab === 'campagne' && (
                <div>
                  {!geladen ? <Loader /> : totaal === 0 ? <EmptyState /> : (
                    <>
                      {[1,2,3,4,5].map(r => {
                        const sleutel = r === 1 ? 'Nieuw' : `Verstuurd ${r-1}`
                        const klaar    = perStatus[sleutel] ?? 0
                        const gedaan   = perStatus[`Verstuurd ${r}`] ?? 0
                        const pct      = totaal > 0 ? Math.round((gedaan / totaal) * 100) : 0
                        return (
                          <div key={r} style={{ background: CARD2, border: `1px solid ${klaar > 0 ? 'rgba(245,166,35,0.2)' : BORDER}`, borderRadius: 12, padding: '16px 18px', marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Ronde {r}</span>
                                  <span style={{ fontSize: 11, color: MUTED }}>{RONDE_LABEL[r]}</span>
                                </div>
                                <p style={{ fontSize: 11, color: MUTED }}>
                                  {r === 1 ? 'Introduceer Fit Factory Personal Training' :
                                   r === 2 ? 'App als stok achter de deur' :
                                   r === 3 ? 'HR-dashboard & meetbare resultaten' :
                                   r === 4 ? 'Directe vraag: is er iemand anders?' :
                                            'Vriendelijk afsluitend bericht'}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {klaar > 0 && <Chip color={FF}>{klaar} klaar</Chip>}
                                {gedaan > 0 && <Chip color='#4B5563'>{gedaan} gedaan</Chip>}
                              </div>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: STATUS_COLOR[`Verstuurd ${r}`] ?? FF, borderRadius: 2, transition: 'width 0.6s' }} />
                            </div>
                            {klaar > 0 && (
                              <p style={{ fontSize: 11, color: FF, marginTop: 8 }}>
                                → <code style={{ fontFamily: 'monospace' }}>python main.py preview {r}</code> · dan <code style={{ fontFamily: 'monospace' }}>python main.py verstuur {r}</code>
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* BEDRIJVEN TAB */}
              {tab === 'bedrijven' && (
                <div>
                  <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek bedrijf, email, stad of sector..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 14px', color: 'white', fontSize: 13, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }} />
                  {gefilterd.length === 0 ? (
                    <p style={{ textAlign: 'center', color: MUTED, padding: '32px 0', fontSize: 13 }}>Geen resultaten</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>{['Bedrijf', 'Stad', 'Status', 'Volgende'].map(h => (
                          <th key={h} style={{ padding: '0 8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: MUTED }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {gefilterd.map((b, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                            <td style={{ padding: '9px 8px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{b.naam}</td>
                            <td style={{ padding: '9px 8px', color: MUTED }}>{b.stad}</td>
                            <td style={{ padding: '9px 8px' }}>
                              <span style={{ background: `${STATUS_COLOR[b.status]??'#374151'}18`, color: STATUS_COLOR[b.status]??'#9CA3AF', borderRadius: 4, padding: '2px 8px', fontSize: 10 }}>{b.status}</span>
                            </td>
                            <td style={{ padding: '9px 8px', color: MUTED, fontSize: 11 }}>{b.volgende_actie || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* PLANNING TAB */}
              {tab === 'planning' && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 16 }}>Dagelijkse workflow</p>
                  {[
                    { dag: 'Dag 1, 3, 5…', actie: 'Nieuwe bedrijven benaderen (ronde 1)', kleur: '#93C5FD', cmd: 'python main.py verstuur 1' },
                    { dag: 'Dag 2, 4, 6…', actie: 'Follow-up sturen (ronde 2+)', kleur: FF, cmd: 'python main.py verstuur 2' },
                    { dag: 'Elke dag',     actie: 'Max 10 emails · dashboard op mentaforce.nl/agent', kleur: GREEN, cmd: '' },
                  ].map((r, i) => (
                    <div key={i} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Chip color={r.kleur}>{r.dag}</Chip>
                      </div>
                      <p style={{ fontSize: 13, color: TEXT, marginBottom: r.cmd ? 8 : 0 }}>{r.actie}</p>
                      {r.cmd && <code style={{ fontSize: 11, color: '#86EFAC', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 5, display: 'inline-block' }}>{r.cmd}</code>}
                    </div>
                  ))}

                  <div style={{ marginTop: 20, background: FF_DIM, border: `1px solid rgba(245,166,35,0.2)`, borderRadius: 10, padding: '16px 18px' }}>
                    <p style={{ fontSize: 12, color: FF, fontWeight: 600, marginBottom: 8 }}>Pipeline opbouwen (eenmalig of bij uitbreiding)</p>
                    {[
                      'python main.py zoek      # zoek bedrijven 15km rond Eersel',
                      'python main.py scrape     # haal emails op',
                      'python main.py filter     # verwijder bestaande partners',
                      'python main.py crm        # laad in Excel + Supabase',
                    ].map((cmd, i) => (
                      <p key={i} style={{ fontSize: 11, color: '#86EFAC', fontFamily: 'monospace', marginBottom: 4 }}>{cmd}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>
    </div>
  )
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ background: `${color}18`, color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{children}</span>
}

function Loader() {
  return <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(245,166,35,0.5)', fontSize: 13 }}>Laden…</div>
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Nog geen data</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
        Start de agent lokaal:<br />
        <code style={{ color: '#86EFAC', fontFamily: 'monospace' }}>python main.py alles</code>
      </p>
    </div>
  )
}
