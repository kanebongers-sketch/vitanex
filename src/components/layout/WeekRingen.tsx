'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'

// Activiteiten met vaste kleur
const ACTIVITEITEN = [
  { key: 'mentaal',      label: 'Mentaal',    kleur: '#8B5CF6' }, // violet
  { key: 'fysiek',       label: 'Fysiek',     kleur: '#10B981' }, // groen
  { key: 'water',        label: 'Water',      kleur: '#06B6D4' }, // cyaan
  { key: 'rust',         label: 'Rust',       kleur: '#6366F1' }, // indigo
  { key: 'meditatie',    label: 'Meditatie',  kleur: '#F59E0B' }, // amber
  { key: 'dankbaarheid', label: 'Dankbaar',   kleur: '#F97316' }, // oranje
]

interface ChecklistItem { id: string; status: string }

// Mappen van API-id → activiteit-key
const ID_MAP: Record<string, string> = {
  stemming:     'mentaal',
  sport:        'fysiek',
  water:        'water',
  slaap:        'rust',
  meditatie:    'meditatie',
  dankbaarheid: 'dankbaarheid',
}

export default function WeekRingen({ size = 22 }: { size?: number }) {
  const [gedaan, setGedaan] = useState<Set<string>>(new Set())
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    let mounted = true

    async function laad() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !mounted) return

      try {
        const res = await authFetch('/api/vandaag')
        if (!res.ok || !mounted) return
        const data = await res.json() as { checklist?: ChecklistItem[] }
        const gedaanSet = new Set(
          (data.checklist ?? [])
            .filter(i => i.status === 'gedaan')
            .map(i => ID_MAP[i.id] ?? i.id)
        )
        if (mounted) { setGedaan(gedaanSet); setGeladen(true) }
      } catch {
        if (mounted) setGeladen(true)
      }
    }

    laad()
    return () => { mounted = false }
  }, [])

  const r  = size / 2 - 2.5
  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {ACTIVITEITEN.map(({ key, label, kleur }) => {
        const vol = gedaan.has(key)
        return (
          <div
            key={key}
            title={`${label}${vol ? ' ✓' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
              {/* Achtergrond */}
              <circle
                cx={cx} cy={cy} r={r}
                fill={vol ? kleur : 'none'}
                stroke={kleur}
                strokeWidth={vol ? 0 : geladen ? 1.5 : 1}
                opacity={vol ? 1 : 0.22}
              />
              {/* Vinkje als gedaan */}
              {vol && (
                <polyline
                  points={`${size * 0.27},${size * 0.52} ${size * 0.44},${size * 0.68} ${size * 0.73},${size * 0.34}`}
                  fill="none"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            <span style={{
              fontSize: 6.5,
              fontWeight: vol ? 700 : 500,
              color: vol ? kleur : 'var(--text-4)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
