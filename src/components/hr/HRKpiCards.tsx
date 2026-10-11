'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useVertaling } from '@/lib/i18n/TaalProvider'

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

type KpiDef = {
  label: string
  value: string
  sub: string
  variant: BadgeVariant
  tab: string | null
}

type Props = {
  participatieRate: number
  ingevuld: number
  teamGrootte: number
  signaalCount: number
  pendingVerlof: number
  pendingDeclaraties: number
  gesprekkenDezeMaand: number
  discIngevuld?: number
  onTabSwitch: (tab: string) => void
}

export default function HRKpiCards({
  participatieRate,
  ingevuld,
  teamGrootte,
  signaalCount,
  pendingVerlof,
  pendingDeclaraties,
  gesprekkenDezeMaand,
  discIngevuld,
  onTabSwitch,
}: Props) {
  const { t } = useVertaling()
  const kpis: KpiDef[] = [
    {
      label: t('werk.hrKpi.participatie'),
      value: `${participatieRate}%`,
      sub: t('werk.hrKpi.checkIns', { ingevuld, totaal: teamGrootte }),
      variant: participatieRate >= 70 ? 'success' : participatieRate >= 40 ? 'warning' : 'danger',
      tab: null,
    },
    {
      label: t('werk.hrKpi.teamSignalen'),
      value: String(signaalCount),
      sub: signaalCount === 0
        ? t('werk.hrKpi.geenAandachtspunten')
        : signaalCount === 1 ? t('werk.hrKpi.risicoEen') : t('werk.hrKpi.risicoMeer', { aantal: signaalCount }),
      variant: signaalCount > 0 ? 'danger' : 'success',
      tab: 'signalen',
    },
    {
      label: t('werk.hrKpi.openVerlof'),
      value: String(pendingVerlof),
      sub: pendingVerlof === 0 ? t('werk.hrKpi.allesBehandeld') : t('werk.hrKpi.teBehandelen', { aantal: pendingVerlof }),
      variant: pendingVerlof > 0 ? 'warning' : 'success',
      tab: 'verlof',
    },
    {
      label: t('werk.hrKpi.openDeclaraties'),
      value: String(pendingDeclaraties),
      sub: pendingDeclaraties === 0 ? t('werk.hrKpi.allesBehandeld') : t('werk.hrKpi.teBehandelen', { aantal: pendingDeclaraties }),
      variant: pendingDeclaraties > 0 ? 'accent' : 'success',
      tab: 'declaraties',
    },
    {
      label: t('werk.hrKpi.gesprekken'),
      value: String(gesprekkenDezeMaand),
      sub: t('werk.hrKpi.dezeMaandGepland'),
      variant: gesprekkenDezeMaand > 0 ? 'accent' : 'neutral',
      tab: 'gesprekken',
    },
    ...(discIngevuld !== undefined ? [{
      label: t('werk.hrKpi.discIngevuld'),
      value: teamGrootte > 0 ? `${Math.round((discIngevuld / teamGrootte) * 100)}%` : '—',
      sub: t('werk.hrKpi.medewerkersTelling', { ingevuld: discIngevuld, totaal: teamGrootte }),
      variant: (teamGrootte > 0 && discIngevuld / teamGrootte >= 0.7 ? 'success' : discIngevuld > 0 ? 'warning' : 'neutral') as BadgeVariant,
      tab: null,
    } satisfies KpiDef] : []),
  ]

  return (
    <div
      className="flex gap-3 mb-6 overflow-x-auto pb-1"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      {kpis.map(kpi => {
        const clickable = kpi.tab !== null
        const accessibleValue = `${kpi.label}: ${kpi.value}, ${kpi.sub}`

        const inner = (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, whiteSpace: 'nowrap' }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {kpi.value}
            </p>
            <div style={{ marginTop: 8 }}>
              <Badge variant={kpi.variant}>{kpi.sub}</Badge>
            </div>
          </>
        )

        if (clickable) {
          return (
            <Card
              key={kpi.label}
              interactive
              role="button"
              aria-label={t('werk.hrKpi.openTabblad', { waarde: accessibleValue })}
              onClick={() => onTabSwitch(kpi.tab as string)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onTabSwitch(kpi.tab as string)
                }
              }}
              style={{ padding: 16, minWidth: 150, flex: '1 1 0' }}
            >
              {inner}
            </Card>
          )
        }

        return (
          <Card
            key={kpi.label}
            aria-label={accessibleValue}
            style={{ padding: 16, minWidth: 150, flex: '1 1 0' }}
          >
            {inner}
          </Card>
        )
      })}
    </div>
  )
}
