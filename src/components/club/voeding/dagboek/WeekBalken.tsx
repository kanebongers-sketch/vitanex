import { weekGemiddelde, type WeekDag } from '@/lib/club/voeding/dagboek/berekeningen'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// Het weekoverzicht: zeven staafjes kcal per dag met de doellijn erdoor, en het
// gemiddelde over de dagen waarop iets gelogd is. Puur; ook gebruikt op de
// ledenkaart in Club. Een tik op een dag opent die dag (alleen in de app).

interface WeekBalkenProps {
  week: readonly WeekDag[]
  doelKcal: number | null
  actief?: string
  t: VoedingDagboekTekst
  taal: Taal
  onKies?: (dag: string) => void
}

export function WeekBalken({ week, doelKcal, actief, t, taal, onKies }: WeekBalkenProps) {
  const hoogste = Math.max(doelKcal ?? 0, ...week.map((d) => d.totaal.kcal), 1)
  const gem = weekGemiddelde(week)
  const lijn = doelKcal ? 100 - (doelKcal / hoogste) * 100 : null
  return (
    <div className="club-vd-week">
      <div className="club-vd-week-balken">
        {lijn !== null && <span className="club-vd-week-lijn" style={{ top: `${lijn}%` }} aria-hidden />}
        {week.map((d) => {
          const hoogte = Math.max(d.gelogd ? 4 : 0, (d.totaal.kcal / hoogste) * 100)
          const naam = formatDatum(`${d.datum}T12:00:00Z`, taal, 'weekdag')
          const label = t.week.dagLabel(formatDatum(`${d.datum}T12:00:00Z`, taal, 'dag'), d.totaal.kcal)
          const over = doelKcal !== null && d.totaal.kcal > doelKcal
          const inhoud = (
            <>
              <span className="club-vd-week-spoor" aria-hidden>
                <span className={`club-vd-week-balk${over ? ' is-over' : ''}`} style={{ transform: `scaleY(${hoogte / 100})` }} />
              </span>
              <span className="club-vd-week-dag" aria-hidden>{naam}</span>
            </>
          )
          return onKies ? (
            <button key={d.datum} type="button" className={`club-vd-week-kolom${d.datum === actief ? ' is-actief' : ''}`} onClick={() => onKies(d.datum)} aria-label={label} aria-pressed={d.datum === actief}>
              {inhoud}
            </button>
          ) : (
            <div key={d.datum} className="club-vd-week-kolom" role="img" aria-label={label}>
              {inhoud}
            </div>
          )
        })}
      </div>
      <p className="club-vd-hint">
        {gem ? t.week.gemiddeld(gem.kcal, gem.dagen) : t.week.leeg}
        {gem && doelKcal ? ` · ${t.week.doelLijn}` : ''}
      </p>
    </div>
  )
}
