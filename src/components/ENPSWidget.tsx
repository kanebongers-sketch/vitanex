'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

interface ENPSMeting {
  maand: string
  score: number
}

export default function ENPSWidget() {
  const [meting, setMeting] = useState<ENPSMeting | null>(null)
  const [huidigScore, setHuidigScore] = useState<number | null>(null)
  const [reden, setReden] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [succes, setSucces] = useState(false)
  const [laden, setLaden] = useState(true)

  const huidigeMaand = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    async function laad() {
      try {
        const res = await authFetch('/api/enps')
        if (res.ok) {
          const json = await res.json() as { metingen: ENPSMeting[] }
          const dezeM = json.metingen?.find(m => m.maand === huidigeMaand)
          if (dezeM) setMeting(dezeM)
        }
      } catch { /* niet-kritiek */ }
      setLaden(false)
    }
    laad()
  }, [huidigeMaand])

  async function slaOp() {
    if (huidigScore === null) return
    setOpslaan(true)
    try {
      const res = await authFetch('/api/enps', {
        method: 'POST',
        body: JSON.stringify({ score: huidigScore, reden: reden.trim() || undefined }),
      })
      if (res.ok) {
        const json = await res.json() as { meting: ENPSMeting }
        setMeting(json.meting)
        setSucces(true)
        setTimeout(() => setSucces(false), 3000)
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  if (laden) return null

  if (meting) return (
    <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', marginBottom: 4 }}>
        eNPS deze maand
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: meting.score >= 9 ? '#1D9E75' : meting.score >= 7 ? '#F59E0B' : '#EF4444' }}>
          {meting.score}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          /10 · {meting.score >= 9 ? 'Promotor' : meting.score >= 7 ? 'Passief' : 'Detractor'}
        </span>
      </div>
    </div>
  )

  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '16px', border: '1.5px solid #E5E7EB' }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', marginBottom: 4 }}>
        Maandelijkse eNPS
      </p>
      <p style={{ fontSize: 12, color: '#374151', marginBottom: 12, lineHeight: 1.4 }}>
        Hoe waarschijnlijk is het dat je dit bedrijf aanbeveelt? (0-10)
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <button
            key={n}
            onClick={() => setHuidigScore(n)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: huidigScore === n ? (n >= 9 ? '#1D9E75' : n >= 7 ? '#F59E0B' : '#EF4444') : '#F3F4F6',
              color: huidigScore === n ? 'white' : '#374151',
              fontWeight: 700, fontSize: 12,
              transition: 'background 0.12s ease',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {huidigScore !== null && (
        <input
          type="text"
          value={reden}
          onChange={e => setReden(e.target.value)}
          placeholder="Waarom? (optioneel)"
          maxLength={200}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, marginBottom: 10,
            border: '1px solid #E5E7EB', fontSize: 12, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {huidigScore !== null && (
        <button
          onClick={slaOp}
          disabled={opslaan}
          style={{
            width: '100%', padding: '9px', borderRadius: 10, border: 'none',
            background: succes ? '#1D9E75' : '#111827', color: 'white',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            opacity: opslaan ? 0.6 : 1, transition: 'background 0.3s ease',
          }}
        >
          {succes ? '✓ Opgeslagen!' : opslaan ? 'Bezig…' : 'Versturen'}
        </button>
      )}
    </div>
  )
}
