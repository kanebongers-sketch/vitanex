'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wicadprbktnzjnyexukl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY2FkcHJia3RuempueWV4dWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTAxNDYsImV4cCI6MjA5MzQ2NjE0Nn0.jWTb0y0DgNUXZC6X84Ppm4SSP8R1rAX0yqJsRPuVVZE'
)

const FF     = '#F5A623'
const DARK   = '#0c0c11'
const CARD   = '#131318'
const CARD2  = '#1a1a22'
const BORDER = 'rgba(255,255,255,0.06)'
const TEXT   = 'rgba(255,255,255,0.88)'
const MUTED  = 'rgba(255,255,255,0.35)'
const GREEN  = '#22C55E'
const RED    = '#EF4444'

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  wacht:             { bg: '#1e293b', text: '#94A3B8', label: '⏳ Wacht' },
  goedgekeurd:       { bg: '#14532d', text: GREEN,     label: '✅ Goedgekeurd' },
  overgeslagen:      { bg: '#1c1917', text: '#6B7280', label: '❌ Overgeslagen' },
  mail_preview:      { bg: '#1e1a2e', text: '#818CF8', label: '📧 Email klaar' },
  mail_goedgekeurd:  { bg: '#064e3b', text: '#6EE7B7', label: '✅ Email goed' },
  mail_overgeslagen: { bg: '#1c1917', text: '#6B7280', label: '❌ Email skip' },
  mail_verstuurd:    { bg: '#1a2e1a', text: GREEN,     label: '📤 Verstuurd' },
}

type Goedkeuring = {
  id: string; datum: string; naam: string; email: string
  stad: string; sector: string; score: number; status: string
  onderwerp?: string; email_body?: string
}
type Bedrijf = { naam: string; email: string; stad: string; sector: string; status: string; ronde: number }
type DagStat = { datum: string; verstuurd: number; followup: number }

export default function AgentPage() {
  const [goedkeuringen, setGoedkeuringen] = useState<Goedkeuring[]>([])
  const [bedrijven, setBedrijven]         = useState<Bedrijf[]>([])
  const [dagStats, setDagStats]           = useState<DagStat[]>([])
  const [geladen, setGeladen]             = useState(false)
  const [tab, setTab]                     = useState<'vandaag' | 'campagne' | 'bedrijven'>('vandaag')
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [zoek, setZoek]                   = useState('')

  const laad = useCallback(async () => {
    const vandaag = new Date().toISOString().split('T')[0]
    const [{ data: g }, { data: b }, { data: d }] = await Promise.all([
      supabase.from('agent_goedkeuring').select('*').eq('datum', vandaag).order('score', { ascending: false }),
      supabase.from('agent_bedrijven').select('*').order('score', { ascending: false }).limit(200),
      supabase.from('agent_dag_stats').select('*').order('datum', { ascending: false }).limit(14),
    ])
    setGoedkeuringen((g ?? []) as Goedkeuring[])
    setBedrijven((b ?? []) as Bedrijf[])
    setDagStats((d ?? []) as DagStat[])
    setGeladen(true)
  }, [])

  useEffect(() => { laad() }, [laad])
  useEffect(() => {
    const t = setInterval(laad, 15_000) // Elke 15s refreshen
    return () => clearInterval(t)
  }, [laad])

  const vandaag    = new Date().toLocaleDateString('nl-NL')
  const totaal_b   = bedrijven.length
  const perStatus  = bedrijven.reduce<Record<string, number>>((a, b) => { a[b.status] = (a[b.status] ?? 0) + 1; return a }, {})

  // Vandaag stats
  const wacht       = goedkeuringen.filter(g => g.status === 'wacht').length
  const goed        = goedkeuringen.filter(g => g.status === 'goedgekeurd').length
  const skip        = goedkeuringen.filter(g => g.status === 'overgeslagen').length
  const mail_klaar  = goedkeuringen.filter(g => g.status === 'mail_goedgekeurd').length
  const verstuurd   = goedkeuringen.filter(g => g.status === 'mail_verstuurd').length
  const totaal_dag  = goedkeuringen.length

  // Flow stap
  const flowStap = totaal_dag === 0 ? 'leeg'
    : wacht > 0 ? 'beoordelen'
    : goed > 0 && goedkeuringen.some(g => g.status === 'mail_preview') ? 'emails_beoordelen'
    : mail_klaar > 0 ? 'versturen'
    : verstuurd > 0 ? 'klaar'
    : 'leeg'

  const gefilterd = bedrijven.filter(b =>
    !zoek || [b.naam, b.email, b.stad, b.sector].some(s => s?.toLowerCase().includes(zoek.toLowerCase()))
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK, color: TEXT, fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* HEADER */}
      <header style={{ height: 56, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, background: DARK, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'white', lineHeight: 1 }}>Fit Factory Agent</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>15km rond Eersel · Max 10/dag · Goedkeuring via Telegram</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: '0 0 6px #22C55E' }} />
          <span style={{ fontSize: 11, color: MUTED }}>Live · auto-refresh</span>
          <button onClick={laad} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, fontSize: 12, padding: '5px 12px', cursor: 'pointer' }}>↻</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* DAGELIJKSE FLOW BANNER */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '22px 26px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Vandaag · {vandaag}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>
                {flowStap === 'leeg'            && '📭 Agent nog niet gestart vandaag'}
                {flowStap === 'beoordelen'       && `⏳ ${wacht} van ${totaal_dag} bedrijven wachten op jouw beoordeling`}
                {flowStap === 'emails_beoordelen'&& `📧 ${goedkeuringen.filter(g=>g.status==='mail_preview').length} preview emails wachten op goedkeuring`}
                {flowStap === 'versturen'        && `🚀 ${mail_klaar} emails klaar om te versturen`}
                {flowStap === 'klaar'            && `✅ ${verstuurd} emails verstuurd vandaag!`}
              </p>
            </div>
            <div style={{ background: flowStap === 'klaar' ? '#14532d' : flowStap === 'leeg' ? CARD2 : '#1c1a0a', border: `1px solid ${flowStap === 'klaar' ? '#22c55e30' : flowStap === 'leeg' ? BORDER : 'rgba(245,166,35,0.3)'}`, borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: flowStap === 'klaar' ? GREEN : FF, lineHeight: 1 }}>{verstuurd}</p>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>verstuurd</p>
            </div>
          </div>

          {/* Flow stappen */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { stap: 1, label: 'Agent draait', klaar: totaal_dag > 0 },
              { stap: 2, label: '10 bedrijven kiezen', klaar: wacht === 0 && totaal_dag > 0 },
              { stap: 3, label: 'Emails beoordelen', klaar: goedkeuringen.every(g => !['mail_preview'].includes(g.status)) && goedkeuringen.some(g => ['mail_goedgekeurd','mail_verstuurd'].includes(g.status)) },
              { stap: 4, label: 'Versturen', klaar: verstuurd > 0 },
            ].map(({ stap, label, klaar }) => (
              <div key={stap} style={{ flex: 1, background: klaar ? '#14532d' : CARD2, border: `1px solid ${klaar ? '#22c55e30' : BORDER}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: klaar ? GREEN : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: klaar ? '#000' : MUTED, flexShrink: 0 }}>
                  {klaar ? '✓' : stap}
                </span>
                <span style={{ fontSize: 11, color: klaar ? GREEN : MUTED }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Verstuur instructie */}
          {flowStap === 'versturen' && (
            <div style={{ marginTop: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>🚀 Klaar om te versturen</p>
              <p style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>Open terminal en typ: <code style={{ color: '#86EFAC', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>python main.py verstuur_goedgekeurd</code></p>
            </div>
          )}
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
          {[
            { label: 'Totaal in CRM',  val: totaal_b,                           color: TEXT,    icon: '🏢' },
            { label: 'Nieuw',          val: perStatus['Nieuw'] ?? 0,            color: '#93C5FD', icon: '🆕' },
            { label: 'In campagne',    val: [1,2,3,4].reduce((s,r)=>s+(perStatus[`Verstuurd ${r}`]??0),0), color: FF, icon: '📤' },
            { label: 'Gereageerd',     val: perStatus['Gereageerd'] ?? 0,       color: GREEN,   icon: '🎯' },
            { label: 'Vandaag goed',   val: goed,                               color: FF,      icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
              </div>
              <p style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
            {([
              { id: 'vandaag',   label: `Vandaag (${totaal_dag})` },
              { id: 'campagne',  label: 'Campagne' },
              { id: 'bedrijven', label: `Database (${totaal_b})` },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? FF : MUTED, borderBottom: tab === t.id ? `2px solid ${FF}` : '2px solid transparent', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 22, maxHeight: 560, overflowY: 'auto' }}>

            {/* VANDAAG TAB */}
            {tab === 'vandaag' && (
              <div>
                {!geladen ? <p style={{ color: MUTED }}>Laden...</p>
                : goedkeuringen.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>📱</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 8 }}>Wacht op de ochtend selectie</p>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>Elke werkdag om 08:00 stuurt de agent je<br />10 kansrijke bedrijven via <strong style={{ color: FF }}>Telegram</strong>.</p>
                    <div style={{ marginTop: 20, background: CARD2, borderRadius: 10, padding: '14px 18px', display: 'inline-block', textAlign: 'left' }}>
                      <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Of start handmatig:</p>
                      <code style={{ fontSize: 12, color: '#86EFAC', fontFamily: 'monospace' }}>python main.py ochtend</code>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Wacht', val: wacht, color: '#94A3B8' },
                        { label: 'Goedgekeurd', val: goed, color: GREEN },
                        { label: 'Overgeslagen', val: skip, color: '#6B7280' },
                        { label: 'Email klaar', val: mail_klaar, color: '#6EE7B7' },
                        { label: 'Verstuurd', val: verstuurd, color: FF },
                      ].map(s => (
                        <div key={s.label} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</span>
                          <span style={{ fontSize: 11, color: MUTED }}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {goedkeuringen.map(g => {
                      const st = STATUS_COLOR[g.status] ?? STATUS_COLOR['wacht']
                      const isExpanded = expandedEmail === g.id
                      return (
                        <div key={g.id} style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{g.naam}</p>
                                <span style={{ background: `${st.bg}`, color: st.text, borderRadius: 5, padding: '2px 8px', fontSize: 10 }}>{st.label}</span>
                                <span style={{ background: 'rgba(245,166,35,0.1)', color: FF, borderRadius: 5, padding: '2px 7px', fontSize: 10 }}>{g.score}pts</span>
                              </div>
                              <p style={{ fontSize: 11, color: MUTED }}>{g.email} · {g.stad} · {g.sector}</p>
                              {g.onderwerp && <p style={{ fontSize: 11, color: '#818CF8', marginTop: 4 }}>✉️ {g.onderwerp}</p>}
                            </div>
                            {g.email_body && (
                              <button onClick={() => setExpandedEmail(isExpanded ? null : g.id)} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, fontSize: 11, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}>
                                {isExpanded ? '▲ Sluit' : '▼ Email'}
                              </button>
                            )}
                          </div>
                          {isExpanded && g.email_body && (
                            <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${FF}` }}>
                              <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.7 }}>{g.email_body}</pre>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CAMPAGNE TAB */}
            {tab === 'campagne' && (
              <div>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Funnel</p>
                {[
                  { label: 'Totaal in database', val: totaal_b, color: '#4B5563' },
                  { label: 'Ronde 1', val: perStatus['Verstuurd 1'] ?? 0, color: '#EAB308' },
                  { label: 'Ronde 2', val: perStatus['Verstuurd 2'] ?? 0, color: '#F59E0B' },
                  { label: 'Ronde 3', val: perStatus['Verstuurd 3'] ?? 0, color: '#F97316' },
                  { label: 'Ronde 4', val: perStatus['Verstuurd 4'] ?? 0, color: RED },
                  { label: 'Ronde 5', val: perStatus['Verstuurd 5'] ?? 0, color: '#DC2626' },
                  { label: 'Gereageerd', val: perStatus['Gereageerd'] ?? 0, color: GREEN },
                ].map(row => {
                  const p = totaal_b > 0 ? (row.val / totaal_b) * 100 : 0
                  return (
                    <div key={row.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: TEXT }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.val}</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.max(p, row.val > 0 ? 2 : 0)}%`, background: row.color, borderRadius: 3, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  )
                })}

                {dagStats.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ fontSize: 12, color: MUTED, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activiteit</p>
                    {dagStats.slice(0, 7).map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', fontSize: 12 }}>
                        <span style={{ color: MUTED }}>{d.datum}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Chip color='#4B5563'>{d.verstuurd} emails</Chip>
                          {d.followup > 0 && <Chip color={FF}>{d.followup} follow-up</Chip>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 20, background: CARD2, borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 12, color: FF, fontWeight: 600, marginBottom: 8 }}>Dagelijkse flow</p>
                  <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.8 }}>
                    08:00 → Agent selecteert top 10<br />
                    Telegram → Jij keurt goed/af<br />
                    Agent → Genereert preview emails<br />
                    Telegram → Jij keurt emails goed<br />
                    Terminal → <code style={{ color: '#86EFAC', fontFamily: 'monospace' }}>python main.py verstuur_goedgekeurd</code>
                  </p>
                </div>
              </div>
            )}

            {/* BEDRIJVEN TAB */}
            {tab === 'bedrijven' && (
              <div>
                <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek bedrijf, email, stad of sector..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 14px', color: 'white', fontSize: 13, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }} />
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Bedrijf', 'Stad', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0 8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: MUTED }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {gefilterd.slice(0, 100).map((b, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 8px', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.naam}</td>
                        <td style={{ padding: '8px 8px', color: MUTED }}>{b.stad}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ color: FF, fontWeight: 600 }}>{(b as any).score ?? 0}</span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ background: `${STATUS_COLOR[b.status]?.bg ?? '#1c1917'}`, color: STATUS_COLOR[b.status]?.text ?? MUTED, borderRadius: 4, padding: '2px 8px', fontSize: 10 }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {gefilterd.length > 100 && <p style={{ textAlign: 'center', color: MUTED, fontSize: 12, marginTop: 12 }}>Toont 100 van {gefilterd.length} resultaten</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        code { font-family: monospace; }
      `}</style>
    </div>
  )
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ background: `${color}18`, color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{children}</span>
}
