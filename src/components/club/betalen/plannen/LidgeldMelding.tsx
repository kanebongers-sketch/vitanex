// De eerlijke stand van lidgeld boven plannen en kortingen: in schaduwmodus of
// met incasso uit wordt er niets geincasseerd. Kane ziet ook wanneer lidgeld bij
// deze sportschool nog uit staat (alleen voor het master account zichtbaar).

export interface LidgeldInfo {
  schaduw: boolean
  incassoAan: boolean
  /** Lidgeld staat bij deze sportschool uit; alleen Kane ziet dit om te testen. */
  alleenKane: boolean
}

export function LidgeldMelding({ schaduw, incassoAan, alleenKane }: LidgeldInfo) {
  const tekst = schaduw
    ? 'er wordt nog niets geincasseerd. Je kunt alles rustig instellen en controleren.'
    : 'incasso staat uit, er wordt nog niets geincasseerd.'
  return (
    <div className="club-lidgeld-meldingen">
      {(schaduw || !incassoAan) && (
        <p className="club-lidgeld-melding" role="note">
          <strong>{schaduw ? 'Schaduwmodus:' : 'Lidgeld:'}</strong>
          <span>{tekst}</span>
        </p>
      )}
      {alleenKane && (
        <p className="club-lidgeld-melding" role="note">
          <strong>Alleen voor jou:</strong>
          <span>lidgeld staat bij deze sportschool nog uit. De eigenaar ziet prijs en contract pas als lidgeld aan staat.</span>
        </p>
      )}
    </div>
  )
}
