import { formatKlok } from './klok'

// De kloktijd van een moment op de voorpagina: groot in tabelcijfers, met de naam
// van het moment ernaast. Het typografische motief van de werkdag; op de telefoon
// (zonder vaste dagklok) is dit de klok.

interface DagTijdProps {
  minuten: number
  naam: string
  /** Op het podium (obsidiaan). */
  licht?: boolean
}

export function DagTijd({ minuten, naam, licht = false }: DagTijdProps) {
  const tijd = formatKlok(minuten)
  return (
    <p className={licht ? 'dag-tijd dag-tijd--licht' : 'dag-tijd'}>
      <time dateTime={tijd}>{tijd}</time>
      <span>{naam}</span>
    </p>
  )
}
