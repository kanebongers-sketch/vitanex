import { padVan, sparkStukken } from '@/lib/club/ontwerp/reeks'

// Een sparklijn: het verloop van een cijfer in een oogopslag. Rechte stukken
// (een gladde curve verzint waarden), een gat waar geen data is, eerdere
// perioden in een rustige grijstint en alleen het laatste punt in de
// datakleur van de sportschool (--club-data). Geen as: de tegel ernaast
// noemt het getal, de sparklijn laat alleen de richting zien.

interface SparklijnProps {
  waarden: readonly (number | null)[]
  /** Voor schermlezers: wat de lijn laat zien. */
  label: string
  breedte?: number
  hoogte?: number
  /** Het laatste punt is een lopende periode (bv. de maand van vandaag). */
  lopend?: boolean
}

export function Sparklijn({ waarden, label, breedte = 120, hoogte = 32, lopend = false }: SparklijnProps) {
  const stukken = sparkStukken(waarden, breedte, hoogte, 3)
  if (stukken.length === 0) return null
  const laatsteStuk = stukken[stukken.length - 1]
  const laatste = laatsteStuk[laatsteStuk.length - 1]
  const heeftLaatste = typeof waarden[waarden.length - 1] === 'number'
  return (
    <svg className="club-spark" viewBox={`0 0 ${breedte} ${hoogte}`} width={breedte} height={hoogte} role="img" aria-label={label}>
      <line className="club-spark-basis" x1="0" x2={breedte} y1={hoogte - 0.5} y2={hoogte - 0.5} />
      {stukken.map((s) => (
        <path key={`${s[0].x}-${s.length}`} className="club-spark-lijn" d={padVan(s)} />
      ))}
      {heeftLaatste && <circle className="club-spark-punt" data-lopend={lopend || undefined} cx={laatste.x} cy={laatste.y} r={3} />}
    </svg>
  )
}
