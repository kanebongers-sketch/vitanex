'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/auth-fetch'

interface SnapshotData {
  stemming: number | null
  slaap: number | null
  stress: number | null
  focus_minuten: number
  dankbaarheid: number
}

interface SnapshotItem {
  href: string
  label: string
  waarde: string
  kleur: string
}

export default function WellbeingSnapshot() {
  const [data, setData] = useState<SnapshotData | null>(null)

  useEffect(() => {
    async function laad() {
      try {
        const [stemmingRes, slaapRes, stressRes, focusRes, dankRes] = await Promise.all([
          authFetch('/api/stemming?limit=7'),
          authFetch('/api/slaap?limit=7'),
          authFetch('/api/stress?limit=7'),
          authFetch('/api/focus/log?limit=7'),
          authFetch('/api/dankbaarheid?limit=7'),
        ])

        const stemmingJson = stemmingRes.ok ? await stemmingRes.json() as { logs: { stemming: number }[] } : { logs: [] }
        const slaapJson = slaapRes.ok ? await slaapRes.json() as { logs: { uren_slaap: number }[] } : { logs: [] }
        const stressJson = stressRes.ok ? await stressRes.json() as { logs: { stress_niveau: number }[] } : { logs: [] }
        const focusJson = focusRes.ok ? await focusRes.json() as { logs: { duur_minuten: number }[]; totaal_minuten?: number } : { logs: [], totaal_minuten: 0 }
        const dankJson = dankRes.ok ? await dankRes.json() as { logs: unknown[] } : { logs: [] }

        const sl = stemmingJson.logs ?? []
        const ll = slaapJson.logs ?? []
        const tl = stressJson.logs ?? []

        setData({
          stemming: sl.length ? Math.round((sl.reduce((s, l) => s + l.stemming, 0) / sl.length) * 10) / 10 : null,
          slaap: ll.length ? Math.round((ll.reduce((s, l) => s + l.uren_slaap, 0) / ll.length) * 10) / 10 : null,
          stress: tl.length ? Math.round((tl.reduce((s, l) => s + l.stress_niveau, 0) / tl.length) * 10) / 10 : null,
          focus_minuten: focusJson.totaal_minuten ?? (focusJson.logs ?? []).reduce((s, l) => s + (l.duur_minuten ?? 0), 0),
          dankbaarheid: (dankJson.logs ?? []).length,
        })
      } catch { /* stil falen */ }
    }
    laad()
  }, [])

  if (!data) return null

  const items: SnapshotItem[] = [
    data.stemming !== null && {
      href: '/stemming', label: 'Stemming', waarde: `${data.stemming}/5`,
      kleur: data.stemming >= 4 ? '#1D9E75' : data.stemming >= 3 ? '#F59E0B' : '#EF4444',
    },
    data.slaap !== null && {
      href: '/slaap', label: 'Slaap', waarde: `${data.slaap}u`,
      kleur: data.slaap >= 7 ? '#1D9E75' : data.slaap >= 5 ? '#F59E0B' : '#EF4444',
    },
    data.stress !== null && {
      href: '/stress', label: 'Stress', waarde: `${data.stress}/10`,
      kleur: data.stress <= 4 ? '#1D9E75' : data.stress <= 6 ? '#F59E0B' : '#EF4444',
    },
    data.focus_minuten > 0 && {
      href: '/focus', label: 'Focus', waarde: `${data.focus_minuten}m`,
      kleur: data.focus_minuten >= 60 ? '#1D9E75' : '#9CA3AF',
    },
    data.dankbaarheid > 0 && {
      href: '/dankbaarheid', label: 'Dankbaar', waarde: `${data.dankbaarheid}×`,
      kleur: data.dankbaarheid >= 3 ? '#1D9E75' : '#9CA3AF',
    },
  ].filter((x): x is SnapshotItem => Boolean(x))

  if (!items.length) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
          Deze week
        </p>
        <Link href="/inzichten" style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
          Inzichten →
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {items.map(item => (
          <Link key={item.href} href={item.href} style={{
            flexShrink: 0, background: 'white', borderRadius: 14, padding: '12px 14px',
            border: '1px solid #E5E7EB', textDecoration: 'none',
            minWidth: 72,
          }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: item.kleur }}>{item.waarde}</p>
            <p style={{ fontSize: 9, color: '#9CA3AF', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
