'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { ALLE_TILES, DEFAULT_TILES, type TileId } from '@/lib/tiles'

type HrSectie = {
  icon: string
  titel: string
  beschrijving: string
  href: string
  kleur: string
  bg: string
}

const HR_SECTIES: HrSectie[] = [
  {
    icon: '📋',
    titel: 'Protocollen beheren',
    beschrijving: 'Voeg beleid en procedures toe, bewerk of verberg ze',
    href: '/hr/protocollen',
    kleur: '#92400E',
    bg: '#FEF3C7',
  },
  {
    icon: '📰',
    titel: 'Nieuws plaatsen',
    beschrijving: 'Bedrijfsberichten en aankondigingen publiceren',
    href: '/nieuws',
    kleur: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    icon: '🌴',
    titel: 'Verlof beheren',
    beschrijving: 'Verlofaanvragen van medewerkers goedkeuren of afwijzen',
    href: '/verlof',
    kleur: '#0F6E56',
    bg: '#D1FAE5',
  },
  {
    icon: '📈',
    titel: 'Team dashboard',
    beschrijving: 'Vitaliteitsoverzicht van het hele team',
    href: '/team',
    kleur: '#0369A1',
    bg: '#E0F2FE',
  },
  {
    icon: '💶',
    titel: 'Loonstroken uploaden',
    beschrijving: 'Salarisstroken beschikbaar stellen voor medewerkers',
    href: '/loonstroken',
    kleur: '#065F46',
    bg: '#ECFDF5',
  },
]

export default function HrHubPage() {
  const router = useRouter()
  const [naam, setNaam] = useState('')
  const [bedrijfId, setBedrijfId] = useState('')
  const [geladen, setGeladen] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [bezig, setBezig] = useState(false)

  // Portaal configuratie
  const [actief, setActief] = useState<Set<TileId>>(new Set(DEFAULT_TILES))
  const [volgorde, setVolgorde] = useState<TileId[]>(DEFAULT_TILES)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('naam, rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setNaam(profiel.naam ?? 'HR')
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
    check()
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
      <Navbar /><main className="flex justify-center mt-20"><div className="mf-spinner" /></main>
    </div>
  )

  const actiefTiles = volgorde.filter(id => actief.has(id)).map(id => ALLE_TILES.find(t => t.id === id)!).filter(Boolean)
  const inactiefTiles = ALLE_TILES.filter(t => !actief.has(t.id))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 mf-safe-bottom">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm mb-0.5" style={{ color: 'var(--text-3)' }}>Goedendag, {naam.split(' ')[0]}</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            HR Instellingen
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Richt het portaal in en beheer content voor je medewerkers.
          </p>
        </div>

        {/* ── PORTAAL INRICHTEN ── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
            style={{ color: 'var(--text-4)' }}>Portaal inrichten</p>

          {/* Info banner */}
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-start gap-3"
            style={{ background: '#E6F1FB', border: '1px solid rgba(24,95,165,0.15)' }}>
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs leading-relaxed" style={{ color: '#185FA5' }}>
              Sleep tegels om de volgorde te wijzigen. Schakel tegels uit om ze voor medewerkers te verbergen.
            </p>
          </div>

          {/* Actieve tegels */}
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 px-1"
            style={{ color: 'var(--text-4)' }}>Actief ({actiefTiles.length})</p>

          <div className="flex flex-col gap-2 mb-4">
            {actiefTiles.length === 0 && (
              <div className="rounded-2xl p-5 text-center"
                style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-4)' }}>Geen actieve tegels.</p>
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
                className="rounded-2xl p-3.5 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `1.5px solid ${overIdx === idx && dragIdx !== idx ? tile.kleur : 'var(--border)'}`,
                  boxShadow: dragIdx === idx ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                  opacity: dragIdx === idx ? 0.5 : 1,
                  transform: overIdx === idx && dragIdx !== idx ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div style={{ color: 'var(--text-4)', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                  </svg>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: tile.bg }}>{tile.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{tile.label}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{tile.sublabel}</p>
                </div>
                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: tile.kleur + '18', color: tile.kleur, fontSize: 10 }}>
                  {idx + 1}
                </span>
                <button
                  onClick={() => toggleTile(tile.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                  title="Uitschakelen"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Uitgeschakelde tegels */}
          {inactiefTiles.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 px-1"
                style={{ color: 'var(--text-4)' }}>Uitgeschakeld ({inactiefTiles.length})</p>
              <div className="flex flex-col gap-2 mb-4">
                {inactiefTiles.map(tile => (
                  <div key={tile.id} className="rounded-2xl p-3.5 flex items-center gap-3"
                    style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', opacity: 0.7 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'var(--bg-card)', filter: 'grayscale(1)' }}>{tile.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{tile.label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-4)' }}>{tile.sublabel}</p>
                    </div>
                    <button
                      onClick={() => toggleTile(tile.id)}
                      className="mf-btn text-xs flex-shrink-0"
                      style={{ padding: '5px 12px', background: 'var(--bg-card)', color: 'var(--mf-green)', border: '1.5px solid var(--mf-green)', fontWeight: 600, fontSize: 12 }}
                    >
                      Inschakelen
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Opslaan knop */}
          <button
            onClick={opslaan}
            disabled={bezig}
            className="mf-btn mf-btn-primary w-full"
            style={{ padding: '12px', fontSize: 14 }}
          >
            {bezig ? 'Opslaan...' : opgeslagen ? '✓ Portaal opgeslagen' : 'Portaal opslaan'}
          </button>
        </div>

        {/* ── OVERIGE BEHEER-SECTIES ── */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'var(--text-4)' }}>Beheer</p>

        <div className="flex flex-col gap-3">
          {HR_SECTIES.map(s => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-2xl p-4 transition active:scale-[0.99]"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{s.titel}</p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{s.beschrijving}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Terug */}
        <div className="mt-6">
          <Link href="/home" className="flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--text-4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Terug naar hoofdpagina
          </Link>
        </div>
      </main>
    </div>
  )
}
