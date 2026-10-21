// ─── Mijlpalen — rustige lijst in plaats van een badge-grid ───────────────────
// Mijlpalen zijn erkenning achteraf, geen hoofdattractie. Eén feitelijke rij
// per mijlpaal: wat het is, of je hem hebt, en de stille XP-bonus.

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ALLE_ACHIEVEMENTS, type Achievement } from '@/lib/xp/xp'
import SectieKop from './SectieKop'

const ICOON: Record<string, ReactNode> = {
  eerste_checkin: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  drie_checkins: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></>,
  tien_checkins: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></>,
  eerste_doel: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  drie_doelen: <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />,
  vijf_doelen: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="4.22" y1="6.22" x2="7.05" y2="9.05" /></>,
  streek_7: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  streek_30: <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />,
  hoge_score: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>,
  level_5: <><path d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z" /><path d="M9.879 16.121A3 3 0 1 0 12.99 12L11 14" /></>,
  level_8: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  level_10: <><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 20h14" /></>,
}

function MijlpaalRij({ mijlpaal, behaald }: { mijlpaal: Achievement; behaald: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: behaald ? 1 : 0.55 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: behaald ? `color-mix(in srgb, ${mijlpaal.kleur} 16%, transparent)` : 'var(--bg-subtle)',
        border: `1px solid ${behaald ? `color-mix(in srgb, ${mijlpaal.kleur} 35%, transparent)` : 'var(--border)'}`,
        color: behaald ? mijlpaal.kleur : 'var(--text-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICOON[mijlpaal.id] ?? <circle cx="12" cy="12" r="10" />}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: behaald ? 'var(--text-1)' : 'var(--text-3)' }}>
          {mijlpaal.naam}
          <span className="sr-only">{behaald ? ' — behaald' : ' — nog niet behaald'}</span>
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{mijlpaal.beschrijving}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: behaald ? 'var(--text-2)' : 'var(--text-4)',
        }}>
          +{mijlpaal.xpBonus} XP
        </span>
        {behaald && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ color: 'var(--mf-green)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  )
}

export default function Mijlpalen({ behaaldeIds }: { behaaldeIds: readonly string[] }) {
  const behaald = ALLE_ACHIEVEMENTS.filter(a => behaaldeIds.includes(a.id)).length
  return (
    <Card style={{ padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectieKop style={{ margin: 0 }}>Mijlpalen</SectieKop>
        <Badge variant="accent">{behaald} van {ALLE_ACHIEVEMENTS.length}</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {ALLE_ACHIEVEMENTS.map(mijlpaal => (
          <MijlpaalRij key={mijlpaal.id} mijlpaal={mijlpaal} behaald={behaaldeIds.includes(mijlpaal.id)} />
        ))}
      </div>
    </Card>
  )
}
