import { Download } from 'lucide-react'
import { laatsteDag, maandNaam, maandVan } from '@/lib/club/cijfers/maand'
import { dagLang } from '@/lib/club/cijfers/tijd'
import { naamVan, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { MAX_RIJEN, VOORBEELD_RIJEN, type CsvWaarde } from '@/lib/club/rapporten/csv'
import type { RapportUitkomst } from '@/lib/club/rapporten/haal'
import type { RapportKeuze } from '@/lib/club/rapporten/keuze'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { RAPPORTEN_TEKST, kolomIn } from '@/lib/aiyourgym/taal/woorden/club/rapporten'

// Het voorbeeld: hoeveel rijen, over welke maand en vestigingen, de knop om
// te downloaden en de eerste rijen precies zoals ze in de CSV komen.

interface Props {
  keuze: RapportKeuze
  uitkomst: RapportUitkomst
  vestigingen: readonly VestigingInfo[]
  alle: boolean
  vandaag: string
  csvHref: string
  taal: Taal
}

type Tekst = (typeof RAPPORTEN_TEKST)['nl']

function Cel({ waarde, taal, leeg }: { waarde: CsvWaarde; taal: Taal; leeg: string }) {
  if (waarde === null || waarde === '') return <td className="club-zacht" aria-label={leeg} />
  if (typeof waarde === 'number') return <td className="club-getal club-rapporten-getal">{formatGetal(waarde, taal, { maximumFractionDigits: 2 })}</td>
  return <td>{waarde}</td>
}

/** Rijen in het hele rapport (en dus in de CSV, hoogstens MAX_RIJEN); de tabel zelf heeft alleen het voorbeeld. */
function aantalRijen(uitkomst: RapportUitkomst): number {
  return uitkomst.ok ? Math.min(uitkomst.tabel.totaal, MAX_RIJEN) : 0
}

function waarNaam(keuze: RapportKeuze, vestigingen: readonly VestigingInfo[], alle: boolean, t: Tekst): string {
  if (alle && vestigingen.length > 1) return t.voorbeeld.alleN(vestigingen.length)
  return keuze.vestigingen.map((v) => naamVan(vestigingen, v)).join(', ')
}

export function RapportVoorbeeld({ keuze, uitkomst, vestigingen, alle, vandaag, csvHref, taal }: Props) {
  const t = RAPPORTEN_TEKST[taal]
  const def = t.rapporten[keuze.rapport]
  const lopend = maandVan(vandaag) === keuze.maand
  const eind = Number(laatsteDag(keuze.maand).slice(8, 10))
  const aantal = aantalRijen(uitkomst)
  return (
    <section className="club-rapporten-resultaat" aria-labelledby="rapport-titel" aria-live="polite">
      <header className="club-rapporten-samenvatting">
        <div className="club-rapporten-wat">
          <p className="club-boventitel">{waarNaam(keuze, vestigingen, alle, t)}</p>
          <h2 id="rapport-titel">{def.titel}</h2>
          <p className="club-rapporten-periode">
            {t.voorbeeld.periode(eind, maandNaam(keuze.maand, taal))}
            {lopend && (
              <>
                {' '}
                <span className="club-chip club-chip--merk">{t.voorbeeld.lopend}</span> {t.voorbeeld.totVandaag(dagLang(vandaag, taal))}
              </>
            )}
          </p>
        </div>
        {uitkomst.ok && (
          <div className="club-rapporten-teller">
            <span className="club-rapporten-reus">{formatGetal(aantal, taal)}</span>
            <span className="club-rapporten-teller-label">{t.voorbeeld.rijen(aantal)}</span>
          </div>
        )}
        {uitkomst.ok && aantal > 0 && (
          <a className="club-knop club-knop--primair club-knop--groot club-rapporten-download" href={csvHref} download>
            <Download aria-hidden size={18} />
            {t.voorbeeld.download}
          </a>
        )}
      </header>

      {!uitkomst.ok ? (
        <p className="club-melding club-melding--fout" role="alert">
          {taal === 'nl' ? uitkomst.fout : t.voorbeeld.fout}
        </p>
      ) : (
        <Inhoud uitkomst={uitkomst} taal={taal} t={t} />
      )}

      <footer className="club-rapporten-voet">
        <p>
          <strong>{t.voorbeeld.geteld}</strong> {def.telling}
        </p>
        <p>{t.voorbeeld.csvUitleg}</p>
      </footer>
    </section>
  )
}

function Inhoud({ uitkomst, taal, t }: { uitkomst: Extract<RapportUitkomst, { ok: true }>; taal: Taal; t: Tekst }) {
  const { tabel, onvolledig } = uitkomst
  const aantal = aantalRijen(uitkomst)
  if (aantal === 0) return <p className="club-leeg">{t.voorbeeld.geenGegevens}</p>
  const voorbeeld = tabel.rijen.slice(0, VOORBEELD_RIJEN)
  const getal = (n: number) => formatGetal(n, taal)
  return (
    <>
      {(tabel.afgekapt || onvolledig) && (
        <p className="club-melding club-melding--fout" role="status">
          {tabel.afgekapt ? t.voorbeeld.afgekapt(getal(tabel.totaal), getal(MAX_RIJEN)) : t.voorbeeld.onvolledig}
        </p>
      )}
      <div className="club-tabel-wrap club-rapporten-tabel">
        <table className="club-tabel">
          <caption className="club-sr">{t.voorbeeld.bijschrift(voorbeeld.length)}</caption>
          <thead>
            <tr>
              {tabel.kolommen.map((k) => (
                <th key={k} scope="col">
                  {kolomIn(k, taal)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {voorbeeld.map((rij, i) => (
              <tr key={i}>
                {rij.map((w, j) => (
                  <Cel key={j} waarde={w} taal={taal} leeg={t.voorbeeld.leeg} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="club-rapporten-meer">{aantal > voorbeeld.length ? t.voorbeeld.eerste(voorbeeld.length, getal(aantal)) : t.voorbeeld.alle(getal(aantal), aantal)}</p>
    </>
  )
}
