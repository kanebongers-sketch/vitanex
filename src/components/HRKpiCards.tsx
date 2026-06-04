'use client'

type KpiDef = {
  label: string
  value: string
  sub: string
  color: string
  bg: string
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
  const kpis: KpiDef[] = [
    {
      label: 'Participatie',
      value: `${participatieRate}%`,
      sub: `${ingevuld}/${teamGrootte} check-ins`,
      color: participatieRate >= 70 ? '#1D9E75' : participatieRate >= 40 ? '#BA7517' : '#E24B4A',
      bg: participatieRate >= 70 ? '#E1F5EE' : participatieRate >= 40 ? '#FAEEDA' : '#FCEBEB',
      tab: null,
    },
    {
      label: 'Team signalen',
      value: String(signaalCount),
      sub: signaalCount === 0 ? 'Geen aandachtspunten' : `${signaalCount} risico${signaalCount !== 1 ? "'s" : ''}`,
      color: signaalCount > 0 ? '#E24B4A' : '#1D9E75',
      bg: signaalCount > 0 ? '#FCEBEB' : '#E1F5EE',
      tab: 'signalen',
    },
    {
      label: 'Open verlof',
      value: String(pendingVerlof),
      sub: pendingVerlof === 0 ? 'Alles behandeld' : `${pendingVerlof} te behandelen`,
      color: pendingVerlof > 0 ? '#BA7517' : '#1D9E75',
      bg: pendingVerlof > 0 ? '#FAEEDA' : '#E1F5EE',
      tab: 'verlof',
    },
    {
      label: 'Open declaraties',
      value: String(pendingDeclaraties),
      sub: pendingDeclaraties === 0 ? 'Alles behandeld' : `${pendingDeclaraties} te behandelen`,
      color: pendingDeclaraties > 0 ? '#8B5CF6' : '#1D9E75',
      bg: pendingDeclaraties > 0 ? '#EDE9FE' : '#E1F5EE',
      tab: 'declaraties',
    },
    {
      label: 'Gesprekken',
      value: String(gesprekkenDezeMaand),
      sub: 'deze maand gepland',
      color: gesprekkenDezeMaand > 0 ? '#185FA5' : '#9CA3AF',
      bg: gesprekkenDezeMaand > 0 ? '#E6F1FB' : '#F3F4F6',
      tab: 'gesprekken',
    },
    ...(discIngevuld !== undefined ? [{
      label: 'DISC ingevuld',
      value: teamGrootte > 0 ? `${Math.round((discIngevuld / teamGrootte) * 100)}%` : '—',
      sub: `${discIngevuld}/${teamGrootte} medewerkers`,
      color: teamGrootte > 0 && discIngevuld / teamGrootte >= 0.7 ? '#1D9E75' : discIngevuld > 0 ? '#BA7517' : '#9CA3AF',
      bg: teamGrootte > 0 && discIngevuld / teamGrootte >= 0.7 ? '#E1F5EE' : discIngevuld > 0 ? '#FAEEDA' : '#F3F4F6',
      tab: null,
    }] : []),
  ]

  return (
    <div
      className="flex gap-3 mb-6 overflow-x-auto pb-1"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
    >
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          onClick={() => kpi.tab && onTabSwitch(kpi.tab)}
          className="bg-white rounded-2xl border border-gray-100 p-4 flex-shrink-0"
          style={{
            cursor: kpi.tab ? 'pointer' : 'default',
            borderTop: `3px solid ${kpi.color}`,
            minWidth: 140,
            flex: '1 1 0',
          }}
        >
          <p className="text-xs text-gray-400 mb-1 whitespace-nowrap">{kpi.label}</p>
          <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          <p className="text-xs mt-1 leading-tight" style={{ color: kpi.color }}>{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}
