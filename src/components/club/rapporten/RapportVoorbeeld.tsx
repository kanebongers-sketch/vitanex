import { Download } from 'lucide-react'
import { laatsteDag, maandNaam, maandVan } from '@/lib/club/cijfers/maand'
import { dagLang } from '@/lib/club/cijfers/tijd'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { RAPPORTEN } from '@/lib/club/rapporten/definities'
import { MAX_RIJEN, VOORBEELD_RIJEN, type CsvWaarde } from '@/lib/club/rapporten/csv'
import type { RapportUitkomst } from '@/lib/club/rapporten/haal'
import type { RapportKeuze } from '@/lib/club/rapporten/keuze'

// Het voorbeeld: hoeveel rijen, over welke maand en vestigingen, de knop om
// te downloaden en de eerste rijen precies zoals ze in de CSV komen.

interface Props {
  keuze: RapportKeuze
  uitkomst: RapportUitkomst
  vestigingen: readonly VestigingInfo[]
  alle: boolean
  vandaag: string
  csvHref: string
}

const AANTAL = new Intl.NumberFormat('nl-NL')
const GETAL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 })

function Cel({ waarde }: { waarde: CsvWaarde }) {
  if (waarde === null || waarde === '') return <td className="club-zacht" aria-label="leeg" />
  if (typeof waarde === 'number') return <td className="club-getal club-rapporten-getal">{GETAL.format(waarde)}</td>
  return <td>{waarde}</td>
}

/** Rijen in het hele rapport (en dus in de CSV, hoogstens MAX_RIJEN); de tabel zelf heeft alleen het voorbeeld. */
function aantalRijen(uitkomst: RapportUitkomst): number {
  return uitkomst.ok ? Math.min(uitkomst.tabel.totaal, MAX_RIJEN) : 0
}

function waarNaam(keuze: RapportKeuze, vestigingen: readonly VestigingInfo[], alle: boolean): string {
  if (alle && vestigingen.length > 1) return `Alle ${vestigingen.length} vestigingen`
  return keuze.vestigingen.map((v) => naamVan(vestigingen, v)).join(', ')
}

export function RapportVoorbeeld({ keuze, uitkomst, vestigingen, alle, vandaag, csvHref }: Props) {
  const def = RAPPORTEN[keuze.rapport]
  const lopend = maandVan(vandaag) === keuze.maand
  const eind = Number(laatsteDag(keuze.maand).slice(8, 10))
  const aantal = aantalRijen(uitkomst)
  return (
    <section className="club-rapporten-resultaat" aria-labelledby="rapport-titel" aria-live="polite">
      <header className="club-rapporten-samenvatting">
        <div className="club-rapporten-wat">
          <p className="club-boventitel">{waarNaam(keuze, vestigingen, alle)}</p>
          <h2 id="rapport-titel">{def.titel}</h2>
          <p className="club-rapporten-periode">
            1 tot en met {eind} {maandNaam(keuze.maand)}
            {lopend && (
              <>
                {' '}
                <span className="club-chip club-chip--merk">Lopende maand</span> tot en met vandaag ({dagLang(vandaag)})
              </>
            )}
          </p>
        </div>
        {uitkomst.ok && (
          <div className="club-rapporten-teller">
            <span className="club-rapporten-reus">{AANTAL.format(aantal)}</span>
            <span className="club-rapporten-teller-label">{aantal === 1 ? 'rij' : 'rijen'}</span>
          </div>
        )}
        {uitkomst.ok && aantal > 0 && (
          <a className="club-knop club-knop--primair club-knop--groot club-rapporten-download" href={csvHref} download>
            <Download aria-hidden size={18} />
            Download CSV
          </a>
        )}
      </header>

      {!uitkomst.ok ? (
        <p className="club-melding club-melding--fout" role="alert">
          {uitkomst.fout}
        </p>
      ) : (
        <Inhoud uitkomst={uitkomst} />
      )}

      <footer className="club-rapporten-voet">
        <p>
          <strong>Zo is het geteld.</strong> {def.telling}
        </p>
        <p>CSV voor Excel: puntkomma als scheiding, UTF-8, datums als dd-mm-jjjj, uren met een komma. Elke download komt in het logboek.</p>
      </footer>
    </section>
  )
}

function Inhoud({ uitkomst }: { uitkomst: Extract<RapportUitkomst, { ok: true }> }) {
  const { tabel, onvolledig } = uitkomst
  const aantal = aantalRijen(uitkomst)
  if (aantal === 0) return <p className="club-leeg">Geen gegevens in deze maand voor de gekozen vestigingen.</p>
  const voorbeeld = tabel.rijen.slice(0, VOORBEELD_RIJEN)
  return (
    <>
      {(tabel.afgekapt || onvolledig) && (
        <p className="club-melding club-melding--fout" role="status">
          {tabel.afgekapt
            ? `Dit rapport heeft ${AANTAL.format(tabel.totaal)} rijen; de export bevat de eerste ${AANTAL.format(MAX_RIJEN)}. Kies minder vestigingen voor een volledig bestand.`
            : 'Niet alle gegevens konden worden geladen; de cijfers zijn een ondergrens.'}
        </p>
      )}
      <div className="club-tabel-wrap club-rapporten-tabel">
        <table className="club-tabel">
          <caption className="club-sr">Voorbeeld: de eerste {voorbeeld.length} rijen</caption>
          <thead>
            <tr>
              {tabel.kolommen.map((k) => (
                <th key={k} scope="col">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {voorbeeld.map((rij, i) => (
              <tr key={i}>
                {rij.map((w, j) => (
                  <Cel key={j} waarde={w} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="club-rapporten-meer">
        {aantal > voorbeeld.length
          ? `Je ziet de eerste ${voorbeeld.length} van ${AANTAL.format(aantal)} rijen. De download bevat ze allemaal.`
          : `Dit zijn alle ${AANTAL.format(aantal)} ${aantal === 1 ? 'rij' : 'rijen'}.`}
      </p>
    </>
  )
}
