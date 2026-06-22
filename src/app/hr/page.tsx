'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { ALLE_TILES, DEFAULT_TILES, type TileId } from '@/lib/tiles'
import GesprekkenTab from '@/components/hr/GesprekkenTab'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

type HrTab = 'portaal' | 'gesprekken'

export default function HrDashboardPage() {
  const router = useRouter()
  const [naam, setNaam] = useState<string>('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [hrUserId, setHrUserId] = useState<string | null>(null)
  const [geladen, setGeladen] = useState(false)
  const [actieveTab, setActieveTab] = useState<HrTab>('portaal')
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [actief, setActief] = useState<Set<TileId>>(new Set(DEFAULT_TILES))
  const [volgorde, setVolgorde] = useState<TileId[]>(DEFAULT_TILES)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [stats, setStats] = useState({ medewerkers: 0, checkins: 0, gemScore: 0 })
  const [discVerplicht, setDiscVerplicht] = useState(false)
  const [discBezig, setDiscBezig] = useState(false)
  const [analytics, setAnalytics] = useState<{
    burnout_distributie?: { laag: number; matig: number; hoog: number }
    enps_score?: number | null
    enps_responses?: number
    werkgeluk_gemiddeld?: number | null
    psych_veiligheid_gemiddeld?: number | null
    top_burnout_factoren?: { factor: string; count: number }[]
    participatie_pct?: number
  } | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setNaam(profiel.naam ?? 'HR')
      setBedrijfId(profiel.bedrijf_id ?? null)
      setHrUserId(user.id)

      // Bedrijf instellingen
      if (profiel.bedrijf_id) {
        const { data: bedrijfData } = await supabase
          .from('bedrijven')
          .select('disc_verplicht')
          .eq('id', profiel.bedrijf_id)
          .single()
        if (bedrijfData) {
          setDiscVerplicht(bedrijfData.disc_verplicht ?? false)
        }
      }

      // Portaal config
      const { data: config } = await supabase
        .from('portaal_config').select('tiles').eq('bedrijf_id', profiel.bedrijf_id).single()
      if (config?.tiles && Array.isArray(config.tiles)) {
        const ids = config.tiles as TileId[]
        setVolgorde(ids); setActief(new Set(ids))
      }

      // Stats
      const { count: medCount } = await supabase
        .from('profiles').select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', profiel.bedrijf_id).eq('rol', 'medewerker')
      const { count: ciCount } = await supabase
        .from('checkins').select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', profiel.bedrijf_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      const { data: scores } = await supabase
        .from('checkins').select('energie, slaap, mentaal_focus, mentaal_balans, motivatie')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      const gemScore = scores?.length
        ? Math.round(scores.reduce((s, c) => s + (c.energie + c.slaap + c.mentaal_focus + c.mentaal_balans + c.motivatie) / 5, 0) / scores.length * 20)
        : 0
      setStats({ medewerkers: medCount ?? 0, checkins: ciCount ?? 0, gemScore })

      // Analytics (non-blocking)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res = await fetch('/api/hr/analytics', {
            headers: { authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const json = await res.json()
            setAnalytics(json)
          }
        }
      } catch { /* niet-kritiek */ }

      setGeladen(true)
    }
    laad()
  }, [router])

  function toggleTile(id: TileId) {
    setActief(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); setVolgorde(v => v.filter(t => t !== id)) }
      else { next.add(id); setVolgorde(v => [...v, id]) }
      return next
    })
    setOpgeslagen(false)
  }

  function onDragStart(idx: number) { setDragIdx(idx) }
  function onDragEnter(idx: number) { setOverIdx(idx) }
  function onDragEnd() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      setVolgorde(prev => {
        const next = [...prev]
        const [moved] = next.splice(dragIdx, 1)
        next.splice(overIdx, 0, moved)
        return next
      })
    }
    setDragIdx(null); setOverIdx(null); setOpgeslagen(false)
  }

  async function opslaan() {
    setBezig(true)
    await supabase.from('portaal_config').upsert(
      { bedrijf_id: bedrijfId, tiles: volgorde.filter(t => actief.has(t)), updated_at: new Date().toISOString() },
      { onConflict: 'bedrijf_id' }
    )
    setOpgeslagen(true); setBezig(false)
  }

  const actiefTiles = volgorde.filter(id => actief.has(id)).map(id => ALLE_TILES.find(t => t.id === id)).filter((t): t is typeof ALLE_TILES[number] => t !== undefined)
  const inactiefTiles = ALLE_TILES.filter(t => !actief.has(t.id))

  const ACCENT = 'var(--mf-green)'

  if (!geladen) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '32px 32px 48px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Goedendag, {naam.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
            Beheer het portaal en volg de vitaliteit van je team.
          </p>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {([['portaal', 'Portaal beheren'], ['gesprekken', 'HR Gesprekken']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActieveTab(tab)} style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600, border: 'none',
              background: 'transparent', cursor: 'pointer',
              borderBottom: `2px solid ${actieveTab === tab ? ACCENT : 'transparent'}`,
              color: actieveTab === tab ? ACCENT : 'var(--text-2)',
              transition: 'all 0.15s',
            }}>
              {tab === 'gesprekken' ? '💬 ' : '🏠 '}{label}
            </button>
          ))}
        </div>

        {/* ── GESPREKKEN TAB ── */}
        {actieveTab === 'gesprekken' && bedrijfId && hrUserId && (
          <GesprekkenTab bedrijfId={bedrijfId} hrUserId={hrUserId} />
        )}

        {actieveTab !== 'portaal' ? null : (<>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Medewerkers',    value: stats.medewerkers, icon: '👥', color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
            { label: 'Check-ins (7d)', value: stats.checkins,    icon: '✅', color: 'var(--mf-green)', bg: 'var(--mf-green-light)' },
            { label: 'Gem. vitaalscore', value: stats.gemScore ? `${stats.gemScore}/100` : '—', icon: '💚', color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', borderRadius: 12, padding: '18px 20px',
              border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease', cursor: 'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', background: `linear-gradient(135deg, ${s.color}cc, ${s.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── ANALYTICS SECTIE ── */}
        {analytics && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 12 }}>
              Team welzijn analyse (afgelopen 4 weken)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

              {/* Burn-out risico */}
              {analytics.burnout_distributie && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Burn-out risico</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Laag', count: analytics.burnout_distributie.laag, kleur: 'var(--mf-green)' },
                      { label: 'Matig', count: analytics.burnout_distributie.matig, kleur: 'var(--mf-amber)' },
                      { label: 'Hoog', count: analytics.burnout_distributie.hoog, kleur: 'var(--mf-red)' },
                    ].map(b => {
                      const totaal = analytics.burnout_distributie!.laag + analytics.burnout_distributie!.matig + analytics.burnout_distributie!.hoog
                      const pct = totaal > 0 ? Math.round((b.count / totaal) * 100) : 0
                      return (
                        <div key={b.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{b.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: b.kleur }}>{b.count} ({pct}%)</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 9999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 9999, background: b.kleur, width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* eNPS */}
              {analytics.enps_score !== null && analytics.enps_score !== undefined && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>eNPS score</p>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                      <GlowOrb color={analytics.enps_score >= 30 ? [0.114, 0.620, 0.459] : analytics.enps_score >= 0 ? [0.949, 0.722, 0.141] : [0.886, 0.294, 0.290]} intensity={0.4} size={80} />
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 800, color: analytics.enps_score >= 30 ? 'var(--mf-green)' : analytics.enps_score >= 0 ? 'var(--mf-amber)' : 'var(--mf-red)', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                      {analytics.enps_score > 0 ? '+' : ''}{analytics.enps_score}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{analytics.enps_responses} responses</p>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 6 }}>
                    {analytics.enps_score >= 30 ? 'Uitstekend!' : analytics.enps_score >= 0 ? 'Verbetering mogelijk' : 'Actie vereist'}
                  </p>
                </div>
              )}

              {/* Werkgeluk */}
              {analytics.werkgeluk_gemiddeld !== null && analytics.werkgeluk_gemiddeld !== undefined && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Werkgeluk</p>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                      <GlowOrb color={analytics.werkgeluk_gemiddeld >= 4 ? [0.114, 0.620, 0.459] : analytics.werkgeluk_gemiddeld >= 3 ? [0.949, 0.722, 0.141] : [0.886, 0.294, 0.290]} intensity={Math.max(0.25, analytics.werkgeluk_gemiddeld / 6)} size={80} />
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 800, color: analytics.werkgeluk_gemiddeld >= 4 ? 'var(--mf-green)' : analytics.werkgeluk_gemiddeld >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                      {analytics.werkgeluk_gemiddeld}/5
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gemiddeld team</p>
                </div>
              )}

              {/* Psych veiligheid */}
              {analytics.psych_veiligheid_gemiddeld !== null && analytics.psych_veiligheid_gemiddeld !== undefined && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Psych. veiligheid</p>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0, pointerEvents: 'none' }}>
                      <GlowOrb color={analytics.psych_veiligheid_gemiddeld >= 4 ? [0.114, 0.620, 0.459] : analytics.psych_veiligheid_gemiddeld >= 3 ? [0.949, 0.722, 0.141] : [0.886, 0.294, 0.290]} intensity={Math.max(0.25, analytics.psych_veiligheid_gemiddeld / 6)} size={80} />
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 800, color: analytics.psych_veiligheid_gemiddeld >= 4 ? 'var(--mf-green)' : analytics.psych_veiligheid_gemiddeld >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)', lineHeight: 1, position: 'relative', zIndex: 1 }}>
                      {analytics.psych_veiligheid_gemiddeld}/5
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Gemiddeld team</p>
                </div>
              )}

              {/* Top burnout factoren */}
              {analytics.top_burnout_factoren?.length ? (
                <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '16px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Top aandachtspunten</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analytics.top_burnout_factoren.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', minWidth: 16 }}>{i + 1}.</span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textTransform: 'capitalize' }}>{f.factor}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{f.count}×</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            </div>
          </div>
        )}

        {/* ── PORTAAL INRICHTEN ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* Left: tile configuratie */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Portaal inrichten</h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>Sleep tegels om volgorde te wijzigen</p>
              </div>
              <button
                onClick={opslaan} disabled={bezig}
                style={{
                  background: opgeslagen ? 'var(--mf-green-light)' : ACCENT, color: opgeslagen ? ACCENT : 'white',
                  border: 'none', borderRadius: 8, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: bezig ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseDown={e => !bezig && ((e.currentTarget as HTMLElement).style.transform = 'scale(0.97)')}
                onMouseUp={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
              >
                {bezig ? 'Opslaan...' : opgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
              </button>
            </div>

            {/* Actieve tegels */}
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
              Actief ({actiefTiles.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {actiefTiles.length === 0 && (
                <div style={{
                  background: 'var(--bg-card)', border: '2px dashed #E5E7EB', borderRadius: 14,
                  padding: '28px 20px', textAlign: 'center',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-4)' }}>
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Geen actieve tegels</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Schakel hieronder tegels in om ze te tonen in het portaal.</p>
                </div>
              )}
              {actiefTiles.map((tile, idx) => (
                <div key={tile.id} draggable
                  onDragStart={() => onDragStart(idx)} onDragEnter={() => onDragEnter(idx)}
                  onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: `1.5px solid ${overIdx === idx && dragIdx !== idx ? ACCENT : '#E5E7EB'}`,
                    boxShadow: dragIdx === idx ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                    cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1,
                    transform: overIdx === idx && dragIdx !== idx ? 'scale(1.01)' : 'scale(1)',
                    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                    <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                  </svg>
                  <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: tile.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{tile.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{tile.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tile.sublabel}</p>
                  </div>
                  <span style={{
                    minWidth: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: tile.kleur + '18', color: tile.kleur,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>{idx + 1}</span>
                  <button onClick={() => toggleTile(tile.id)} style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--mf-red-light)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mf-red)',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Uitgeschakeld */}
            {inactiefTiles.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
                  Uitgeschakeld ({inactiefTiles.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {inactiefTiles.map(tile => (
                    <div key={tile.id} style={{
                      background: 'var(--bg-subtle)', borderRadius: 10, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: '1px solid #F3F4F6', opacity: 0.7,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, filter: 'grayscale(1)' }}>{tile.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{tile.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{tile.sublabel}</p>
                      </div>
                      <button onClick={() => toggleTile(tile.id)} style={{
                        background: 'var(--bg-card)', border: `1.5px solid ${ACCENT}`,
                        color: ACCENT, borderRadius: 6, padding: '5px 12px',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}>Inschakelen</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: quick links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Snelle acties</h2>
            {[
              { href: '/hr/protocollen/nieuw', label: 'Nieuw protocol aanmaken', icon: '📋', color: 'var(--mf-amber-dark)', bg: 'var(--mf-amber-light)' },
              { href: '/hr/protocollen',       label: 'Protocollen beheren',     icon: '📂', color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
              { href: '/team',                 label: 'Team bekijken',           icon: '👥', color: 'var(--mf-blue)', bg: 'var(--mf-blue-light)' },
              { href: '/verlof',               label: 'Verlof beheren',          icon: '🌴', color: 'var(--mf-green-dark)', bg: 'var(--mf-green-light)' },
              { href: '/loonstroken',          label: 'Loonstroken uploaden',    icon: '💶', color: 'var(--mf-green-dark)', bg: 'var(--mf-green-light)' },
              { href: '/rapport',              label: 'Rapporten bekijken',      icon: '📈', color: 'var(--mf-purple)', bg: 'var(--mf-purple-light)' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px',
                border: '1px solid var(--border)', textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.1s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                onMouseDown={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.97)')}
                onMouseUp={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{item.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', flex: 1 }}>{item.label}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--text-4)' }} strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* ── INSTELLINGEN ── */}
        <div style={{ marginTop: 32, background: 'var(--bg-card)', borderRadius: 12, padding: '20px 24px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Instellingen</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 2 }}>DISC test verplicht voor alle medewerkers</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Medewerkers moeten de DISC-persoonlijkheidstest invullen voordat ze toegang krijgen tot het portaal.</p>
            </div>
            <button
              onClick={async () => {
                if (!bedrijfId || discBezig) return
                setDiscBezig(true)
                const nieuweWaarde = !discVerplicht
                const { error } = await supabase
                  .from('bedrijven')
                  .update({ disc_verplicht: nieuweWaarde })
                  .eq('id', bedrijfId)
                if (!error) setDiscVerplicht(nieuweWaarde)
                setDiscBezig(false)
              }}
              disabled={discBezig}
              style={{
                flexShrink: 0,
                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: discBezig ? 'default' : 'pointer',
                background: discVerplicht ? ACCENT : 'var(--border-strong)',
                position: 'relative', transition: 'background 0.2s',
                opacity: discBezig ? 0.6 : 1,
              }}
              aria-label="DISC test verplicht toggle"
            >
              <span style={{
                position: 'absolute', top: 3, left: discVerplicht ? 24 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-card)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        </>)}
      </main>
    </div>
  )
}
