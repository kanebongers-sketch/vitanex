import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { LidKaart } from '@/lib/club/leden/kaart'
import { datumKort, datumUitSleutel, laatsteBezoekTekst, tijdNl } from '@/lib/club/leden/tijd'

// De laatste bezoeken van een lid (check-ins), met de vestiging als die anders is.

const BRON_LABEL: Record<string, string> = { balie: 'Balie', qr: 'QR-code', bandje: 'Bandje', les: 'Les' }

interface LaatsteBezoekenProps {
  kaart: LidKaart
  nu: Date
  vestigingen: readonly VestigingInfo[]
}

export function LaatsteBezoeken({ kaart, nu, vestigingen }: LaatsteBezoekenProps) {
  const lijst = kaart.bezoeken.slice(0, 8)
  return (
    <section className="club-kaart" aria-labelledby="bezoeken-kop">
      <h2 id="bezoeken-kop">Laatste bezoeken</h2>
      {lijst.length ? (
        <ul className="club-lijst">
          {lijst.map((b) => {
            const elders = b.vestiging && b.vestiging !== kaart.lid.vestiging ? naamVan(vestigingen, b.vestiging) : null
            return (
              <li key={b.id} className="club-rij">
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">{laatsteBezoekTekst(b.op, nu)}</span>
                  <span className="club-rij-sub club-getal">{datumKort(b.op, nu)}, {tijdNl(b.op)}</span>
                </span>
                {elders ? <span className="club-chip club-chip--info">In {elders}</span> : null}
                <span className="club-chip club-chip--geen">{BRON_LABEL[b.bron] ?? b.bron}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="club-hint">
          {kaart.laatsteBezoek
            ? `Geen bezoek in de laatste 12 weken. Laatste bezoek: ${datumKort(kaart.laatsteBezoek, nu)}.`
            : `Nog nooit geweest.${kaart.lid.lidSinds ? ` Ingeschreven op ${datumUitSleutel(kaart.lid.lidSinds)}.` : ''}`}
        </p>
      )}
    </section>
  )
}
