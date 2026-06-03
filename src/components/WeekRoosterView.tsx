'use client'

import DienstKaart, { type Dienst } from './DienstKaart'

const DAGEN = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

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

interface WeekRoosterViewProps {
  diensten: Dienst[]
  weekStart?: Date   // standaard: huidige week
  toonNaam?: boolean // HR-view: toon medewerkersnamen
}

export default function WeekRoosterView({ diensten, weekStart, toonNaam = false }: WeekRoosterViewProps) {
  const ma = maandag(weekStart ?? new Date())

  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d
  })

  const vandaagStr = toYMD(new Date())

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, minmax(110px, 1fr))`, gap: 8, minWidth: 700 }}>
        {dagen.map((dag, i) => {
          const ymd = toYMD(dag)
          const isVandaag = ymd === vandaagStr
          const dagDiensten = diensten.filter(d => d.datum === ymd)

          return (
            <div
              key={ymd}
              className="rounded-2xl border"
              style={{
                background: isVandaag ? '#E1F5EE' : '#fff',
                borderColor: isVandaag ? '#1D9E75' : '#E5E7EB',
                padding: '10px 8px',
                minHeight: 100,
              }}
            >
              {/* Dag header */}
              <div style={{ marginBottom: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isVandaag ? '#1D9E75' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {DAGEN[i]}
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  background: isVandaag ? '#1D9E75' : 'transparent',
                  color: isVandaag ? '#fff' : '#111827',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '4px auto 0',
                }}>
                  {dag.getDate()}
                </div>
              </div>

              {/* Diensten */}
              {dagDiensten.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: '#D1D5DB', fontSize: 11 }}>–</div>
              ) : (
                dagDiensten.map(d => (
                  <DienstKaart key={d.id} dienst={d} toonNaam={toonNaam} compact />
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
