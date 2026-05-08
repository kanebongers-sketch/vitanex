'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ALLE_TILES, DEFAULT_TILES, type TileId, type TileDef } from '@/lib/tiles'

export default function HrPortaalPage() {
  const router = useRouter()
  const [bedrijfId, setBedrijfId] = useState('')
  const [geladen, setGeladen] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)

  // Which tiles are enabled
  const [actief, setActief] = useState<Set<TileId>>(new Set(DEFAULT_TILES))
  // Order of enabled tiles
  const [volgorde, setVolgorde] = useState<TileId[]>(DEFAULT_TILES)
  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()

      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      setBedrijfId(profiel.bedrijf_id)

      const { data: config } = await supabase
        .from('portaal_config')
        .select('tiles')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .single()

      if (config?.tiles && Array.isArray(config.tiles)) {
        const ids = config.tiles as TileId[]
        setVolgorde(ids)
        setActief(new Set(ids))
      }
      setGeladen(true)
    }
    laad()
  }, [router])

  function toggleTile(id: TileId) {
    setActief(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setVolgorde(v => v.filter(t => t !== id))
      } else {
        next.add(id)
        setVolgorde(v => [...v, id])
      }
      return next
    })
    setOpgeslagen(false)
  }

  // Drag-to-reorder
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
    setDragIdx(null)
    setOverIdx(null)
    setOpgeslagen(false)
  }

  async function opslaan() {
    setBezig(true)
    const tilesArray = volgorde.filter(t => actief.has(t))
    await supabase.from('portaal_config').upsert(
      { bedrijf_id: bedrijfId, tiles: tilesArray, updated_at: new Date().toISOString() },
      { onConflict: 'bedrijf_id' }
    )
    setOpgeslagen(true)
    setBezig(false)
  }

  if (!geladen) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex justify-center mt-20"><div className="mf-spinner" /></main>
    </div>
  )

  const actiefTiles = volgorde.filter(id => actief.has(id)).map(id => ALLE_TILES.find(t => t.id === id)!).filter(Boolean)
  const inactiefTiles = ALLE_TILES.filter(t => !actief.has(t.id))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/hr" className="text-sm" style={{ color: 'var(--text-4)' }}>HR</Link>
              <span style={{ color: 'var(--text-4)' }}>/</span>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>Portaal inrichten</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Portaal inrichten
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              Kies welke tegels zichtbaar zijn voor medewerkers
            </p>
          </div>
          <button
            onClick={opslaan}
            disabled={bezig}
            className="mf-btn mf-btn-primary"
            style={{ padding: '8px 20px', fontSize: 13 }}
          >
            {bezig ? 'Opslaan...' : opgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
          </button>
        </div>

        {/* Info */}
        <div className="rounded-2xl px-4 py-3 mb-6 flex items-start gap-3"
          style={{ background: '#E6F1FB', border: '1px solid rgba(24,95,165,0.15)' }}>
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-xs leading-relaxed" style={{ color: '#185FA5' }}>
            Sleep actieve tegels om de volgorde te wijzigen op de hoofdpagina.
            Schakel tegels uit om ze voor medewerkers te verbergen.
          </p>
        </div>

        {/* Actieve tegels */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--text-4)' }}>
          Actieve tegels ({actiefTiles.length})
        </p>

        <div className="flex flex-col gap-2 mb-6">
          {actiefTiles.length === 0 && (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                Geen actieve tegels. Schakel tegels hieronder in.
              </p>
            </div>
          )}
          {actiefTiles.map((tile, idx) => (
            <div
              key={tile.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              className="rounded-2xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all"
              style={{
                background: 'var(--bg-card)',
                border: `1.5px solid ${overIdx === idx && dragIdx !== idx ? tile.kleur : 'var(--border)'}`,
                boxShadow: dragIdx === idx ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                opacity: dragIdx === idx ? 0.6 : 1,
                transform: overIdx === idx && dragIdx !== idx ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Drag handle */}
              <div style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                </svg>
              </div>

              {/* Icoon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: tile.bg }}>
                {tile.icon}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{tile.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{tile.sublabel}</p>
              </div>

              {/* Positie badge */}
              <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: tile.kleur + '18', color: tile.kleur }}>
                {idx + 1}
              </span>

              {/* Toggle uit */}
              <button
                onClick={() => toggleTile(tile.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
                title="Uitschakelen"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Uitgeschakelde tegels */}
        {inactiefTiles.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
              style={{ color: 'var(--text-4)' }}>
              Uitgeschakeld ({inactiefTiles.length})
            </p>
            <div className="flex flex-col gap-2">
              {inactiefTiles.map(tile => (
                <div
                  key={tile.id}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    opacity: 0.7,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--bg-card)', filter: 'grayscale(1)' }}>
                    {tile.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{tile.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>{tile.sublabel}</p>
                  </div>
                  <button
                    onClick={() => toggleTile(tile.id)}
                    className="mf-btn text-xs flex-shrink-0"
                    style={{ padding: '6px 14px', background: 'var(--bg-card)', color: 'var(--mf-green)', border: '1.5px solid var(--mf-green)', fontWeight: 600 }}
                  >
                    Inschakelen
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Opslaan footer */}
        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 flex justify-center"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={opslaan}
            disabled={bezig}
            className="mf-btn mf-btn-primary w-full max-w-sm"
            style={{ padding: '13px', fontSize: 15 }}
          >
            {bezig ? 'Opslaan...' : opgeslagen ? '✓ Wijzigingen opgeslagen' : 'Wijzigingen opslaan'}
          </button>
        </div>
        <div style={{ height: 80 }} />
      </main>
    </div>
  )
}
