'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  categorie: string
  apiUrl: string
  linkUrl: string
  linkLabel: string
}

export default function AiCoachCard({ categorie, apiUrl, linkUrl, linkLabel }: Props) {
  const [advies, setAdvies] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  async function laadAdvies() {
    if (advies || laden) return
    setLaden(true)
    try {
      const res = await fetch(apiUrl, { method: 'POST' })
      const data = await res.json() as { advies?: string; error?: string }
      setAdvies(data.advies ?? data.error ?? 'Geen advies beschikbaar.')
    } catch {
      setAdvies('Kon AI-coach niet bereiken.')
    } finally {
      setLaden(false)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1D9E75 0%, #15795A 100%)',
        borderRadius: 20,
        padding: '20px 20px 16px',
        marginBottom: 16,
        color: 'white',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🤖
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>AI {categorie.charAt(0).toUpperCase() + categorie.slice(1)}coach</p>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Persoonlijk advies op basis van jouw data</p>
        </div>
      </div>

      {!advies && !laden && (
        <button
          onClick={laadAdvies}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 12,
            color: 'white',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Genereer advies
        </button>
      )}

      {laden && (
        <div style={{ textAlign: 'center', padding: '10px 0', opacity: 0.8, fontSize: 14 }}>
          Advies wordt gegenereerd…
        </div>
      )}

      {advies && (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, opacity: 0.95 }}>{advies}</p>
          <Link
            href={linkUrl}
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10,
              color: 'white',
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {linkLabel} →
          </Link>
        </>
      )}
    </div>
  )
}
