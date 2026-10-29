import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import type { LidKaart } from '@/lib/club/leden/kaart'
import { datumKort, datumUitSleutel, laatsteBezoekTekst, tijdNl } from '@/lib/club/leden/tijd'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// De laatste bezoeken van een lid (check-ins), met de vestiging als die anders is.

interface LaatsteBezoekenProps {
  kaart: LidKaart
  nu: Date
  vestigingen: readonly VestigingInfo[]
}

export async function LaatsteBezoeken({ kaart, nu, vestigingen }: LaatsteBezoekenProps) {
  const taal = await getTaal()
  const t = LEDEN[taal].bezoeken
  const bron: Record<string, string> = t.bron
  const lijst = kaart.bezoeken.slice(0, 8)
  return (
    <section className="club-kaart" aria-labelledby="bezoeken-kop">
      <h2 id="bezoeken-kop">{t.kop}</h2>
      {lijst.length ? (
        <ul className="club-lijst">
          {lijst.map((b) => {
            const elders = b.vestiging && b.vestiging !== kaart.lid.vestiging ? naamVan(vestigingen, b.vestiging) : null
            return (
              <li key={b.id} className="club-rij">
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">{laatsteBezoekTekst(b.op, nu, taal)}</span>
                  <span className="club-rij-sub club-getal">{datumKort(b.op, nu, taal)}, {tijdNl(b.op)}</span>
                </span>
                {elders ? <span className="club-chip club-chip--info">{t.in(elders)}</span> : null}
                <span className="club-chip club-chip--geen">{bron[b.bron] ?? b.bron}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="club-hint">
          {kaart.laatsteBezoek
            ? t.geenRecent(datumKort(kaart.laatsteBezoek, nu, taal))
            : `${t.nooit}${kaart.lid.lidSinds ? ` ${t.ingeschrevenOp(datumUitSleutel(kaart.lid.lidSinds, taal) ?? '')}` : ''}`}
        </p>
      )}
    </section>
  )
}
