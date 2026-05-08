'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/HrShell'
import { ALLE_TILES, DEFAULT_TILES, type TileId } from '@/lib/tiles'

export default function HrDashboardPage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [bedrijfNaam, setBedrijfNaam] = useState('MentaForce')
  const [bedrijfId, setBedrijfId] = useState('')
  const [geladen, setGeladen] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [actief, setActief] = useState<Set<TileId>>(new Set(DEFAULT_TILES))
  const [volgorde, setVolgorde] = useState<TileId[]>(DEFAULT_TILES)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [stats, setStats] = useState({ medewerkers: 0, checkins: 0, gemScore: 0 })

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
      setBedrijfId(profiel.bedrijf_id)

      // Bedrijfsnaam ophalen
      const { data: bedrijf } = await supabase
        .from('bedrijven').select('naam').eq('id', profiel.bedrijf_id).single()
      if (bedrijf?.naam) setBedrijfNaam(bedrijf.naam)

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

  const actiefTiles = volgorde.filter(id => actief.has(id)).map(id => ALLE_TILES.find(t => t.id === id)!).filter(Boolean)
  const inactiefTiles = ALLE_TILES.filter(t => !actief.has(t.id))

  if (!geladen) return (
    <HrShell naam={naam} bedrijfNaam={bedrijfNaam}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div className="mf-spinner" />
      </div>
    </HrShell>
  )

  const ACCENT = '#1D9E75'

  return (
    <HrShell naam={naam} bedrijfNaam={bedrijfNaam}>

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Goedendag, {naam.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          Beheer het portaal en volg de vitaliteit van je team.
        </p>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Medewerkers', value: stats.medewerkers, icon: '👥', color: '#185FA5', bg: '#EFF6FF' },
          { label: 'Check-ins (7d)', value: stats.checkins, icon: '✅', color: '#1D9E75', bg: '#E1F5EE' },
          { label: 'Gem. vitaalscore', value: stats.gemScore ? `${stats.gemScore}/100` : '—', icon: '💚', color: '#7C3AED', bg: '#EDE9FE' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 12, padding: '18px 20px',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── PORTAAL INRICHTEN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left: tile configuratie */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Portaal inrichten</h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
                Sleep tegels om volgorde te wijzigen
              </p>
            </div>
            <button
              onClick={opslaan} disabled={bezig}
              style={{
                background: opgeslagen ? '#E1F5EE' : ACCENT, color: opgeslagen ? ACCENT : 'white',
                border: 'none', borderRadius: 8, padding: '8px 18px',
                fontSize: 13, fontWeight: 600, cursor: bezig ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {bezig ? 'Opslaan...' : opgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
            </button>
          </div>

          {/* Actieve tegels */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
            Actief ({actiefTiles.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {actiefTiles.length === 0 && (
              <div style={{
                background: 'white', border: '2px dashed #E5E7EB', borderRadius: 10,
                padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13,
              }}>Geen actieve tegels</div>
            )}
            {actiefTiles.map((tile, idx) => (
              <div key={tile.id} draggable
                onDragStart={() => onDragStart(idx)} onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                style={{
                  background: 'white', borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  border: `1.5px solid ${overIdx === idx && dragIdx !== idx ? ACCENT : '#E5E7EB'}`,
                  boxShadow: dragIdx === idx ? '0 4px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'grab', opacity: dragIdx === idx ? 0.5 : 1,
                  transform: overIdx === idx && dragIdx !== idx ? 'scale(1.01)' : 'scale(1)',
                  transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
              >
                {/* Drag handle */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                </svg>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: tile.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{tile.icon}</div>
                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{tile.label}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tile.sublabel}</p>
                </div>
                {/* Position badge */}
                <span style={{
                  minWidth: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: tile.kleur + '18', color: tile.kleur,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>{idx + 1}</span>
                {/* Remove */}
                <button onClick={() => toggleTile(tile.id)} style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: '#FEE2E2', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626',
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
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
                Uitgeschakeld ({inactiefTiles.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {inactiefTiles.map(tile => (
                  <div key={tile.id} style={{
                    background: '#FAFAFA', borderRadius: 10, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid #F3F4F6', opacity: 0.7,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, filter: 'grayscale(1)',
                    }}>{tile.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>{tile.label}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{tile.sublabel}</p>
                    </div>
                    <button onClick={() => toggleTile(tile.id)} style={{
                      background: 'white', border: `1.5px solid ${ACCENT}`,
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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Snelle acties</h2>
          {[
            { href: '/hr/protocollen/nieuw', label: 'Nieuw protocol aanmaken', icon: '📋', color: '#92400E', bg: '#FEF3C7' },
            { href: '/hr/protocollen', label: 'Protocollen beheren', icon: '📂', color: '#1D4ED8', bg: '#EFF6FF' },
            { href: '/team', label: 'Team bekijken', icon: '👥', color: '#0369A1', bg: '#E0F2FE' },
            { href: '/verlof', label: 'Verlof beheren', icon: '🌴', color: '#0F6E56', bg: '#D1FAE5' },
            { href: '/loonstroken', label: 'Loonstroken uploaden', icon: '💶', color: '#065F46', bg: '#ECFDF5' },
            { href: '/rapport', label: 'Rapporten bekijken', icon: '📈', color: '#7C3AED', bg: '#EDE9FE' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', borderRadius: 10, padding: '12px 14px',
              border: '1px solid #E5E7EB', textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB' }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{item.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{item.label}</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </HrShell>
  )
}
