'use client'

import DienstKaart, { type Dienst } from './DienstKaart'
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/Table'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'

function maandag(datum: Date): Date {
  const d = new Date(datum)
  const dag = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (dag - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
}

interface WeekRoosterViewProps {
  diensten: Dienst[]
  weekStart?: Date   // standaard: huidige week
  toonNaam?: boolean // HR-view: toon medewerkersnamen
}

export default function WeekRoosterView({ diensten, weekStart, toonNaam = false }: WeekRoosterViewProps) {
  const { t, taal } = useVertaling()
  const ma = maandag(weekStart ?? new Date())
  const dagNaam = new Intl.DateTimeFormat(INTL_LOCALE[taal], { weekday: 'short' })

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d
  })

  const vandaagStr = toYMD(new Date())

  return (
    <Table caption={t('werk.weekRooster.caption')}>
      <THead>
        <Tr>
          {dagen.map((dag) => {
            const ymd = toYMD(dag)
            const isVandaag = ymd === vandaagStr
            return (
              <Th
                key={ymd}
                scope="col"
                align="center"
                aria-current={isVandaag ? 'date' : undefined}
                style={{
                  minWidth: 110,
                  color: isVandaag ? 'var(--mentaforce-primary)' : 'var(--text-3)',
                  borderBottom: isVandaag ? '2px solid var(--mentaforce-primary)' : undefined,
                }}
              >
                <span style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>{dagNaam.format(dag)}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    marginTop: 4,
                    borderRadius: '50%',
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: 'none',
                    letterSpacing: 'normal',
                    background: isVandaag ? 'var(--mentaforce-primary)' : 'transparent',
                    color: isVandaag ? 'var(--bg-app)' : 'var(--text-1)',
                  }}
                >
                  {dag.getDate()}
                  {isVandaag && <span style={SR_ONLY}>{t('werk.weekRooster.vandaagSr')}</span>}
                </span>
              </Th>
            )
          })}
        </Tr>
      </THead>
      <TBody>
        <Tr style={{ borderBottom: 'none' }}>
          {dagen.map(dag => {
            const ymd = toYMD(dag)
            const isVandaag = ymd === vandaagStr
            const dagDiensten = diensten.filter(d => d.datum === ymd)
            return (
              <Td
                key={ymd}
                align="center"
                style={{
                  verticalAlign: 'top',
                  padding: '8px',
                  background: isVandaag ? 'var(--mentaforce-primary-light)' : undefined,
                }}
              >
                {dagDiensten.length === 0 ? (
                  <span style={{ color: 'var(--text-4)', fontSize: 11 }} aria-label={t('werk.weekRooster.geenDiensten')}>
                    –
                  </span>
                ) : (
                  dagDiensten.map(d => (
                    <DienstKaart key={d.id} dienst={d} toonNaam={toonNaam} compact />
                  ))
                )}
              </Td>
            )
          })}
        </Tr>
      </TBody>
    </Table>
  )
}
