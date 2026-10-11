'use client'

// Historie van eerdere weekreflecties — puur presentational.

import { Card } from '@/components/ui/Card'
import { StepDots } from '@/components/ui/StepDots'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import { REFLECTIE_VRAGEN, type ReflectieEntry } from './reflectieVragen'

interface ReflectieHistorieProps {
  entries: readonly ReflectieEntry[]
}

export default function ReflectieHistorie({ entries }: ReflectieHistorieProps) {
  const { t, taal } = useVertaling()
  if (entries.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>
        {t('mentaal.reflectie.geenEerdere')}
      </p>
    )
  }

  const totaal = REFLECTIE_VRAGEN.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map(e => {
        const datum = new Date(e.week_start).toLocaleDateString(INTL_LOCALE[taal], { day: 'numeric', month: 'long' })
        const aantalIngevuld = Object.values(e.antwoorden ?? {}).filter(v => v.trim()).length
        return (
          <Card key={e.id} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{t('mentaal.reflectie.weekVan', { datum })}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{t('mentaal.reflectie.vragenVan', { aantal: aantalIngevuld, totaal })}</p>
              </div>
              <StepDots
                count={totaal}
                completed={REFLECTIE_VRAGEN.map((_, i) => i < aantalIngevuld)}
                dotRadius={2}
              />
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
