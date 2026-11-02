import type { Metadata } from 'next'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { DAGEN, haalSysteemStand } from '@/lib/club/betrouwbaarheid/systeem-opslag'
import { foutenPerDag, leesbareGrootte, opslagProcent } from '@/lib/club/betrouwbaarheid/overzicht'
import { koppelingenStand } from '@/lib/club/platform/koppelingen-stand'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { Koppelingen } from '@/components/club/systeem/Koppelingen'
import '@/components/club/platform/platform.css'
import '@/components/club/systeem/systeem.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(PLATFORM)).systeem.titel }
}
export const dynamic = 'force-dynamic'

// Systeem (alleen het master account): werken mail, meldingen en Stripe
// (koppelingen, uit de env van de server, alleen namen), de stand van de
// database en de serverfouten van de laatste twee weken.

export default async function SysteemPagina() {
  const t = await eisPlatformEigenaar()
  const taal = await getTaal()
  const s = PLATFORM[taal].systeem
  const { stand, vandaag } = await haalSysteemStand(t.admin)
  const dagen = foutenPerDag(stand.rijen, vandaag, DAGEN)
  const totaal = dagen.reduce((som, d) => som + d.totaal, 0)
  const vandaagFouten = dagen.at(-1)?.totaal ?? 0
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{s.boventitel}</p>
          <h1>{s.titel}</h1>
          <p>{s.intro}</p>
        </div>
      </header>

      <Koppelingen diensten={koppelingenStand(process.env)} t={s.koppelingen} />

      <section className="club-systeem-blok" aria-labelledby="db-kop">
        <div className="club-sectiekop"><h2 id="db-kop">{s.dbKop}</h2></div>
        <div className="club-tegels">
          <div className="club-tegel">
            <p className="club-tegel-label">{s.database}</p>
            <p className="club-tegel-getal club-systeem-getal">{s.stand[stand.db.stand].label}</p>
            <p className="club-tegel-sub">{stand.postgresVersie ? s.postgres(stand.postgresVersie) : s.stand[stand.db.stand].uitleg}</p>
          </div>
          <div className="club-tegel">
            <p className="club-tegel-label">{s.reactietijd}</p>
            <p className="club-tegel-getal club-systeem-getal">{stand.db.ms} {s.ms}</p>
            <p className="club-tegel-sub">{s.reactieUitleg}</p>
          </div>
          <div className="club-tegel">
            <p className="club-tegel-label">{s.opslag}</p>
            <p className="club-tegel-getal club-systeem-getal">{stand.databaseBytes !== null ? leesbareGrootte(stand.databaseBytes) : '?'}</p>
            <p className="club-tegel-sub">{stand.databaseBytes !== null ? s.opslagDeel(opslagProcent(stand.databaseBytes)) : s.grootteFout}</p>
          </div>
          <div className="club-tegel">
            <p className="club-tegel-label">{s.foutenVandaag}</p>
            <p className="club-tegel-getal club-systeem-getal">{vandaagFouten}</p>
            <p className="club-tegel-sub">{s.foutenTotaal(totaal, DAGEN)}</p>
          </div>
        </div>
      </section>

      <section className="club-systeem-blok" aria-labelledby="fouten-kop">
        <div className="club-sectiekop"><h2 id="fouten-kop">{s.laatste}</h2><span className="club-hint">{s.bewaard}</span></div>
        {stand.leesFout && <p className="club-melding club-melding--fout" role="alert">{s.leesFout}</p>}
        {!stand.leesFout && stand.laatste.length === 0 && <p className="club-leeg">{s.geenFouten}</p>}
        {stand.laatste.length > 0 && (
          <div className="club-tabel-wrap">
            <table className="club-tabel">
              <caption className="club-sr">{s.laatsteTabel}</caption>
              <thead>
                <tr><th scope="col">{s.laatst}</th><th scope="col">{s.onderdeel}</th><th scope="col">{s.route}</th><th scope="col">{s.melding}</th><th scope="col">{s.keer}</th></tr>
              </thead>
              <tbody>
                {stand.laatste.map((f) => (
                  <tr key={f.id}>
                    <td>{formatDatum(f.laatstOp, taal, 'dagMaand')} {formatTijd(f.laatstOp, taal)}</td>
                    <td>{s.gebied[f.gebied]}{f.soort ? ` · ${s.soort[f.soort]}` : ''}</td>
                    <td><code>{f.methode ? `${f.methode} ` : ''}{f.route}</code></td>
                    <td className="club-systeem-melding-cel">{f.melding}</td>
                    <td className="club-getal">{f.aantal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
