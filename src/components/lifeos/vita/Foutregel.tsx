import { TriangleAlert } from 'lucide-react'

/**
 * Eén foutregel: rood, met een icoon, en `role="alert"` zodat een screenreader
 * 'm meekrijgt zonder dat je 'm hoeft te zoeken.
 *
 * Bewust een eigen component, gedeeld door het gesprek en het geheugenpaneel: in
 * MentaForce bleek "fout" en "leeg" op drie plekken hetzelfde te renderen, en dat
 * gebeurt precies zo — door de foutstaat elke keer opnieuw over te schrijven tot
 * er één versie tussen zit die er te rustig uitziet.
 *
 * Voor een fout waar je iets aan kúnt doen (opnieuw proberen), zie `Fout` in
 * `VitaKaart` — die heeft een weg terug. Deze is voor een melding bij een
 * handeling die je zelf net deed.
 */
export function Foutregel({ melding }: { melding: string }) {
  return (
    <p
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        margin: '12px 0 0',
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--status-laag)',
      }}
    >
      <TriangleAlert size={13} strokeWidth={2.2} aria-hidden="true" style={{ flex: 'none' }} />
      {melding}
    </p>
  )
}
