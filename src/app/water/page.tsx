'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface WaterLog {
  id: string
  ml: number
  tijdstip: string
}

interface WaterData {
  vandaag_ml: number
  doel_ml: number
  logs: WaterLog[]
}

const SNELLE_OPTIES = [150, 250, 500, 750]

function formatTijdstip(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function formatDatum(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function motivatieTekst(percentage: number): string {
  if (percentage >= 100) return '🎉 Dagdoel behaald! Super!'
  if (percentage >= 75) return 'Bijna! Nog een glas en je bent er! 💧💧💧'
  if (percentage >= 50) return 'Halverwege je doel! 💧💧💧'
  if (percentage >= 25) return 'Goed bezig, drink nog meer! 💧💧'
  return 'Tijd om te drinken! 💧'
}

function WaterGlas({ percentage }: { percentage: number }) {
  const gevuld = Math.min(percentage, 100)
  const waterHoogte = (gevuld / 100) * 200

  return (
    <svg
      viewBox="0 0 160 260"
      width="160"
      height="260"
      aria-label={`Waterglas ${gevuld}% gevuld`}
      role="img"
    >
      {/* Glas omlijning */}
      <path
        d="M20 20 L10 240 L150 240 L140 20 Z"
        fill="none"
        stroke="#378ADD"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Reflectie op glas */}
      <path
        d="M28 30 L24 210"
        stroke="rgba(55,138,221,0.2)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Clip pad voor water */}
      <defs>
        <clipPath id="glasClip">
          <path d="M21 21 L11 239 L149 239 L139 21 Z" />
        </clipPath>
      </defs>
      {/* Water vulling met animatie */}
      <g clipPath="url(#glasClip)">
        <rect
          x="0"
          y={240 - waterHoogte}
          width="160"
          height={waterHoogte + 10}
          fill="#378ADD"
          opacity="0.85"
          style={{ transition: 'y 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        {/* Golvend wateroppervlak */}
        <path
          d={`M0 ${240 - waterHoogte} q20 -8 40 0 q20 8 40 0 q20 -8 40 0 q20 8 40 0 v10 H0 Z`}
          fill="#5BA8E8"
          opacity="0.6"
          style={{ transition: 'd 0.8s ease' }}
        />
      </g>
      {/* Maatstreepjes */}
      {[25, 50, 75].map(pct => {
        const y = 240 - (pct / 100) * 200
        return (
          <line
            key={pct}
            x1="135"
            y1={y}
            x2="148"
            y2={y}
            stroke="rgba(55,138,221,0.5)"
            strokeWidth="1.5"
          />
        )
      })}
    </svg>
  )
}

export default function WaterPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<WaterData>({ vandaag_ml: 0, doel_ml: 2000, logs: [] })
  const [toevoegen, setToevoegen] = useState(false)
  const [customMl, setCustomMl] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const percentage = Math.round((data.vandaag_ml / data.doel_ml) * 100)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await authFetch('/api/water')
      if (res.ok) {
        const json = await res.json() as WaterData
        setData(json)
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function voegToe(ml: number) {
    if (toevoegen) return
    setToevoegen(true)
    setFout(null)

    const res = await authFetch('/api/water', {
      method: 'POST',
      body: JSON.stringify({ ml }),
    })

    if (res.ok) {
      const { nieuw_totaal, doel_ml } = await res.json() as { nieuw_totaal: number; doel_ml: number }
      const updated: WaterData = {
        vandaag_ml: nieuw_totaal,
        doel_ml,
        logs: [
          ...data.logs,
          { id: crypto.randomUUID(), ml, tijdstip: new Date().toISOString() },
        ],
      }
      setData(updated)
      setCustomMl('')
    } else {
      const json = await res.json() as { error: string }
      setFout(json.error ?? 'Fout bij toevoegen.')
    }

    setToevoegen(false)
  }

  async function verwijder(id: string) {
    const log = data.logs.find(l => l.id === id)
    if (!log) return

    const res = await authFetch(`/api/water?id=${id}`, { method: 'DELETE' })

    if (res.ok) {
      setData(prev => ({
        ...prev,
        vandaag_ml: Math.max(0, prev.vandaag_ml - log.ml),
        logs: prev.logs.filter(l => l.id !== id),
      }))
    }
  }

  function handleCustomToevoegen() {
    const ml = parseInt(customMl, 10)
    if (!Number.isInteger(ml) || ml <= 0 || ml > 2000) {
      setFout('Voer een geldig aantal ml in (1–2000).')
      return
    }
    voegToe(ml)
  }

  if (laden) {
    return (
      <main style={{ minHeight: '100vh', background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#378ADD', fontFamily: 'system-ui, sans-serif' }}>Laden…</p>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #E6F1FB 0%, #F7FBFF 60%, #EAF4FF 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '3rem',
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 1.25rem' }}>

          {/* Header */}
          <header style={{ paddingTop: '2rem', marginBottom: '1.5rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1B4F8A',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Waterintake
            </h1>
            <p style={{ color: '#5B8BBD', fontSize: '0.9rem', margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
              {formatDatum()}
            </p>
          </header>

          {/* Grote watervisualisatie */}
          <section
            aria-label="Waterstatus vandaag"
            style={{
              background: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 24px rgba(55,138,221,0.10)',
              padding: '2rem 1.5rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <WaterGlas percentage={percentage} />

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#1B4F8A',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}>
                {data.vandaag_ml}
                <span style={{ fontSize: '1.1rem', fontWeight: 500, color: '#5B8BBD', marginLeft: '0.25rem' }}>
                  / {data.doel_ml}ml
                </span>
              </p>
              <p style={{ color: '#5B8BBD', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                {percentage}% van je dagdoel
              </p>
            </div>

            {/* Motivatietekst */}
            <p style={{
              background: percentage >= 100 ? '#D4F5E3' : '#E6F1FB',
              color: percentage >= 100 ? '#1A7A4A' : '#1B4F8A',
              borderRadius: '0.75rem',
              padding: '0.6rem 1.1rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              margin: 0,
              textAlign: 'center',
            }}>
              {motivatieTekst(percentage)}
            </p>
          </section>

          {/* Snelle toevoeg knoppen */}
          <section aria-label="Snel water toevoegen" style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1B4F8A', margin: '0 0 0.75rem' }}>
              Snel toevoegen
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SNELLE_OPTIES.map(ml => (
                <button
                  key={ml}
                  onClick={() => voegToe(ml)}
                  disabled={toevoegen}
                  style={{
                    flex: '1 1 calc(50% - 0.25rem)',
                    minWidth: '100px',
                    padding: '0.85rem 1rem',
                    borderRadius: '2rem',
                    border: '2px solid #378ADD',
                    background: 'white',
                    color: '#378ADD',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: toevoegen ? 'not-allowed' : 'pointer',
                    opacity: toevoegen ? 0.6 : 1,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!toevoegen) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#378ADD'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                    }
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#378ADD'
                  }}
                >
                  +{ml}ml
                </button>
              ))}
            </div>

            {/* Custom ml */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={2000}
                value={customMl}
                onChange={e => setCustomMl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomToevoegen()}
                placeholder="Aangepast (ml)"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '2rem',
                  border: '2px solid #C4DDF5',
                  background: 'white',
                  color: '#1B4F8A',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCustomToevoegen}
                disabled={toevoegen || !customMl}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '2rem',
                  border: 'none',
                  background: '#378ADD',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: toevoegen || !customMl ? 'not-allowed' : 'pointer',
                  opacity: toevoegen || !customMl ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                + Toevoegen
              </button>
            </div>

            {fout && (
              <p role="alert" style={{ color: '#D9534F', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                {fout}
              </p>
            )}
          </section>

          {/* Vandaag history */}
          <section aria-label="Waterlog vandaag" style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 2px 12px rgba(55,138,221,0.07)',
            padding: '1.25rem 1.5rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1B4F8A', margin: '0 0 1rem' }}>
              Vandaag gelogd
            </h2>

            {data.logs.length === 0 ? (
              <p style={{ color: '#8AAFC8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                Nog niets gelogd vandaag.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...data.logs].reverse().map(log => (
                  <li
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '0.75rem',
                      background: '#F0F7FF',
                    }}
                  >
                    <span style={{ color: '#1B4F8A', fontSize: '0.95rem', fontWeight: 500 }}>
                      <span style={{ color: '#8AAFC8', fontWeight: 400, marginRight: '0.5rem' }}>
                        {formatTijdstip(log.tijdstip)}
                      </span>
                      {log.ml}ml
                    </span>
                    <button
                      onClick={() => verwijder(log.id)}
                      aria-label={`Verwijder ${log.ml}ml om ${formatTijdstip(log.tijdstip)}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#C4DDF5',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '0.5rem',
                        lineHeight: 1,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D9534F' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C4DDF5' }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  )
}
