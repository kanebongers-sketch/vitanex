'use client'

import React, { useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

type Stemming = 'moe' | 'gestrest' | 'ok' | 'blij' | 'energiek'

interface MoodLog {
  datum: string
  stemming: Stemming
}

const STEMMINGEN: { code: Stemming; emoji: string; label: string; kleur: string }[] = [
  { code: 'moe',      emoji: '😴', label: 'Moe',      kleur: '#8B5CF6' },
  { code: 'gestrest', emoji: '😤', label: 'Gestrest', kleur: '#E24B4A' },
  { code: 'ok',       emoji: '😐', label: 'OK',       kleur: '#6B7280' },
  { code: 'blij',     emoji: '😊', label: 'Blij',     kleur: '#1D9E75' },
  { code: 'energiek', emoji: '⚡', label: 'Energiek', kleur: '#F59E0B' },
]

const KLEUR_VAN: Record<Stemming, string> = Object.fromEntries(
  STEMMINGEN.map(s => [s.code, s.kleur])
) as Record<Stemming, string>

const LABEL_VAN: Record<Stemming, string> = Object.fromEntries(
  STEMMINGEN.map(s => [s.code, s.label])
) as Record<Stemming, string>

function lokaleDatum(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function datumLabel(datum: string): string {
  const [y, m, d] = datum.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// 7 dagen: vandaag t/m 6 dagen geleden, oudste links
function laatsteZevenDagen(): string[] {
  const dagen: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dagen.push(lokaleDatum(d))
  }
  return dagen
}

export default function MoodPulse() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [laden, setLaden] = useState(true)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [netOpgeslagen, setNetOpgeslagen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)

  const vandaagStr = lokaleDatum(new Date())
  const vandaagLog = logs.find(l => l.datum === vandaagStr)
  const logVan = (datum: string) => logs.find(l => l.datum === datum)

  useEffect(() => {
    let actief = true
    async function laad() {
      try {
        const res = await authFetch('/api/mood')
        if (!res.ok) throw new Error('Kon stemmingen niet laden.')
        const data = await res.json() as { logs: MoodLog[] }
        if (actief) setLogs(data.logs ?? [])
      } catch (err) {
        if (actief) setFout(err instanceof Error ? err.message : 'Er ging iets mis.')
      } finally {
        if (actief) setLaden(false)
      }
    }
    laad()
    return () => { actief = false }
  }, [])

  async function kies(stemming: Stemming) {
    if (bezig) return
    setBezig(true)
    setFout(null)
    // optimistisch
    const vorige = logs
    setLogs(prev => {
      const zonder = prev.filter(l => l.datum !== vandaagStr)
      return [{ datum: vandaagStr, stemming }, ...zonder]
    })
    try {
      const res = await authFetch('/api/mood', {
        method: 'POST',
        body: JSON.stringify({ stemming }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Opslaan mislukt.')
      }
      setNetOpgeslagen(true)
      window.setTimeout(() => setNetOpgeslagen(false), 2200)
    } catch (err) {
      setLogs(vorige) // rollback
      setFout(err instanceof Error ? err.message : 'Opslaan mislukt — probeer opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '18px 20px', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
          Hoe voel je je vandaag?
        </p>
        {vandaagLog && (
          <span
            style={{
              fontSize: 11, fontWeight: 700,
              color: netOpgeslagen ? '#1D9E75' : '#9CA3AF',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              animation: netOpgeslagen ? 'mood-fade-in 0.3s ease' : undefined,
            }}
          >
            <span>✓</span>{netOpgeslagen ? 'Opgeslagen' : 'Vandaag gelogd'}
          </span>
        )}
      </div>

      {/* 5 emoji knoppen */}
      <div style={{ display: 'flex', gap: 8 }}>
        {STEMMINGEN.map(s => {
          const geselecteerd = vandaagLog?.stemming === s.code
          return (
            <button
              key={s.code}
              type="button"
              disabled={bezig || laden}
              onClick={() => kies(s.code)}
              aria-pressed={geselecteerd}
              aria-label={s.label}
              title={s.label}
              style={{
                flex: 1, minWidth: 52, height: 56,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                borderRadius: 16,
                border: geselecteerd ? `2px solid ${s.kleur}` : '2px solid #EEF0F3',
                background: geselecteerd ? `${s.kleur}14` : '#FAFBFC',
                cursor: bezig || laden ? 'default' : 'pointer',
                transition: 'transform 0.12s ease, border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => { if (!geselecteerd) (e.currentTarget as HTMLElement).style.borderColor = `${s.kleur}66` }}
              onMouseLeave={e => { if (!geselecteerd) (e.currentTarget as HTMLElement).style.borderColor = '#EEF0F3' }}
              onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'}
              onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{s.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: geselecteerd ? s.kleur : '#9CA3AF' }}>{s.label}</span>
            </button>
          )
        })}
      </div>

      {fout && (
        <p style={{ fontSize: 11, color: '#E24B4A', marginTop: 10, fontWeight: 600 }}>{fout}</p>
      )}

      {/* 7-daagse mini-trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#B0B7C3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          7 dagen
        </span>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          {laatsteZevenDagen().map(datum => {
            const log = logVan(datum)
            const kleur = log ? KLEUR_VAN[log.stemming] : null
            const isVandaag = datum === vandaagStr
            const tip = log
              ? `${datumLabel(datum)} · ${LABEL_VAN[log.stemming]}`
              : `${datumLabel(datum)} · niet gelogd`
            return (
              <div
                key={datum}
                onMouseEnter={() => setHover(datum)}
                onMouseLeave={() => setHover(h => (h === datum ? null : h))}
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: kleur ?? '#EEF0F3',
                    border: isVandaag ? '2px solid #111827' : kleur ? 'none' : '1px solid #E5E7EB',
                    boxSizing: 'border-box',
                    transition: 'transform 0.12s ease',
                    transform: hover === datum ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
                {hover === datum && (
                  <span
                    role="tooltip"
                    style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                      background: '#111827', color: 'white', fontSize: 10, fontWeight: 600,
                      padding: '5px 8px', borderRadius: 7, whiteSpace: 'nowrap', zIndex: 10,
                      pointerEvents: 'none', textTransform: 'capitalize',
                      animation: 'mood-fade-in 0.15s ease',
                    }}
                  >
                    {tip}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes mood-fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
