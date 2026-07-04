// Historie van eerdere weekreflecties — puur presentational.

import { Card } from '@/components/ui/Card'
import { REFLECTIE_VRAGEN, type ReflectieEntry } from './reflectieVragen'

interface ReflectieHistorieProps {
  entries: readonly ReflectieEntry[]
}

export default function ReflectieHistorie({ entries }: ReflectieHistorieProps) {
  if (entries.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>
        Nog geen eerdere reflecties
      </p>
    )
  }

  const totaal = REFLECTIE_VRAGEN.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map(e => {
        const datum = new Date(e.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
        const aantalIngevuld = Object.values(e.antwoorden ?? {}).filter(v => v.trim()).length
        return (
          <Card key={e.id} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Week van {datum}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{aantalIngevuld} van {totaal} vragen</p>
              </div>
              <div style={{ display: 'flex', gap: 3 }} aria-hidden>
                {REFLECTIE_VRAGEN.map((vraag, i) => (
                  <div
                    key={vraag.id}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 2,
                      background: i < aantalIngevuld ? 'var(--mentaforce-primary)' : 'var(--border-strong)',
                    }}
                  />
                ))}
              </div>
            </div>
            {e.antwoorden?.hoogtepunt && (
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '2px solid var(--mentaforce-primary)', paddingLeft: 10 }}>
                &ldquo;{e.antwoorden.hoogtepunt.slice(0, 120)}{e.antwoorden.hoogtepunt.length > 120 ? '...' : ''}&rdquo;
              </p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
