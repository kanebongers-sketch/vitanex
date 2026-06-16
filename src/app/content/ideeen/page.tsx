'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

// ── Types ──────────────────────────────────────────────────

type IdeeRecord = {
  id: string
  pillar_id: string
  titel: string
  hook: string | null
  format: string
  platform: string[]
  status: string
  prioriteit: number
  tags: string[] | null
  notities: string | null
  aangemaakt_op: string
}

// ── Helpers ────────────────────────────────────────────────

const PIJLERS = [
  { id: 'fitness',           label: 'Fitness',           emoji: '💪', kleur: '#1D9E75' },
  { id: 'ondernemen',        label: 'Ondernemen',        emoji: '🚀', kleur: '#185FA5' },
  { id: 'discipline',        label: 'Discipline',        emoji: '🧱', kleur: '#374151' },
  { id: 'leefstijl',         label: 'Leefstijl',         emoji: '🌿', kleur: '#8B5CF6' },
  { id: 'stressmanagement',  label: 'Stressmanagement',  emoji: '⚡', kleur: '#E24B4A' },
  { id: 'performance',       label: 'Performance',       emoji: '📈', kleur: '#BA7517' },
  { id: 'persoonlijke-groei',label: 'Pers. Groei',       emoji: '🧠', kleur: '#1D9E75' },
]

const PIJLER_MAP = Object.fromEntries(PIJLERS.map(p => [p.id, p]))

const FORMAT_KLEUR: Record<string, string> = {
  reel:         '#E24B4A',
  carousel:     '#185FA5',
  post:         '#374151',
  video:        '#8B5CF6',
  nieuwsbrief:  '#BA7517',
  linkedin:     '#1D9E75',
}

function PrioriteitSterren({ waarde }: { waarde: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{
          fontSize: 12,
          color: i < waarde ? '#F59E0B' : '#D1D5DB',
        }}>★</span>
      ))}
    </div>
  )
}

// ── IdeeKaart ──────────────────────────────────────────────

function IdeeKaart({
  idee,
  onStatusUpdate,
}: {
  idee: IdeeRecord
  onStatusUpdate: (id: string, status: string) => void
}) {
  const pijler = PIJLER_MAP[idee.pillar_id]
  const kleur = pijler?.kleur ?? '#1D9E75'
  const formatKleur = FORMAT_KLEUR[idee.format] ?? '#6B7280'

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nieuweStatus = e.target.value
    onStatusUpdate(idee.id, nieuweStatus)
    await authFetch('/api/content/ideas', {
      method: 'PATCH',
      body: JSON.stringify({ id: idee.id, status: nieuweStatus }),
    })
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.15s ease',
    }}>
      {/* Gekleurde top streep */}
      <div style={{ height: 4, background: kleur, width: '100%' }} />

      <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Badge rij */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {pijler && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
              background: `${kleur}15`, color: kleur,
              padding: '3px 10px', borderRadius: 20,
            }}>
              {pijler.emoji} {pijler.label}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            background: `${formatKleur}12`, color: formatKleur,
            padding: '3px 10px', borderRadius: 20,
            textTransform: 'uppercase',
          }}>
            {idee.format}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <PrioriteitSterren waarde={idee.prioriteit} />
          </div>
        </div>

        {/* Titel */}
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: 'var(--text-1)',
          margin: 0, lineHeight: 1.35,
        }}>
          {idee.titel}
        </h3>

        {/* Platform tags */}
        {idee.platform?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {idee.platform.map(p => (
              <span key={p} style={{
                fontSize: 11, fontWeight: 600,
                background: 'var(--bg-subtle)', color: 'var(--text-3)',
                border: '1px solid var(--border)',
                padding: '2px 8px', borderRadius: 6,
              }}>
                📱 {p}
              </span>
            ))}
          </div>
        )}

        {/* Hook */}
        {idee.hook && (
          <div style={{
            background: `${kleur}08`,
            border: `1px solid ${kleur}20`,
            borderLeft: `3px solid ${kleur}`,
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, fontStyle: 'italic',
            color: 'var(--text-2)', lineHeight: 1.6,
          }}>
            "{idee.hook}"
          </div>
        )}

        {/* Tags */}
        {idee.tags && idee.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {idee.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 11, fontWeight: 600,
                background: 'var(--bg-subtle)', color: 'var(--text-4)',
                border: '1px solid var(--border)',
                padding: '2px 8px', borderRadius: 20,
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Acties rij */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingTop: 12, borderTop: '1px solid var(--border)',
        }}>
          <select
            value={idee.status}
            onChange={handleStatusChange}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)', color: 'var(--text-2)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="idee">💡 Idee</option>
            <option value="gepland">📅 Gepland</option>
            <option value="te_filmen">🎬 Te filmen</option>
            <option value="opgenomen">✅ Opgenomen</option>
            <option value="gepubliceerd">🚀 Gepubliceerd</option>
            <option value="gearchiveerd">📦 Gearchiveerd</option>
          </select>

          <button
            disabled
            title="Komt bron"
            style={{
              padding: '7px 14px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)', color: 'var(--text-4)',
              fontSize: 12, fontWeight: 600, cursor: 'not-allowed',
              whiteSpace: 'nowrap', opacity: 0.6,
            }}
          >
            📋 Voeg toe aan briefing
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────

function IdeeBankContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [ideeen, setIdeeen] = useState<IdeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [genereren, setGenereren] = useState(false)
  const [filterPijler, setFilterPijler] = useState<string>(searchParams.get('pijler') ?? 'alle')
  const [filterStatus, setFilterStatus] = useState<string>('alle')
  const [zoekterm, setZoekterm] = useState('')
  const [error, setError] = useState('')

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  const laadIdeeen = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterPijler !== 'alle') params.set('pijler', filterPijler)
      if (filterStatus !== 'alle') params.set('status', filterStatus)

      const res = await authFetch(`/api/content/ideas?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fout bij laden')
      setIdeeen(json.ideeen ?? json.ideas ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kon ideeën niet laden')
    } finally {
      setLoading(false)
    }
  }, [filterPijler, filterStatus])

  useEffect(() => { laadIdeeen() }, [laadIdeeen])

  async function genereerIdeeeen(pijler: string | null) {
    setGenereren(true)
    setError('')
    try {
      const res = await authFetch('/api/content/ideas', {
        method: 'POST',
        body: JSON.stringify({ actie: 'genereer', pijler, aantal: 5 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fout bij genereren')
      await laadIdeeen()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kon ideeën niet genereren')
    } finally {
      setGenereren(false)
    }
  }

  function updateStatus(id: string, status: string) {
    setIdeeen(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  // Gefilterd op zoekterm
  const gefilterdeIdeeen = ideeen.filter(i => {
    if (!zoekterm) return true
    return i.titel.toLowerCase().includes(zoekterm.toLowerCase())
  })

  // Stats
  const totaalIdeeen = ideeen.length
  const klaarVoorPlanning = ideeen.filter(i => i.status === 'idee').length
  const gepubliceerd = ideeen.filter(i => i.status === 'gepubliceerd').length

  return (
    <div className="mf-has-sidebar" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />

      <main style={{
        paddingLeft: 280, padding: '32px 40px',
        maxWidth: 1000, margin: '0 auto',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: 'var(--text-1)',
            margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            💡 Ideeën Bank
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 0', fontWeight: 500 }}>
            AI-gegenereerde content ideeën voor jouw personal brand
          </p>
        </div>

        {/* Navigatie tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { href: '/content',          label: '📋 Briefing',     actief: false },
            { href: '/content/strategie',label: '🗺 Strategie',    actief: false },
            { href: '/content/ideeen',   label: '💡 Ideeën bank',  actief: true  },
          ].map(tab => (
            <Link key={tab.href} href={tab.href} style={{
              padding: '8px 18px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
              background: tab.actief ? '#1D9E75' : 'var(--bg-card)',
              color: tab.actief ? '#fff' : 'var(--text-2)',
              border: tab.actief ? 'none' : '1px solid var(--border)',
              boxShadow: tab.actief ? '0 2px 8px rgba(29,158,117,0.3)' : 'var(--shadow-xs)',
            }}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Totaal ideeën',       waarde: totaalIdeeen,       icon: '💡', kleur: '#185FA5' },
            { label: 'Klaar voor planning', waarde: klaarVoorPlanning,  icon: '📅', kleur: '#BA7517' },
            { label: 'Gepubliceerd',        waarde: gepubliceerd,       icon: '🚀', kleur: '#1D9E75' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '18px 22px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.kleur, letterSpacing: '-0.02em' }}>
                {stat.waarde}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '18px 22px',
          marginBottom: 24, boxShadow: 'var(--shadow-xs)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Pijler chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginRight: 4 }}>Pijler:</span>
            <button
              onClick={() => setFilterPijler('alle')}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filterPijler === 'alle' ? '#0D1117' : 'var(--bg-subtle)',
                color: filterPijler === 'alle' ? '#fff' : 'var(--text-2)',
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease',
              }}
            >
              Alle
            </button>
            {PIJLERS.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterPijler(filterPijler === p.id ? 'alle' : p.id)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filterPijler === p.id ? p.kleur : 'var(--bg-subtle)',
                  color: filterPijler === p.id ? '#fff' : 'var(--text-2)',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease',
                  boxShadow: filterPijler === p.id ? `0 2px 8px ${p.kleur}40` : 'none',
                }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Status + zoekbalk + genereer knop */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)', color: 'var(--text-2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="alle">Alle statussen</option>
              <option value="idee">💡 Idee</option>
              <option value="gepland">📅 Gepland</option>
              <option value="opgenomen">✅ Opgenomen</option>
              <option value="gepubliceerd">🚀 Gepubliceerd</option>
            </select>

            <input
              type="text"
              placeholder="Zoek op titel..."
              value={zoekterm}
              onChange={e => setZoekterm(e.target.value)}
              style={{
                flex: 1, minWidth: 180, padding: '8px 14px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)', color: 'var(--text-1)',
                fontSize: 13, outline: 'none',
              }}
            />

            <button
              onClick={() => genereerIdeeeen(filterPijler !== 'alle' ? filterPijler : null)}
              disabled={genereren}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                cursor: genereren ? 'not-allowed' : 'pointer',
                background: genereren ? '#9CA3AF' : '#1D9E75',
                color: '#fff', fontSize: 13, fontWeight: 800,
                boxShadow: genereren ? 'none' : '0 2px 10px rgba(29,158,117,0.35)',
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                opacity: genereren ? 0.7 : 1,
              }}
            >
              {genereren ? '⚡ Genereren...' : '⚡ Genereer 5 nieuwe ideeën'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', background: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 10,
            fontSize: 14, color: '#E24B4A', fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Ideeën laden...</div>
          </div>
        )}

        {/* Lege staat */}
        {!loading && gefilterdeIdeeen.length === 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: '60px 40px', textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💡</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px' }}>
              Geen ideeën gevonden
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 28px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              {zoekterm
                ? `Geen resultaten voor "${zoekterm}". Pas je zoekopdracht aan of genereer nieuwe ideeën.`
                : 'Er zijn nog geen content ideeën. Laat de AI er een paar genereren!'}
            </p>
            <button
              onClick={() => genereerIdeeeen(filterPijler !== 'alle' ? filterPijler : null)}
              disabled={genereren}
              style={{
                padding: '13px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: genereren ? '#9CA3AF' : '#1D9E75',
                color: '#fff', fontSize: 15, fontWeight: 800,
                boxShadow: genereren ? 'none' : '0 4px 16px rgba(29,158,117,0.4)',
                transition: 'all 0.2s ease',
                opacity: genereren ? 0.7 : 1,
              }}
            >
              {genereren ? '⚡ Genereren...' : '⚡ Genereer 5 ideeën'}
            </button>
          </div>
        )}

        {/* Ideeën grid */}
        {!loading && gefilterdeIdeeen.length > 0 && (
          <>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-4)',
              marginBottom: 14,
            }}>
              {gefilterdeIdeeen.length} idee{gefilterdeIdeeen.length !== 1 ? 'en' : ''} gevonden
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}>
              {gefilterdeIdeeen.map(idee => (
                <IdeeKaart
                  key={idee.id}
                  idee={idee}
                  onStatusUpdate={updateStatus}
                />
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  )
}

export default function IdeeBankPage() {
  return (
    <Suspense fallback={null}>
      <IdeeBankContent />
    </Suspense>
  )
}
