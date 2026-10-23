// Een rij keuzechips (radio) voor het prijsformulier, in de stijl van het
// demo-formulier (dem-chip in demo-aanvraag.css).

interface KeuzesProps {
  naam: string
  legende: string
  opties: readonly { sleutel: string; label: string }[]
  gekozen: string
  fout?: string
  onKies: (sleutel: string) => void
}

export function Keuzes({ naam, legende, opties, gekozen, fout, onKies }: KeuzesProps) {
  const foutId = `prijs-${naam}-fout`
  return (
    <fieldset className="aan-fieldset dem-momenten" data-fout={fout ? 'ja' : undefined} aria-describedby={fout ? foutId : undefined}>
      <legend className="aan-label">{legende}</legend>
      <div className="dem-chips">
        {opties.map((o, i) => (
          <label key={o.sleutel} className="dem-chip" data-gekozen={gekozen === o.sleutel ? '' : undefined}>
            <input type="radio" name={naam} value={o.sleutel} checked={gekozen === o.sleutel} onChange={() => onKies(o.sleutel)} aria-invalid={fout && i === 0 ? true : undefined} />
            {o.label}
          </label>
        ))}
      </div>
      {fout && (
        <p id={foutId} className="aan-fout" role="alert">
          {fout}
        </p>
      )}
    </fieldset>
  )
}
