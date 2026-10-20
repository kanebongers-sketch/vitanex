import type { Metadata } from 'next'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import { haalTermijnen } from '@/lib/club/privacy/opslag'
import { VASTE_TERMIJNEN } from '@/lib/club/privacy/termijnen'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { PrivacyTermijnenFormulier } from '@/components/club/beheer/PrivacyTermijnenFormulier'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Privacy en bewaren' }

// Bewaartermijnen van de sportschool: wat de eigenaar zelf kiest (leads,
// oud-leden, bezoeken, logboek) en wat vast staat. Alleen Kane en de eigenaar
// (eisBeheerdersBeheer).

export default async function PrivacyInstellenPagina() {
  const t = await eisBeheerdersBeheer()
  const termijnen = await haalTermijnen(t.admin, t.userId)
  const sleutel = termijnen ? Object.values(termijnen).join('-') : 'fout'

  return (
    <>
      <InstelKruimel id="privacy" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Privacy en bewaren</h1>
          <p>Kies hoe lang Club gegevens van leads, oud-leden, bezoeken en het logboek bewaart. Elke nacht ruimt Club op wat ouder is.</p>
        </div>
      </header>

      <p className="club-hint club-privacy-intro">
        Jouw sportschool is verwerkingsverantwoordelijke: jij bepaalt de bewaartermijnen. AI Your Gym voert ze uit. Bewaar niet langer dan je nodig hebt. Dit is geen juridisch advies.
      </p>

      {termijnen ? (
        <PrivacyTermijnenFormulier key={sleutel} begin={termijnen} />
      ) : (
        <p className="club-melding club-melding--fout">De termijnen konden niet worden geladen. Probeer het opnieuw.</p>
      )}

      <section className="club-privacy-vast" aria-labelledby="privacy-vast-kop">
        <h2 id="privacy-vast-kop">Vaste termijnen</h2>
        <p className="club-hint">Deze gelden voor elke sportschool en zijn niet in te stellen. Demodata valt erbuiten.</p>
        <div className="club-tabel-wrap">
          <table className="club-tabel">
            <thead>
              <tr>
                <th scope="col">Gegevens</th>
                <th scope="col">Bewaard</th>
                <th scope="col">Toelichting</th>
              </tr>
            </thead>
            <tbody>
              {VASTE_TERMIJNEN.map((v) => (
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
