import type { Metadata } from 'next'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import { haalTermijnen } from '@/lib/club/privacy/opslag'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { PrivacyTermijnenFormulier } from '@/components/club/beheer/PrivacyTermijnenFormulier'
import '@/components/club/beheer/beheer.css'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('privacy')
}

// Bewaartermijnen van de sportschool: wat de eigenaar zelf kiest (leads,
// oud-leden, bezoeken, logboek) en wat vast staat. Alleen Kane en de eigenaar
// (eisBeheerdersBeheer).

export default async function PrivacyInstellenPagina() {
  const t = await eisBeheerdersBeheer()
  const termijnen = await haalTermijnen(t.admin, t.userId)
  const sleutel = termijnen ? Object.values(termijnen).join('-') : 'fout'
  const kop = await instelKop('privacy')
  const tekst = (await clubTekst(BEHEER)).privacy

  return (
    <>
      <InstelKruimel id="privacy" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>

      <p className="club-hint club-privacy-intro">{tekst.verantwoordelijk}</p>

      {termijnen ? (
        <PrivacyTermijnenFormulier key={sleutel} begin={termijnen} />
      ) : (
        <p className="club-melding club-melding--fout">{tekst.laadFout}</p>
      )}

      <section className="club-privacy-vast" aria-labelledby="privacy-vast-kop">
        <h2 id="privacy-vast-kop">{tekst.vastKop}</h2>
        <p className="club-hint">{tekst.vastUitleg}</p>
        <div className="club-tabel-wrap">
          <table className="club-tabel">
            <thead>
              <tr>
                <th scope="col">{tekst.gegevens}</th>
                <th scope="col">{tekst.bewaard}</th>
                <th scope="col">{tekst.toelichting}</th>
              </tr>
            </thead>
            <tbody>
              {tekst.vast.map((v) => (
                <tr key={v.onderwerp}>
                  <th scope="row">{v.onderwerp}</th>
                  <td className="club-privacy-termijntekst">{v.termijn}</td>
                  <td>{v.uitleg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
